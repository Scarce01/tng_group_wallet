"""Contribution flow — debits user's main wallet, credits the pool, ledgers it.

All work happens inside the caller's session/transaction so balances cannot drift.
"""
from decimal import Decimal
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..enums import (
    ContributionStatus,
    NotificationType,
    TransactionDirection,
    TransactionType,
)
from ..errors import Errors
from ..models import Contribution, Notification, Pool, PoolMember, Transaction, User
from .pool_service import ensure_active_pool


async def make_contribution(session: AsyncSession, *, pool_id: str, user_id: str,
                            amount: str, description: str | None,
                            receipt_url: str | None) -> dict[str, Any]:
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one_or_none()
    if not pool:
        raise Errors.not_found("Pool")
    ensure_active_pool(pool)

    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == user_id)
    )).scalar_one_or_none()
    if not member or not member.isActive:
        raise Errors.forbidden("Not a member of this pool")

    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise Errors.not_found("User")

    amt = Decimal(amount)
    if user.mainBalance < amt:
        raise Errors.insufficient_balance()

    user_before = user.mainBalance
    user_after = user_before - amt
    pool_before = pool.currentBalance
    pool_after = pool_before + amt

    user.mainBalance = user_after
    pool.currentBalance = pool_after

    contrib = Contribution(
        poolId=pool.id, userId=user.id, amount=amt,
        description=description, receiptUrl=receipt_url,
        status=ContributionStatus.COMPLETED,
    )
    session.add(contrib)
    await session.flush()

    session.add(Transaction(
        userId=user.id, type=TransactionType.CONTRIBUTION, direction=TransactionDirection.OUT,
        amount=amt, balanceBefore=user_before, balanceAfter=user_after,
        description=f"Contribution to {pool.name}",
        contributionId=contrib.id, metadata_={"poolId": pool.id},
    ))
    session.add(Transaction(
        poolId=pool.id, userId=user.id, type=TransactionType.CONTRIBUTION,
        direction=TransactionDirection.IN, amount=amt,
        balanceBefore=pool_before, balanceAfter=pool_after,
        description=f"Contribution from {user.displayName}", contributionId=contrib.id,
    ))

    others = (await session.execute(
        select(PoolMember.userId).where(
            PoolMember.poolId == pool.id, PoolMember.isActive.is_(True),
            PoolMember.userId != user.id,
        )
    )).scalars().all()
    for uid in others:
        session.add(Notification(
            userId=uid, type=NotificationType.CONTRIBUTION_RECEIVED,
            title="Contribution received",
            body=f"{user.displayName} contributed RM{amt:.2f} to {pool.name}.",
            metadata_={"poolId": pool.id, "contributionId": contrib.id, "amount": f"{amt:.2f}"},
        ))

    await session.commit()
    await session.refresh(contrib)
    return {"contribution": contrib, "poolBalance": pool_after, "userBalance": user_after}
