"""Invites: per-pool create/list, top-level accept/decline, QR stega."""
import base64
import hashlib
import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth_dep import AuthCtx, require_auth
from ..config import env
from ..db import get_session
from ..enums import InviteStatus, MemberRole, NotificationType
from ..errors import Errors
from ..models import Notification, PoolInvite, PoolMember, User
from ..publisher import publish_to_pool
from ..schemas.member import CreateInviteIn
from ..serialize import model_to_dict
from ..services.pool_service import assert_pool_admin
from ..services.security.qr_stega import (
    StegaError,
    generate_stega_qr,
    verify_stega_qr,
)

pool_invites_router = APIRouter()
invite_actions_router = APIRouter()

_NANO_ALPHABET = string.ascii_uppercase + string.digits
_QR_INVITE_EXPIRY_SECONDS = 300
_QR_PAYLOAD_PREFIX = "POOL_INVITE:"


class QrAcceptIn(BaseModel):
    image: str


def _invite_stega_secret() -> bytes:
    """Derive a 32-byte HMAC key for invite QR steganography."""
    return hashlib.sha256(
        ("qr-invite-stega-v1::" + env.JWT_ACCESS_SECRET).encode("utf-8")
    ).digest()


def _make_code(n: int = 10) -> str:
    return "".join(secrets.choice(_NANO_ALPHABET) for _ in range(n))


@pool_invites_router.post("", status_code=status.HTTP_201_CREATED)
async def create_invite(pool_id: str, body: CreateInviteIn,
                        auth: AuthCtx = Depends(require_auth),
                        session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    code = _make_code()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=body.expiresInHours)

    receiver_id = None
    if body.phone:
        u = (await session.execute(select(User).where(User.phone == body.phone))).scalar_one_or_none()
        receiver_id = u.id if u else None

    invite = PoolInvite(
        poolId=pool_id, senderId=auth.user_id, receiverId=receiver_id,
        invitePhone=body.phone, inviteCode=code, expiresAt=expires_at,
    )
    session.add(invite)
    if receiver_id:
        session.add(Notification(
            userId=receiver_id, type=NotificationType.POOL_INVITE,
            title="You have a pool invite", body=f"Use code {code} to join.",
            metadata_={"poolId": pool_id, "inviteCode": code},
        ))
    await session.commit()
    await session.refresh(invite)
    out = model_to_dict(invite)
    out["shareUrl"] = f"tng://invites/{code}"
    return out


@pool_invites_router.get("")
async def list_invites(pool_id: str, auth: AuthCtx = Depends(require_auth),
                       session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    invites = (await session.execute(
        select(PoolInvite)
        .where(PoolInvite.poolId == pool_id, PoolInvite.status == InviteStatus.PENDING)
        .order_by(PoolInvite.createdAt.desc())
    )).scalars().all()
    return {"items": [model_to_dict(i) for i in invites]}


@invite_actions_router.post("/{code}/accept")
async def accept_invite(code: str, auth: AuthCtx = Depends(require_auth),
                        session: AsyncSession = Depends(get_session)):
    code = code.upper()
    invite = (await session.execute(
        select(PoolInvite).where(PoolInvite.inviteCode == code)
    )).scalar_one_or_none()
    if not invite:
        raise Errors.invite_invalid()
    if invite.status != InviteStatus.PENDING:
        raise Errors.conflict(f"Invite already {invite.status.value.lower()}")
    if invite.expiresAt < datetime.now(timezone.utc):
        invite.status = InviteStatus.EXPIRED
        await session.commit()
        raise Errors.invite_expired()

    existing = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == invite.poolId, PoolMember.userId == auth.user_id)
    )).scalar_one_or_none()
    if existing:
        existing.isActive = True
        existing.leftAt = None
        member = existing
    else:
        member = PoolMember(poolId=invite.poolId, userId=auth.user_id, role=MemberRole.MEMBER)
        session.add(member)
    invite.status = InviteStatus.ACCEPTED
    invite.receiverId = auth.user_id
    await session.commit()
    await session.refresh(member)
    publish_to_pool(invite.poolId, "member_joined", {"userId": auth.user_id})
    return model_to_dict(member, exclude=["zkProof"])


