"""Auth service — register / login / refresh / logout.

Mirrors src/services/auth.service.ts. Tokens hashed with SHA-256 before
storage so a DB read alone can't reuse them.
"""
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..errors import Errors
from ..jwt_utils import sign_access, sign_refresh, verify_refresh
from ..models import RefreshToken, User
from ..security import hash_pin, verify_pin

REFRESH_TTL_DAYS = 7

_PUBLIC_FIELDS = (
    "id", "phone", "email", "fullName", "displayName", "avatarUrl",
    "kycStatus", "preferredLang", "mainBalance", "createdAt",
)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def public_user(u: User) -> dict[str, Any]:
    from ..serialize import model_to_dict
    return model_to_dict(u, include=_PUBLIC_FIELDS)


async def _issue_tokens(session: AsyncSession, user: User) -> dict[str, Any]:
    access = sign_access(user.id, user.phone)
    refresh, _jti = sign_refresh(user.id)
    rt = RefreshToken(
        userId=user.id,
        tokenHash=_hash_token(refresh),
        expiresAt=datetime.now(timezone.utc) + timedelta(days=REFRESH_TTL_DAYS),
    )
    session.add(rt)
    await session.commit()
    return {"user": public_user(user), "accessToken": access, "refreshToken": refresh}


async def register(session: AsyncSession, *, phone: str, pin: str, fullName: str,
                   displayName: str | None, email: str | None) -> dict[str, Any]:
    existing = (await session.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
    if existing:
        raise Errors.conflict("Phone number already registered")
    pin_h = hash_pin(pin)
    dn = displayName or (fullName.split(" ")[0] if fullName else fullName)
    user = User(
        phone=phone, pinHash=pin_h, fullName=fullName, displayName=dn, email=email,
    )
    session.add(user)
    await session.flush()
    return await _issue_tokens(session, user)


async def login(session: AsyncSession, *, phone: str, pin: str) -> dict[str, Any]:
    user = (await session.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
    if not user or not user.isActive:
        raise Errors.unauthenticated("Invalid phone or PIN")
    if not verify_pin(pin, user.pinHash):
        raise Errors.unauthenticated("Invalid phone or PIN")
    return await _issue_tokens(session, user)


async def refresh(session: AsyncSession, *, refresh_token: str) -> dict[str, Any]:
    try:
        payload = verify_refresh(refresh_token)
    except Exception:
        raise Errors.unauthenticated("Invalid refresh token")
    th = _hash_token(refresh_token)
    stored = (await session.execute(select(RefreshToken).where(RefreshToken.tokenHash == th))).scalar_one_or_none()
    if not stored or stored.revokedAt or stored.expiresAt < datetime.now(timezone.utc):
        raise Errors.unauthenticated("Refresh token expired or revoked")
    stored.revokedAt = datetime.now(timezone.utc)
    user = (await session.execute(select(User).where(User.id == payload["sub"]))).scalar_one_or_none()
    if not user:
        raise Errors.unauthenticated("User not found")
    await session.flush()
    return await _issue_tokens(session, user)


async def logout(session: AsyncSession, *, refresh_token: str) -> None:
    th = _hash_token(refresh_token)
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.tokenHash == th, RefreshToken.revokedAt.is_(None))
        .values(revokedAt=datetime.now(timezone.utc))
    )
    await session.commit()
