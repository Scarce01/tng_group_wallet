"""Invites: per-pool create/list, top-level accept/decline."""
import secrets
import string
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..enums import InviteStatus, MemberRole, NotificationType
from ..errors import Errors
from ..models import Notification, PoolInvite, PoolMember, User
from ..publisher import publish_to_pool
from ..schemas.member import CreateInviteIn
from ..serialize import model_to_dict
from ..services.pool_service import assert_pool_admin

pool_invites_router = APIRouter()
invite_actions_router = APIRouter()

_NANO_ALPHABET = string.ascii_uppercase + string.digits


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
