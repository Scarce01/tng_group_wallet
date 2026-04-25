"""Seed realistic demo transactions into a pool so the AI advisor has
something interesting to talk about (and the anomaly model has something
to flag).

Usage (from the backend/ directory, with venv active):

    python -m scripts.seed_demo_transactions <POOL_ID> [--clear]

If --clear is passed, the script first deletes all SPEND transactions and
spend requests for that pool before re-seeding. Contributions are kept.

The seed mixes typical Malaysian merchants over the past 30 days plus four
deliberate anomalies:
  * a large ~RM 1,800 spend in the middle of the day
  * a 3 AM payment to an unknown recipient
  * a 4-tx burst within 20 minutes
  * a brand-new recipient receiving ~RM 1,200
"""
from __future__ import annotations

import argparse
import asyncio
import random
import sys
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import delete, select

# Allow running as `python -m scripts.seed_demo_transactions` with backend/ on sys.path
from app.db import SessionLocal
from app.enums import (
    SpendCategory, SpendStatus, TransactionDirection, TransactionType,
)
from app.models import Pool, SpendRequest, Transaction, PoolMember


# (description, merchant, category, lo, hi, hour_choices)
TYPICAL = [
    ("Grab ride home", "Grab", SpendCategory.TRANSPORT, 8, 45, [8, 9, 18, 19, 22]),
    ("GrabFood — nasi lemak", "GrabFood", SpendCategory.FOOD, 15, 35, [12, 13, 19, 20]),
    ("GrabFood — KFC delivery", "GrabFood", SpendCategory.FOOD, 25, 60, [12, 19, 20]),
    ("Shell petrol top-up", "Shell", SpendCategory.TRANSPORT, 80, 200, [8, 17, 18]),
    ("Petronas dagangan", "Petronas", SpendCategory.TRANSPORT, 60, 180, [9, 12, 17]),
    ("99 Speedmart groceries", "99 Speedmart", SpendCategory.GROCERIES, 25, 95, [11, 16, 18]),
    ("MyDin weekly run", "MyDin", SpendCategory.GROCERIES, 80, 220, [10, 11, 19]),
    ("Lotus Tesco", "Lotus's", SpendCategory.GROCERIES, 90, 260, [10, 17]),
    ("Mamak supper", "Mamak Corner", SpendCategory.FOOD, 18, 55, [21, 22, 23]),
    ("Starbucks Cenang", "Starbucks", SpendCategory.FOOD, 14, 24, [9, 10, 15]),
    ("PLUS toll", "PLUS", SpendCategory.TRANSPORT, 5, 14, [7, 18]),
    ("TNB bill", "TNB", SpendCategory.UTILITIES, 90, 240, [10]),
    ("Maxis postpaid", "Maxis", SpendCategory.UTILITIES, 65, 110, [10]),
    ("Watson personal care", "Watsons", SpendCategory.OTHER, 25, 70, [15, 16]),
]


async def _next_balance(session, pool_id: str) -> Decimal:
    """Latest Transaction.balanceAfter for this pool, falling back to current
    pool balance if no rows yet."""
    row = (
        await session.execute(
            select(Transaction.balanceAfter)
            .where(Transaction.poolId == pool_id)
            .order_by(Transaction.createdAt.desc())
            .limit(1)
        )
    ).scalar_one_or_none()
    if row is not None:
        return row
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one()
    return pool.currentBalance


async def _add_spend(
    session,
    *,
    pool_id: str,
    requester_id: str,
    amount: Decimal,
    description: str,
    category: SpendCategory,
    when: datetime,
    metadata: dict | None = None,
) -> None:
    bal_before = await _next_balance(session, pool_id)
    bal_after = bal_before - amount
    sr = SpendRequest(
        poolId=pool_id, requesterId=requester_id, amount=amount,
        title=description[:60], description=description, category=category,
        status=SpendStatus.EXECUTED,
        expiresAt=when + timedelta(hours=24),
        resolvedAt=when, createdAt=when,
    )
    session.add(sr)
    await session.flush()
    tx = Transaction(
        poolId=pool_id, userId=requester_id, type=TransactionType.SPEND,
        direction=TransactionDirection.OUT, amount=amount,
        balanceBefore=bal_before, balanceAfter=bal_after,
        description=description, spendRequestId=sr.id, createdAt=when,
        metadata_={"category": category.value, "seeded": True, **(metadata or {})},
    )
    session.add(tx)
    await session.flush()


