"""Pool financial state snapshot — what the agent looks at when reasoning.

Pure read-side. No mutation. Returned as a plain dict so it's easy to inline
into prompts and serialize for the MCP server."""
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..enums import ContributionStatus, SpendStatus
from ..models import Contribution, Pool, PoolMember, SpendRequest, User


def _f(d: Decimal | None) -> str:
    return f"{(d or Decimal('0')):.2f}"


async def pool_financial_state(session: AsyncSession, pool_id: str) -> dict[str, Any]:
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one_or_none()
    if not pool:
        return {}

    contrib_sum = (await session.execute(
        select(func.coalesce(func.sum(Contribution.amount), 0), func.count())
        .where(Contribution.poolId == pool_id, Contribution.status == ContributionStatus.COMPLETED)
    )).first()
    spend_sum = (await session.execute(
        select(func.coalesce(func.sum(SpendRequest.amount), 0), func.count())
        .where(SpendRequest.poolId == pool_id, SpendRequest.status == SpendStatus.EXECUTED)
    )).first()

    by_cat = (await session.execute(
        select(SpendRequest.category, func.sum(SpendRequest.amount), func.count())
        .where(SpendRequest.poolId == pool_id, SpendRequest.status == SpendStatus.EXECUTED)
        .group_by(SpendRequest.category)
    )).all()

    member_count = (await session.execute(
        select(func.count()).select_from(PoolMember)
        .where(PoolMember.poolId == pool_id, PoolMember.isActive.is_(True))
    )).scalar_one()

    members = (await session.execute(
        select(PoolMember, User)
        .join(User, User.id == PoolMember.userId)
        .where(PoolMember.poolId == pool_id, PoolMember.isActive.is_(True))
    )).all()

    now = datetime.now(timezone.utc)
    days_remaining = None
    days_elapsed = None
    if pool.endDate:
        days_remaining = max(0, (pool.endDate - now).days)
    if pool.startDate:
        days_elapsed = max(0, (now - pool.startDate).days)

    daily_avg = None
    daily_target = None
    if days_elapsed and days_elapsed > 0:
        daily_avg = float(spend_sum[0] or 0) / days_elapsed
    if pool.targetAmount and pool.endDate and pool.startDate:
        total_days = max(1, (pool.endDate - pool.startDate).days)
        daily_target = float(pool.targetAmount) / total_days

    return {
        "id": pool.id,
        "name": pool.name,
        "type": pool.type.value if hasattr(pool.type, "value") else pool.type,
        "status": pool.status.value if hasattr(pool.status, "value") else pool.status,
        "currency": pool.currency,
        "currentBalance": _f(pool.currentBalance),
        "targetAmount": _f(pool.targetAmount) if pool.targetAmount is not None else None,
        "spendLimit": _f(pool.spendLimit) if pool.spendLimit is not None else None,
        "totalContributed": _f(contrib_sum[0]),
        "contributionCount": int(contrib_sum[1]),
        "totalSpent": _f(spend_sum[0]),
        "spendCount": int(spend_sum[1]),
        "remaining": _f(pool.currentBalance),  # currentBalance already = contrib - executed
        "memberCount": int(member_count),
        "members": [
            {"id": u.id, "displayName": u.displayName, "role": pm.role.value if hasattr(pm.role, "value") else pm.role}
            for pm, u in members
        ],
        "spendByCategory": [
            {
                "category": cat.value if hasattr(cat, "value") else cat,
                "total": _f(amt),
                "count": int(count),
            }
            for cat, amt, count in by_cat
        ],
        "startDate": pool.startDate.isoformat().replace("+00:00", "Z") if pool.startDate else None,
        "endDate": pool.endDate.isoformat().replace("+00:00", "Z") if pool.endDate else None,
        "daysElapsed": days_elapsed,
        "daysRemaining": days_remaining,
        "dailyAvgSpend": round(daily_avg, 2) if daily_avg is not None else None,
        "dailyBudgetTarget": round(daily_target, 2) if daily_target is not None else None,
        "pace": (
            "over" if daily_avg is not None and daily_target is not None and daily_avg > daily_target
            else ("on_track" if daily_avg is not None else "unknown")
        ),
    }
