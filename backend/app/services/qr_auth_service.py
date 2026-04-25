"""QR-login flow.

Visible payload format:  TNGWALLET:USER=<userId>
HMAC secret:             derived from JWT_ACCESS_SECRET so we don't need a
                         separate env var; use a labelled HKDF-style derivation
                         so the same JWT secret can't accidentally collide.
"""
import base64
import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import env
from ..errors import Errors
from ..models import User
from ..security import verify_pin
from ..services.security.qr_stega import (
    StegaError,
    generate_stega_qr,
    verify_stega_qr,
)

VISIBLE_PREFIX = "TNGWALLET:USER="


def _stega_secret() -> bytes:
    """Derive a 32-byte HMAC key from JWT_ACCESS_SECRET + a domain label."""
    return hashlib.sha256(("qr-stega-v1::" + env.JWT_ACCESS_SECRET).encode("utf-8")).digest()


async def issue_qr_for_user(session: AsyncSession, *, phone: str, pin: str) -> dict:
    """Authenticate (phone+PIN) and return a fresh stega QR PNG (base64) for
    that user. The QR is valid for 60 seconds — long enough to scan & log in,
    short enough that screenshotting is mostly useless."""
    user = (await session.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
    if not user or not user.isActive:
        raise Errors.unauthenticated("Invalid phone or PIN")
    if not verify_pin(pin, user.pinHash):
        raise Errors.unauthenticated("Invalid phone or PIN")

    visible = f"{VISIBLE_PREFIX}{user.id}"
    png, ts, tag = generate_stega_qr(visible, _stega_secret())
    return {
        "image": "data:image/png;base64," + base64.b64encode(png).decode("ascii"),
        "visiblePayload": visible,
        "issuedAt": ts,
        "tag": f"{tag:08x}",
        "expiresInSeconds": 60,
    }


async def login_with_qr(session: AsyncSession, *, image_bytes: bytes) -> User:
    """Validate stega + lookup user. Caller is responsible for issuing tokens."""
    try:
        payload = verify_stega_qr(image_bytes, _stega_secret())
    except StegaError as e:
        raise Errors.unauthenticated(f"QR validation failed: {e}")
    except Exception as e:
        raise Errors.unauthenticated(f"QR scan failed: {e}")

    if not payload.startswith(VISIBLE_PREFIX):
        raise Errors.unauthenticated("Unknown QR payload format")
    user_id = payload[len(VISIBLE_PREFIX):]

    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user or not user.isActive:
        raise Errors.unauthenticated("Account not found or disabled")
    return user