async def main() -> int:
    p = argparse.ArgumentParser(description="Seed demo transactions into a pool.")
    p.add_argument("pool_id", help="Pool ID (cuid) to seed transactions into")
    p.add_argument("--clear", action="store_true", help="Wipe existing SPEND tx + spend requests first")
    p.add_argument("--seed", type=int, default=42, help="RNG seed (default 42)")
    p.add_argument("--days", type=int, default=30, help="Window of past days to spread tx across")
    args = p.parse_args()

    rng = random.Random(args.seed)

    async with SessionLocal() as session:
        pool = (await session.execute(select(Pool).where(Pool.id == args.pool_id))).scalar_one_or_none()
        if not pool:
            print(f"ERROR: pool {args.pool_id} not found", file=sys.stderr)
            return 2

        members = (
            await session.execute(
                select(PoolMember.userId).where(
                    PoolMember.poolId == args.pool_id,
                    PoolMember.isActive.is_(True),
                )
            )
        ).scalars().all()
        if not members:
            print(f"ERROR: pool {args.pool_id} has no active members", file=sys.stderr)
            return 2

        print(f"Seeding into pool {pool.name!r} ({pool.id}) — {len(members)} members")

        if args.clear:
            # Drop spend tx + spend requests; keep contributions and balances clean
            del_tx = (
                await session.execute(
                    delete(Transaction)
                    .where(
                        Transaction.poolId == args.pool_id,
                        Transaction.type == TransactionType.SPEND,
                    )
                )
            )
            del_sr = await session.execute(
                delete(SpendRequest).where(SpendRequest.poolId == args.pool_id)
            )
            print(f"  cleared {del_tx.rowcount} spend tx, {del_sr.rowcount} spend requests")

        now = datetime.now(timezone.utc)

        # ── 25 typical spends spread across the window
        for i in range(25):
            desc, merchant, cat, lo, hi, hours = rng.choice(TYPICAL)
            day_offset = rng.randint(0, args.days - 1)
            hour = rng.choice(hours)
            when = (now - timedelta(days=day_offset)).replace(
                hour=hour, minute=rng.randint(0, 59), second=0, microsecond=0,
            )
            await _add_spend(
                session, pool_id=args.pool_id, requester_id=rng.choice(members),
                amount=Decimal(f"{rng.uniform(lo, hi):.2f}"),
                description=f"{desc} — {merchant}", category=cat, when=when,
                metadata={"merchant": merchant},
            )

        # ── 4 anomalies
        # 1. Large midday spend
        when = (now - timedelta(days=4)).replace(hour=14, minute=22, second=0, microsecond=0)
        await _add_spend(
            session, pool_id=args.pool_id, requester_id=members[0],
            amount=Decimal("1850.00"),
            description="Suspicious large transfer to UNKNOWN-9923",
            category=SpendCategory.OTHER, when=when,
            metadata={"merchant": "UNKNOWN-9923", "anomaly": "large_amount"},
        )
        # 2. 3 AM unknown recipient
        when = (now - timedelta(days=2)).replace(hour=3, minute=12, second=0, microsecond=0)
        await _add_spend(
            session, pool_id=args.pool_id, requester_id=members[0],
            amount=Decimal("420.00"),
            description="Late-night payment to RECP-7711",
            category=SpendCategory.OTHER, when=when,
            metadata={"merchant": "RECP-7711", "anomaly": "off_hours"},
        )
        # 3. Burst of 4 in 20 minutes
        burst_day = (now - timedelta(days=6)).replace(hour=14, minute=0, second=0, microsecond=0)
        for j in range(4):
            await _add_spend(
                session, pool_id=args.pool_id, requester_id=members[0],
                amount=Decimal(f"{rng.uniform(120, 380):.2f}"),
                description=f"Burst-tx {j + 1}/4 to MERCH-{j}",
                category=SpendCategory.OTHER,
                when=burst_day + timedelta(minutes=j * 5),
                metadata={"merchant": f"MERCH-{j}", "anomaly": "burst"},
            )
        # 4. Brand-new recipient large transfer
        when = (now - timedelta(days=1)).replace(hour=15, minute=44, second=0, microsecond=0)
        await _add_spend(
            session, pool_id=args.pool_id, requester_id=members[0],
            amount=Decimal("1200.00"),
            description="One-off transfer to NEW-VENDOR-4421",
            category=SpendCategory.OTHER, when=when,
            metadata={"merchant": "NEW-VENDOR-4421", "anomaly": "new_recipient"},
        )

        # Sync pool balance with the latest tx
        latest_balance = await _next_balance(session, args.pool_id)
        pool.currentBalance = latest_balance

        await session.commit()
        print(f"  seeded 25 typical + 4 anomalous spends; pool balance now RM {latest_balance}")
        return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