@invite_actions_router.post("/{code}/decline")
async def decline_invite(code: str, auth: AuthCtx = Depends(require_auth),
                         session: AsyncSession = Depends(get_session)):
    code = code.upper()
    invite = (await session.execute(
        select(PoolInvite).where(PoolInvite.inviteCode == code)
    )).scalar_one_or_none()
    if not invite:
        raise Errors.invite_invalid()
    if invite.status != InviteStatus.PENDING:
        raise Errors.conflict(f"Invite already {invite.status.value.lower()}")
    invite.status = InviteStatus.DECLINED
    invite.receiverId = auth.user_id
    await session.commit()
    await session.refresh(invite)
    return model_to_dict(invite)


# ── QR steganographic invite endpoints ────────────────────────────


@pool_invites_router.post("/qr", status_code=status.HTTP_201_CREATED)
async def create_invite_qr(
    pool_id: str,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    """Generate a steganographic QR code for an in-person pool invite."""
    await assert_pool_admin(session, pool_id, auth.user_id)

    code = _make_code()
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=_QR_INVITE_EXPIRY_SECONDS)

    invite = PoolInvite(
        poolId=pool_id,
        senderId=auth.user_id,
        inviteCode=code,
        expiresAt=expires_at,
    )
    session.add(invite)
    await session.commit()
    await session.refresh(invite)

    visible_payload = f"{_QR_PAYLOAD_PREFIX}{pool_id}:{code}"
    png_bytes, _ts, _tag = generate_stega_qr(visible_payload, _invite_stega_secret())
    b64_image = base64.b64encode(png_bytes).decode("ascii")

    return {
        "inviteCode": code,
        "image": f"data:image/png;base64,{b64_image}",
        "expiresInSeconds": _QR_INVITE_EXPIRY_SECONDS,
        "expiresAt": expires_at.isoformat(),
    }


@invite_actions_router.post("/qr-accept")
async def accept_invite_qr(
    body: QrAcceptIn,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    """Scan a steganographic QR invite image and join the pool."""
    # Decode base64 image
    raw = body.image
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[-1]
    try:
        image_bytes = base64.b64decode(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data")

    # Verify stega tag + time window
    try:
        payload = verify_stega_qr(
            image_bytes, _invite_stega_secret(), time_window_sec=_QR_INVITE_EXPIRY_SECONDS
        )
    except StegaError as exc:
        raise HTTPException(status_code=401, detail=f"QR validation failed: {exc}")

    # Parse visible payload
    if not payload.startswith(_QR_PAYLOAD_PREFIX):
        raise HTTPException(status_code=400, detail="Invalid QR payload format")
    remainder = payload[len(_QR_PAYLOAD_PREFIX):]
    parts = remainder.split(":", 1)
    if len(parts) != 2 or not parts[0] or not parts[1]:
        raise HTTPException(status_code=400, detail="Invalid QR payload format")
    pool_id, invite_code = parts

    # Look up invite
    invite = (
        await session.execute(
            select(PoolInvite).where(PoolInvite.inviteCode == invite_code)
        )
    ).scalar_one_or_none()
    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=410, detail=f"Invite already {invite.status.value.lower()}"
        )
    if invite.expiresAt < datetime.now(timezone.utc):
        invite.status = InviteStatus.EXPIRED
        await session.commit()
        raise HTTPException(status_code=410, detail="Invite expired")

    # Add user as pool member (same logic as text accept)
    existing = (
        await session.execute(
            select(PoolMember).where(
                PoolMember.poolId == invite.poolId,
                PoolMember.userId == auth.user_id,
            )
        )
    ).scalar_one_or_none()
    if existing:
        existing.isActive = True
        existing.leftAt = None
        member = existing
    else:
        member = PoolMember(
            poolId=invite.poolId, userId=auth.user_id, role=MemberRole.MEMBER
        )
        session.add(member)

    invite.status = InviteStatus.ACCEPTED
    invite.receiverId = auth.user_id
    await session.commit()
    await session.refresh(member)
    publish_to_pool(invite.poolId, "member_joined", {"userId": auth.user_id})
    return model_to_dict(member, exclude=["zkProof"])
