"""Contributions: create / list / per-user summary."""
from decimal import Decimal
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..enums import ContributionStatus
from ..models import Contribution, User
from ..publisher import publish_to_pool
from ..schemas.contribution import CreateContributionIn
from ..serialize import model_to_dict
from ..services.contribution_service import make_contribution
from ..services.pool_service import assert_pool_member

router = APIRouter()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_contribution(pool_id: str, body: CreateContributionIn,
                              auth: AuthCtx = Depends(require_auth),
                              session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    res = await make_contribution(
        session, pool_id=pool_id, user_id=auth.user_id, amount=body.amount,
        description=body.description, receipt_url=body.receiptUrl,
    )
    publish_to_pool(pool_id, "balance_updated", {
        "poolBalance": f"{res['poolBalance']:.2f}",
        "reason": "contribution",
        "contributionId": res["contribution"].id,
        "userId": auth.user_id,
    })
    return {
        "contribution": model_to_dict(res["contribution"]),
        "poolBalance": f"{res['poolBalance']:.2f}",
        "userBalance": f"{res['userBalance']:.2f}",
    }


@router.get("")
async def list_contributions(
    pool_id: str,
    user_id: Annotated[Optional[str], Query(alias="userId")] = None,
    cursor: Annotated[Optional[str], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    await assert_pool_member(session, pool_id, auth.user_id)
    q = (
        select(Contribution)
        .where(Contribution.poolId == pool_id)
        .options(selectinload(Contribution.user))
        .order_by(Contribution.createdAt.desc())
        .limit(limit + 1)
    )
    if user_id:
        q = q.where(Contribution.userId == user_id)
    if cursor:
        anchor = (await session.execute(
            select(Contribution.createdAt, Contribution.id).where(Contribution.id == cursor)
        )).first()
        if anchor:
            ct, cid = anchor
            q = q.where((Contribution.createdAt < ct) | ((Contribution.createdAt == ct) & (Contribution.id < cid)))
    items = (await session.execute(q)).scalars().all()
    next_cursor = None
    if len(items) > limit:
        next_cursor = items[-1].id
        items = items[:limit]

    serialized = []
    for c in items:
        d = model_to_dict(c)
        d["user"] = {"id": c.user.id, "displayName": c.user.displayName, "avatarUrl": c.user.avatarUrl}
        serialized.append(d)
    return {"items": serialized, "nextCursor": next_cursor}


@router.get("/summary")
async def summary(pool_id: str, auth: AuthCtx = Depends(require_auth),
                  session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    rows = (await session.execute(
        select(Contribution.userId, func.sum(Contribution.amount), func.count())
        .where(Contribution.poolId == pool_id, Contribution.status == ContributionStatus.COMPLETED)
        .group_by(Contribution.userId)
    )).all()
    user_ids = [r[0] for r in rows]
    users = (await session.execute(select(User).where(User.id.in_(user_ids)))).scalars().all() if user_ids else []
    user_map = {u.id: u for u in users}
    items = []
    for uid, total, count in rows:
        u = user_map.get(uid)
        items.append({
            "user": {"id": u.id, "displayName": u.displayName, "avatarUrl": u.avatarUrl} if u else None,
            "total": f"{(total or Decimal('0')):.2f}",
            "count": count,
        })
    return {"items": items}
