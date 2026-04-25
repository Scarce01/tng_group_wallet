"""Pool members: list / add / patch role / leave / remove."""
from decimal import Decimal

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..enums import ContributionStatus, MemberRole, NotificationType
from ..errors import Errors
from ..models import Contribution, Notification, PoolMember, User
from ..publisher import publish_to_pool
from ..schemas.member import AddMemberIn, UpdateMemberIn
from ..serialize import model_to_dict
from ..services.pool_service import assert_pool_admin, assert_pool_member

router = APIRouter()


def _ser_member(m: PoolMember, *, include_phone: bool = True, contributed: str = "0.00") -> dict:
    out = model_to_dict(m, exclude=["zkProof"])
    user_dict = {
        "id": m.user.id,
        "displayName": m.user.displayName,
        "avatarUrl": m.user.avatarUrl,
    }
    if include_phone:
        user_dict["phone"] = m.user.phone
    out["user"] = user_dict
    out["contributedTotal"] = contributed
    return out


@router.get("")
async def list_members(pool_id: str, auth: AuthCtx = Depends(require_auth),
                       session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    members = (await session.execute(
        select(PoolMember)
        .where(PoolMember.poolId == pool_id, PoolMember.isActive.is_(True))
        .options(selectinload(PoolMember.user))
        .order_by(PoolMember.joinedAt.asc())
    )).scalars().all()
    rows = (await session.execute(
        select(Contribution.userId, func.sum(Contribution.amount))
        .where(Contribution.poolId == pool_id, Contribution.status == ContributionStatus.COMPLETED)
        .group_by(Contribution.userId)
    )).all()
    totals = {uid: amt or Decimal("0") for uid, amt in rows}
    return {"items": [
        _ser_member(m, contributed=f"{(totals.get(m.userId, Decimal('0'))):.2f}")
        for m in members
    ]}


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_member(pool_id: str, body: AddMemberIn,
                     auth: AuthCtx = Depends(require_auth),
                     session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    target = (await session.execute(select(User).where(User.phone == body.phone))).scalar_one_or_none()
    if not target:
        raise Errors.not_found("User with this phone")

    existing = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == target.id)
    )).scalar_one_or_none()
    if existing and existing.isActive:
        raise Errors.conflict("User is already a member")

    if existing:
        existing.isActive = True
        existing.leftAt = None
        existing.role = body.role
        existing.contributionWeight = Decimal(str(body.contributionWeight))
        member = existing
    else:
        member = PoolMember(
            poolId=pool_id, userId=target.id, role=body.role,
            contributionWeight=Decimal(str(body.contributionWeight)),
        )
        session.add(member)
    session.add(Notification(
        userId=target.id, type=NotificationType.MEMBER_JOINED,
        title="Added to a pool", body="You were added to a pool.",
        metadata_={"poolId": pool_id},
    ))
    await session.commit()
    await session.refresh(member, attribute_names=["user"])
    publish_to_pool(pool_id, "member_added", {"member": model_to_dict(member, exclude=["zkProof"])})
    return model_to_dict(member, exclude=["zkProof"])


@router.patch("/{user_id}")
async def patch_member(pool_id: str, user_id: str, body: UpdateMemberIn,
                       auth: AuthCtx = Depends(require_auth),
                       session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == user_id)
    )).scalar_one_or_none()
    if not member:
        raise Errors.not_found("Membership")
    data = body.model_dump(exclude_none=True)
    if "role" in data:
        member.role = data["role"]
    if "contributionWeight" in data:
        member.contributionWeight = Decimal(str(data["contributionWeight"]))
    await session.commit()
    await session.refresh(member)
    publish_to_pool(pool_id, "member_updated", {"member": model_to_dict(member, exclude=["zkProof"])})
    return model_to_dict(member, exclude=["zkProof"])


@router.post("/{user_id}/leave")
async def leave(pool_id: str, user_id: str, auth: AuthCtx = Depends(require_auth),
                session: AsyncSession = Depends(get_session)):
    if user_id != auth.user_id:
        raise Errors.forbidden("Cannot leave on behalf of another user")
    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == auth.user_id)
    )).scalar_one_or_none()
    if not member or not member.isActive:
        raise Errors.not_found("Membership")
    if member.role == MemberRole.OWNER:
        raise Errors.conflict("Owner cannot leave the pool; transfer ownership first")
    from datetime import datetime, timezone as tz
    member.isActive = False
    member.leftAt = datetime.now(tz.utc)
    await session.commit()
    await session.refresh(member)
    publish_to_pool(pool_id, "member_left", {"userId": auth.user_id})
    return model_to_dict(member, exclude=["zkProof"])


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(pool_id: str, user_id: str,
                        auth: AuthCtx = Depends(require_auth),
                        session: AsyncSession = Depends(get_session)) -> Response:
    await assert_pool_admin(session, pool_id, auth.user_id)
    target = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == user_id)
    )).scalar_one_or_none()
    if not target:
        raise Errors.not_found("Membership")
    if target.role == MemberRole.OWNER:
        raise Errors.conflict("Cannot remove the owner")
    from datetime import datetime, timezone as tz
    target.isActive = False
    target.leftAt = datetime.now(tz.utc)
    await session.commit()
    publish_to_pool(pool_id, "member_removed", {"userId": user_id})
    return Response(status_code=status.HTTP_204_NO_CONTENT)
