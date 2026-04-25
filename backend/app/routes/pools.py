"""Pool CRUD: create / list / get / patch / archive / delete."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..enums import MemberRole, PoolStatus, PoolType, SpendStatus
from ..errors import Errors
from ..models import Pool, PoolMember, SpendRequest, Contribution, Transaction
from ..schemas.pool import CreatePoolIn, UpdatePoolIn
from ..serialize import model_to_dict
from ..services.pool_service import assert_pool_admin, assert_pool_member

router = APIRouter()


def _serialize_pool_member(m: PoolMember, *, include_phone: bool = False) -> dict:
    out = model_to_dict(m, exclude=["zkProof"])
    user = m.user
    user_dict = {
        "id": user.id,
        "displayName": user.displayName,
        "avatarUrl": user.avatarUrl,
    }
    if include_phone:
        user_dict["phone"] = user.phone
    out["user"] = user_dict
    return out


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_pool(body: CreatePoolIn, auth: AuthCtx = Depends(require_auth),
                      session: AsyncSession = Depends(get_session)):
    pool = Pool(
        type=body.type, name=body.name, description=body.description,
        coverImageUrl=body.coverImageUrl, targetAmount=body.targetAmount,
        spendLimit=body.spendLimit, approvalMode=body.approvalMode,
        approvalThreshold=body.approvalThreshold,
        emergencyOverride=body.emergencyOverride if body.type == "FAMILY" else False,
        startDate=body.startDate or datetime.now(timezone.utc),
        endDate=body.endDate, createdById=auth.user_id,
    )
    session.add(pool)
    await session.flush()
    session.add(PoolMember(poolId=pool.id, userId=auth.user_id, role=MemberRole.OWNER))
    await session.commit()

    members = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool.id).options(selectinload(PoolMember.user))
    )).scalars().all()
    out = model_to_dict(pool)
    out["members"] = [model_to_dict(m, exclude=["zkProof"]) for m in members]
    return out


@router.get("")
async def list_pools(
    type_: Annotated[Optional[str], Query(alias="type")] = None,
    status_: Annotated[Optional[str], Query(alias="status")] = None,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    # All pools where user is an active member, not archived, optional type/status filter
    pool_ids_q = select(PoolMember.poolId).where(
        PoolMember.userId == auth.user_id, PoolMember.isActive.is_(True)
    )
    q = select(Pool).where(Pool.id.in_(pool_ids_q), Pool.isArchived.is_(False))
    if type_:
        q = q.where(Pool.type == type_)
    if status_:
        q = q.where(Pool.status == status_)
    q = q.order_by(Pool.updatedAt.desc())
    pools = (await session.execute(q)).scalars().all()

    items = []
    for p in pools:
        members = (await session.execute(
            select(PoolMember)
            .where(PoolMember.poolId == p.id, PoolMember.isActive.is_(True))
            .options(selectinload(PoolMember.user))
        )).scalars().all()
        pending_count = (await session.execute(
            select(func.count()).select_from(SpendRequest)
            .where(SpendRequest.poolId == p.id, SpendRequest.status == SpendStatus.PENDING)
        )).scalar_one()
        out = model_to_dict(p)
        out["members"] = [_serialize_pool_member(m) for m in members]
        out["_count"] = {"spendRequests": int(pending_count)}
        items.append(out)
    return {"items": items}


@router.get("/{pool_id}")
async def get_pool(pool_id: str, auth: AuthCtx = Depends(require_auth),
                   session: AsyncSession = Depends(get_session)):
    pool, _ = await assert_pool_member(session, pool_id, auth.user_id)
    members = (await session.execute(
        select(PoolMember)
        .where(PoolMember.poolId == pool.id, PoolMember.isActive.is_(True))
        .options(selectinload(PoolMember.user))
    )).scalars().all()
    pending_count = (await session.execute(
        select(func.count()).select_from(SpendRequest)
        .where(SpendRequest.poolId == pool.id, SpendRequest.status == SpendStatus.PENDING)
    )).scalar_one()
    contrib_count = (await session.execute(
        select(func.count()).select_from(Contribution).where(Contribution.poolId == pool.id)
    )).scalar_one()
    out = model_to_dict(pool)
    out["members"] = [_serialize_pool_member(m, include_phone=True) for m in members]
    out["_count"] = {"spendRequests": int(pending_count), "contributions": int(contrib_count)}
    return out


@router.patch("/{pool_id}")
async def patch_pool(pool_id: str, body: UpdatePoolIn,
                     auth: AuthCtx = Depends(require_auth),
                     session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    data = body.model_dump(exclude_none=True)
    if data:
        await session.execute(update(Pool).where(Pool.id == pool_id).values(**data))
        await session.commit()
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one()
    return model_to_dict(pool)


@router.post("/{pool_id}/archive")
async def archive_pool(pool_id: str, auth: AuthCtx = Depends(require_auth),
                       session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    await session.execute(
        update(Pool).where(Pool.id == pool_id).values(isArchived=True, status=PoolStatus.ARCHIVED)
    )
    await session.commit()
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one()
    return model_to_dict(pool)


@router.delete("/{pool_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pool(pool_id: str, auth: AuthCtx = Depends(require_auth),
                      session: AsyncSession = Depends(get_session)) -> Response:
    await assert_pool_admin(session, pool_id, auth.user_id)
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one_or_none()
    if not pool:
        raise Errors.not_found("Pool")
    # DRAFT pools can always be deleted. ACTIVE/PAUSED pools can be deleted by
    # the owner if they have zero balance and no transactions on record — this
    # covers the common case of "I created a pool by mistake, get rid of it".
    if pool.status != PoolStatus.DRAFT:
        bal = Decimal(pool.currentBalance or 0)
        tx_count = (await session.execute(
            select(func.count()).select_from(Transaction).where(Transaction.poolId == pool_id)
        )).scalar_one()
        if bal != 0 or tx_count > 0:
            raise Errors.conflict(
                "Pool still has a balance or transactions — settle and refund before deleting"
            )
    await session.delete(pool)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
