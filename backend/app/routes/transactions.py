"""Pool-scoped transactions and analytics."""
from decimal import Decimal
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..enums import ContributionStatus, SpendStatus
from ..models import Contribution, Pool, SpendRequest, Transaction, User
from ..serialize import model_to_dict
from ..services.pool_service import assert_pool_member

router = APIRouter()


@router.get("/transactions")
async def list_transactions(
    pool_id: str,
    cursor: Annotated[Optional[str], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    await assert_pool_member(session, pool_id, auth.user_id)
    q = (
        select(Transaction)
        .where(Transaction.poolId == pool_id)
        .options(selectinload(Transaction.user))
        .order_by(Transaction.createdAt.desc())
        .limit(limit + 1)
    )
    if cursor:
        anchor = (await session.execute(
            select(Transaction.createdAt, Transaction.id).where(Transaction.id == cursor)
        )).first()
        if anchor:
            ct, cid = anchor
            q = q.where((Transaction.createdAt < ct) |
                        ((Transaction.createdAt == ct) & (Transaction.id < cid)))
    items = (await session.execute(q)).scalars().all()
    next_cursor = None
    if len(items) > limit:
        next_cursor = items[-1].id
        items = items[:limit]
    serialized = []
    for t in items:
        d = model_to_dict(t)
        d["user"] = {"id": t.user.id, "displayName": t.user.displayName, "avatarUrl": t.user.avatarUrl}
        serialized.append(d)
    return {"items": serialized, "nextCursor": next_cursor}


@router.get("/analytics")
async def analytics(pool_id: str, auth: AuthCtx = Depends(require_auth),
                    session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)

    pool = (await session.execute(
        select(Pool.name, Pool.currentBalance, Pool.targetAmount, Pool.type).where(Pool.id == pool_id)
    )).first()
    pool_dict = None
    if pool:
        pool_dict = {
            "name": pool.name,
            "currentBalance": f"{pool.currentBalance:.2f}",
            "targetAmount": f"{pool.targetAmount:.2f}" if pool.targetAmount is not None else None,
            "type": pool.type.value if hasattr(pool.type, "value") else pool.type,
        }

    contrib_total = (await session.execute(
        select(func.sum(Contribution.amount), func.count())
        .where(Contribution.poolId == pool_id, Contribution.status == ContributionStatus.COMPLETED)
    )).first()
    spend_total = (await session.execute(
        select(func.sum(SpendRequest.amount), func.count())
        .where(SpendRequest.poolId == pool_id, SpendRequest.status == SpendStatus.EXECUTED)
    )).first()
    contrib_by_user = (await session.execute(
        select(Contribution.userId, func.sum(Contribution.amount))
        .where(Contribution.poolId == pool_id, Contribution.status == ContributionStatus.COMPLETED)
        .group_by(Contribution.userId)
    )).all()
    spend_by_category = (await session.execute(
        select(SpendRequest.category, func.sum(SpendRequest.amount), func.count())
        .where(SpendRequest.poolId == pool_id, SpendRequest.status == SpendStatus.EXECUTED)
        .group_by(SpendRequest.category)
    )).all()
    spend_by_user = (await session.execute(
        select(SpendRequest.requesterId, func.sum(SpendRequest.amount))
        .where(SpendRequest.poolId == pool_id, SpendRequest.status == SpendStatus.EXECUTED)
        .group_by(SpendRequest.requesterId)
    )).all()

    user_ids = {uid for uid, _ in contrib_by_user} | {uid for uid, _ in spend_by_user}
    users = (await session.execute(select(User).where(User.id.in_(user_ids)))).scalars().all() if user_ids else []
    user_map = {u.id: {"id": u.id, "displayName": u.displayName, "avatarUrl": u.avatarUrl} for u in users}
    contrib_map = {uid: amt or Decimal("0") for uid, amt in contrib_by_user}
    spend_map = {uid: amt or Decimal("0") for uid, amt in spend_by_user}

    per_member = []
    for uid in user_ids:
        c = contrib_map.get(uid, Decimal("0"))
        s = spend_map.get(uid, Decimal("0"))
        per_member.append({
            "user": user_map.get(uid),
            "contributed": f"{c:.2f}",
            "spent": f"{s:.2f}",
            "net": f"{(c - s):.2f}",
        })

    def _cat(c):
        return c.value if hasattr(c, "value") else c

    return {
        "pool": pool_dict,
        "totals": {
            "contributedTotal": f"{(contrib_total[0] or Decimal('0')):.2f}",
            "contributionCount": int(contrib_total[1] or 0),
            "spentTotal": f"{(spend_total[0] or Decimal('0')):.2f}",
            "spendCount": int(spend_total[1] or 0),
        },
        "perMember": per_member,
        "spendByCategory": [
            {"category": _cat(cat), "total": f"{(amt or Decimal('0')):.2f}", "count": int(count)}
            for cat, amt, count in spend_by_category
        ],
        "flow": {
            "contributors": [
                {"user": user_map.get(uid), "amount": f"{(amt or Decimal('0')):.2f}"}
                for uid, amt in contrib_by_user
            ],
            "categories": [
                {"category": _cat(cat), "amount": f"{(amt or Decimal('0')):.2f}"}
                for cat, amt, _ in spend_by_category
            ],
        },
    }
