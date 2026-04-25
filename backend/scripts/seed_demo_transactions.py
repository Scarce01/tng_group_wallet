"""Seed realistic transaction history into a pool so the Main Agent has
something to talk about (and the anomaly model has something to flag).

Default mode: 14 days of *logical* mixed Malaysian-merchant spending —
weekday commute + lunch + light grocery patterns, weekend bigger meals
and entertainment, monthly bills if any month-start day falls in the
window. Optional anomaly injection for stress-testing the anomaly model.

Usage (from backend/ directory, with venv active):

    # 2 weeks of clean logical history
    python -m scripts.seed_demo_transactions <POOL_ID> --clear

    # 30 days
    python -m scripts.seed_demo_transactions <POOL_ID> --clear --days 30

    # Add 4 deliberate anomalies on top of normal history
    python -m scripts.seed_demo_transactions <POOL_ID> --clear --anomalies

The script never wipes contributions — it only resets SPEND transactions
and SpendRequest rows so reseeding is safe to repeat.
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


# ──────────────────────────── Merchant catalogue ──────────────────────────
# (description, merchant, category, lo, hi)

MORNING_FOOD = [
    ("Old Town white coffee + toast", "OldTown", SpendCategory.FOOD, 12, 22),
    ("McDonald's breakfast set", "McDonald's", SpendCategory.FOOD, 14, 24),
    ("Mamak roti canai + teh tarik", "Mamak Corner", SpendCategory.FOOD, 8, 16),
    ("Starbucks venti latte", "Starbucks", SpendCategory.FOOD, 18, 26),
]
LUNCH_FOOD = [
    ("GrabFood — nasi lemak", "GrabFood", SpendCategory.FOOD, 12, 22),
    ("KFC Snack Plate", "KFC", SpendCategory.FOOD, 18, 30),
    ("Pelita nasi kandar", "Pelita", SpendCategory.FOOD, 22, 38),
    ("Office cafe set lunch", "Cafe", SpendCategory.FOOD, 15, 28),
    ("Sushi King bento", "Sushi King", SpendCategory.FOOD, 25, 45),
]
DINNER_FOOD = [
    ("Mamak supper", "Mamak Corner", SpendCategory.FOOD, 18, 38),
    ("Foodpanda — pizza for 2", "Foodpanda", SpendCategory.FOOD, 35, 65),
    ("Sri Melayu set dinner", "Sri Melayu", SpendCategory.FOOD, 45, 85),
    ("Domino's pizza family meal", "Dominos", SpendCategory.FOOD, 55, 95),
    ("Hotpot dinner with friends", "Hotpot", SpendCategory.FOOD, 80, 160),
]
COMMUTE = [
    ("Grab ride to office", "Grab", SpendCategory.TRANSPORT, 12, 28),
    ("Grab ride home", "Grab", SpendCategory.TRANSPORT, 14, 30),
    ("PLUS toll", "PLUS", SpendCategory.TOLL, 4, 14),
    ("LDP toll", "LDP", SpendCategory.TOLL, 2, 6),
]
PETROL = [
    ("Shell petrol top-up", "Shell", SpendCategory.PETROL, 90, 200),
    ("Petronas dagangan", "Petronas", SpendCategory.PETROL, 80, 200),
    ("Caltex fill up", "Caltex", SpendCategory.PETROL, 90, 180),
]
GROCERIES_LIGHT = [
    ("99 Speedmart top-up", "99 Speedmart", SpendCategory.GROCERIES, 25, 75),
    ("Petronas Mesra snack run", "Petronas", SpendCategory.GROCERIES, 12, 35),
]
GROCERIES_HEAVY = [
    ("MyDin weekly run", "MyDin", SpendCategory.GROCERIES, 90, 220),
    ("Lotus's Tesco grocery", "Lotus's", SpendCategory.GROCERIES, 100, 260),
    ("AEON Big weekly", "AEON", SpendCategory.GROCERIES, 110, 240),
    ("Cold Storage groceries", "Cold Storage", SpendCategory.GROCERIES, 130, 290),
]
WEEKEND_ACTIVITY = [
    ("Cinema GSC tickets x2", "GSC", SpendCategory.ACTIVITIES, 30, 60),
    ("Bowling at Sunway", "Sunway", SpendCategory.ACTIVITIES, 40, 90),
    ("Park entry + food", "Park", SpendCategory.ACTIVITIES, 50, 120),
    ("KLCC mall day out", "KLCC", SpendCategory.ACTIVITIES, 80, 180),
]
WEEKEND_SHOPPING = [
    ("Watson's personal care", "Watsons", SpendCategory.SHOPPING, 25, 80),
    ("Uniqlo basics", "Uniqlo", SpendCategory.SHOPPING, 80, 220),
    ("Decathlon sports", "Decathlon", SpendCategory.SHOPPING, 60, 200),
    ("Popular bookstore haul", "Popular", SpendCategory.SHOPPING, 30, 110),
]
MONTHLY_BILLS = [
    ("TNB electricity bill", "TNB", SpendCategory.UTILITIES, 110, 260),
    ("Maxis postpaid bill", "Maxis", SpendCategory.UTILITIES, 65, 110),
    ("Unifi home broadband", "TM", SpendCategory.UTILITIES, 129, 199),
    ("Air Selangor water bill", "Air Selangor", SpendCategory.UTILITIES, 35, 65),
]


# ──────────────────────────── DB helpers ──────────────────────────────────

async def _next_balance(session, pool_id: str) -> Decimal:
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
    session, *, pool_id: str, requester_id: str,
    amount: Decimal, description: str, category: SpendCategory,
    when: datetime, metadata: dict | None = None,
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


# ──────────────────────────── Pattern generator ───────────────────────────

def _at(day: datetime, hour: int, rng: random.Random) -> datetime:
    return day.replace(hour=hour, minute=rng.randint(0, 59), second=0, microsecond=0)


def _pick(rng: random.Random, table: list, members: list, day: datetime, hour: int):
    desc, merchant, cat, lo, hi = rng.choice(table)
    return {
        "description": f"{desc}",
        "merchant": merchant,
        "category": cat,
        "amount": Decimal(f"{rng.uniform(lo, hi):.2f}"),
        "user": rng.choice(members),
        "when": _at(day, hour, rng),
    }


def generate_logical_pattern(
    members: list,
    *,
    days: int,
    rng: random.Random,
    end_date: datetime,
) -> list[dict]:
    """Return a chronologically-sorted list of spend events covering the
    last `days` days ending at `end_date`. Patterns:

    Weekdays:
      - 1 morning food (~70% chance)
      - 1 commute + 1 home commute (~80% chance each)
      - 1 lunch (always)
      - 1 light grocery 1-2x/week
      - 1 dinner (~40% — many days they eat at home)
    Weekends:
      - 1 brunch / late breakfast
      - 1 lunch out
      - 1 dinner out
      - 1 entertainment OR shopping (alternating)
      - 1 heavy grocery roughly every 7-9 days

    Plus one petrol fill-up roughly every 5 days, monthly bills if a
    "1st of month" falls in the window.
    """
    events: list[dict] = []
    start = end_date - timedelta(days=days - 1)

    last_petrol = -99
    last_heavy_groc = -99

    for d in range(days):
        day = (start + timedelta(days=d))
        is_weekend = day.weekday() >= 5

        # Monthly bills (if it's the 1st)
        if day.day == 1:
            for desc, merchant, cat, lo, hi in MONTHLY_BILLS:
                events.append({
                    "description": desc, "merchant": merchant, "category": cat,
                    "amount": Decimal(f"{rng.uniform(lo, hi):.2f}"),
                    "user": members[0],  # head of household pays bills
                    "when": _at(day, 10, rng),
                })

        if is_weekend:
            # Weekend pattern
            events.append(_pick(rng, MORNING_FOOD, members, day, rng.choice([10, 11])))
            events.append(_pick(rng, LUNCH_FOOD, members, day, rng.choice([13, 14])))
            events.append(_pick(rng, DINNER_FOOD, members, day, rng.choice([19, 20, 21])))
            # Activity / shopping every weekend
            if rng.random() < 0.65:
                table = WEEKEND_ACTIVITY if rng.random() < 0.5 else WEEKEND_SHOPPING
                events.append(_pick(rng, table, members, day, rng.choice([14, 15, 16, 17])))
            # Heavy groceries on Saturday
            if day.weekday() == 5 and (d - last_heavy_groc) >= 6:
                events.append(_pick(rng, GROCERIES_HEAVY, members, day, rng.choice([10, 11])))
                last_heavy_groc = d
        else:
            # Weekday pattern
            if rng.random() < 0.7:
                events.append(_pick(rng, MORNING_FOOD, members, day, rng.choice([7, 8])))
            if rng.random() < 0.8:
                events.append(_pick(rng, COMMUTE, members, day, rng.choice([7, 8, 9])))
            events.append(_pick(rng, LUNCH_FOOD, members, day, rng.choice([12, 13])))
            if rng.random() < 0.8:
                events.append(_pick(rng, COMMUTE, members, day, rng.choice([18, 19])))
            if rng.random() < 0.4:
                events.append(_pick(rng, DINNER_FOOD, members, day, rng.choice([19, 20])))
            # Light groceries 1-2x/week
            if day.weekday() in (2, 4) and rng.random() < 0.6:
                events.append(_pick(rng, GROCERIES_LIGHT, members, day, rng.choice([18, 19, 20])))

        # Petrol every ~5 days
        if (d - last_petrol) >= rng.randint(4, 6):
            events.append(_pick(rng, PETROL, members, day, rng.choice([8, 17, 18])))
            last_petrol = d

    # Sort chronologically
    events.sort(key=lambda e: e["when"])
    return events


# ──────────────────────────── Anomaly injection ───────────────────────────

def inject_anomalies(events: list[dict], members: list, end_date: datetime, rng: random.Random) -> list[dict]:
    """Append 4 outlier events designed to trip the anomaly + BOCPD detectors."""
    extra = []
    # 1. Large midday spend ~4 days ago
    extra.append({
        "description": "Suspicious large transfer to UNKNOWN-9923",
        "merchant": "UNKNOWN-9923", "category": SpendCategory.OTHER_FAMILY,
        "amount": Decimal("1850.00"),
        "user": members[0],
        "when": (end_date - timedelta(days=4)).replace(hour=14, minute=22, second=0, microsecond=0),
        "anomaly": "large_amount",
    })
    # 2. 3 AM unknown recipient ~2 days ago
    extra.append({
        "description": "Late-night payment to RECP-7711",
        "merchant": "RECP-7711", "category": SpendCategory.OTHER_FAMILY,
        "amount": Decimal("420.00"),
        "user": members[0],
        "when": (end_date - timedelta(days=2)).replace(hour=3, minute=12, second=0, microsecond=0),
        "anomaly": "off_hours",
    })
    # 3. Burst of 4 in 20 minutes ~6 days ago
    burst_day = (end_date - timedelta(days=6)).replace(hour=14, minute=0, second=0, microsecond=0)
    for j in range(4):
        extra.append({
            "description": f"Burst-tx {j + 1}/4 to MERCH-{j}",
            "merchant": f"MERCH-{j}", "category": SpendCategory.OTHER_FAMILY,
            "amount": Decimal(f"{rng.uniform(120, 380):.2f}"),
            "user": members[0],
            "when": burst_day + timedelta(minutes=j * 5),
            "anomaly": "burst",
        })
    # 4. Brand-new recipient ~1 day ago
    extra.append({
        "description": "One-off transfer to NEW-VENDOR-4421",
        "merchant": "NEW-VENDOR-4421", "category": SpendCategory.OTHER_FAMILY,
        "amount": Decimal("1200.00"),
        "user": members[0],
        "when": (end_date - timedelta(days=1)).replace(hour=15, minute=44, second=0, microsecond=0),
        "anomaly": "new_recipient",
    })
    return sorted(events + extra, key=lambda e: e["when"])


# ──────────────────────────── Main ────────────────────────────────────────

async def main() -> int:
    p = argparse.ArgumentParser(description="Seed realistic transaction history.")
    p.add_argument("pool_id", help="Pool ID (cuid) to seed transactions into")
    p.add_argument("--clear", action="store_true", help="Wipe existing SPEND tx + spend requests first")
    p.add_argument("--seed", type=int, default=42, help="RNG seed (default 42)")
    p.add_argument("--days", type=int, default=14, help="Window of past days (default 14)")
    p.add_argument("--anomalies", action="store_true", help="Inject 4 anomalous events on top of normal history")
    args = p.parse_args()

    rng = random.Random(args.seed)
    end_date = datetime.now(timezone.utc)

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

        print(f"Seeding into pool {pool.name!r} ({pool.id}) — {len(members)} members, {args.days} days")

        if args.clear:
            del_tx = await session.execute(
                delete(Transaction).where(
                    Transaction.poolId == args.pool_id,
                    Transaction.type == TransactionType.SPEND,
                )
            )
            del_sr = await session.execute(
                delete(SpendRequest).where(SpendRequest.poolId == args.pool_id)
            )
            print(f"  cleared {del_tx.rowcount} spend tx, {del_sr.rowcount} spend requests")

        events = generate_logical_pattern(
            list(members), days=args.days, rng=rng, end_date=end_date,
        )
        if args.anomalies:
            events = inject_anomalies(events, list(members), end_date, rng)

        for e in events:
            md = {"merchant": e["merchant"]}
            if "anomaly" in e:
                md["anomaly"] = e["anomaly"]
            await _add_spend(
                session,
                pool_id=args.pool_id,
                requester_id=e["user"],
                amount=e["amount"],
                description=f"{e['description']} — {e['merchant']}" if e["merchant"] not in e["description"] else e["description"],
                category=e["category"],
                when=e["when"],
                metadata=md,
            )

        latest = await _next_balance(session, args.pool_id)
        pool.currentBalance = latest
        await session.commit()

        anomaly_n = sum(1 for e in events if "anomaly" in e)
        print(f"  seeded {len(events)} events ({len(events) - anomaly_n} normal + {anomaly_n} anomalies); pool balance now RM {latest}")
        return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
