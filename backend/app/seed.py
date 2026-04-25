"""Seed demo data — port of prisma/seed.ts.

Wipes all tables, recreates 4 demo users (PIN 123456), one TRIP pool
(Langkawi) with 4 members + contributions + a pending spend request with
2 yes votes, and one FAMILY pool (Keluarga Ahmad) with 2 members and
ZK-verified state on the owner.
"""
import asyncio
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import delete

from .db import SessionLocal, engine
from .enums import (
    MemberRole, PoolType, SpendCategory, SpendStatus, TransactionDirection,
    TransactionType, VoteDecision,
)
from .models import (
    Base, Contribution, Notification, Pool, PoolInvite, PoolMember, RefreshToken,
    SpendRequest, Transaction, User, Vote,
)
from .security import hash_pin


async def _wipe(session) -> None:
    # Order matters — children first.
    for model in (Vote, Transaction, SpendRequest, Contribution, PoolInvite,
                  PoolMember, Pool, Notification, RefreshToken, User):
        await session.execute(delete(model))


async def main() -> None:
    print("Seeding TNG Pool Engine demo data...")
    async with engine.begin() as conn:
        # Make sure tables exist (no-op if already there)
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as session:
        await _wipe(session)
        await session.commit()

        pin_h = hash_pin("123456")

        ahmad = User(phone="+60112345001", email="ahmad@example.com",
                     fullName="Ahmad bin Ibrahim", displayName="Ahmad",
                     pinHash=pin_h, mainBalance=Decimal("5000.00"), kycStatus="VERIFIED")
        siti = User(phone="+60112345002", email="siti@example.com",
                    fullName="Siti Nurhaliza Wong", displayName="Siti",
                    pinHash=pin_h, mainBalance=Decimal("3200.00"), kycStatus="VERIFIED")
        raj = User(phone="+60112345003", email="raj@example.com",
                   fullName="Raj Kumar", displayName="Raj",
                   pinHash=pin_h, mainBalance=Decimal("1800.00"), kycStatus="VERIFIED")
        mei = User(phone="+60112345004", email="mei@example.com",
                   fullName="Mei Lin Tan", displayName="Mei",
                   pinHash=pin_h, mainBalance=Decimal("2400.00"), kycStatus="VERIFIED")
        session.add_all([ahmad, siti, raj, mei])
        await session.flush()

        # Trip pool
        langkawi = Pool(
            type=PoolType.TRIP, name="Langkawi Trip 2026",
            description="5D4N island getaway",
            targetAmount=Decimal("5000.00"), currentBalance=Decimal("4200.00"),
            createdById=ahmad.id,
        )
        session.add(langkawi)
        await session.flush()
        for u, role in [(ahmad, MemberRole.OWNER), (siti, MemberRole.MEMBER),
                        (raj, MemberRole.MEMBER), (mei, MemberRole.MEMBER)]:
            session.add(PoolMember(poolId=langkawi.id, userId=u.id, role=role))

        contribs = [
            (ahmad.id, Decimal("1100.00")),
            (siti.id, Decimal("1100.00")),
            (raj.id, Decimal("1000.00")),
            (mei.id, Decimal("1000.00")),
        ]
        for uid, amt in contribs:
            c = Contribution(poolId=langkawi.id, userId=uid, amount=amt)
            session.add(c)
            await session.flush()
            session.add(Transaction(
                poolId=langkawi.id, userId=uid, type=TransactionType.CONTRIBUTION,
                direction=TransactionDirection.IN, amount=amt,
                balanceBefore=Decimal("0.00"), balanceAfter=amt,
                description=f"Contribution to {langkawi.name}",
                contributionId=c.id,
            ))

        spend = SpendRequest(
            poolId=langkawi.id, requesterId=ahmad.id, amount=Decimal("800.00"),
            title="Hotel deposit", description="Bayview Hotel — 2 rooms, 4 nights",
            category=SpendCategory.ACCOMMODATION, status=SpendStatus.PENDING,
            expiresAt=datetime.now(timezone.utc) + timedelta(hours=24),
        )
        session.add(spend)
        await session.flush()
        session.add(Vote(spendRequestId=spend.id, voterId=siti.id, decision=VoteDecision.APPROVE))
        session.add(Vote(spendRequestId=spend.id, voterId=raj.id, decision=VoteDecision.APPROVE))

        # Family pool
        family = Pool(
            type=PoolType.FAMILY, name="Keluarga Ahmad",
            description="Household budget pool",
            currentBalance=Decimal("1850.00"), targetAmount=Decimal("2000.00"),
            emergencyOverride=True, createdById=ahmad.id,
        )
        session.add(family)
        await session.flush()
        session.add(PoolMember(
            poolId=family.id, userId=ahmad.id, role=MemberRole.OWNER,
            zkVerified=True, zkVerifiedAt=datetime.now(timezone.utc),
            zkCommitmentHash="0x" + "ab" * 32,
            zkProof={"protocol": "groth16-stub", "seeded": True},
        ))
        session.add(PoolMember(poolId=family.id, userId=siti.id, role=MemberRole.ADMIN))

        fam1 = Contribution(poolId=family.id, userId=ahmad.id, amount=Decimal("1200.00"))
        session.add(fam1)
        await session.flush()
        session.add(Transaction(
            poolId=family.id, userId=ahmad.id, type=TransactionType.CONTRIBUTION,
            direction=TransactionDirection.IN, amount=Decimal("1200.00"),
            balanceBefore=Decimal("0.00"), balanceAfter=Decimal("1200.00"),
            description=f"Contribution to {family.name}",
            contributionId=fam1.id,
        ))
        fam2 = Contribution(poolId=family.id, userId=siti.id, amount=Decimal("650.00"))
        session.add(fam2)
        await session.flush()
        session.add(Transaction(
            poolId=family.id, userId=siti.id, type=TransactionType.CONTRIBUTION,
            direction=TransactionDirection.IN, amount=Decimal("650.00"),
            balanceBefore=Decimal("1200.00"), balanceAfter=Decimal("1850.00"),
            description=f"Contribution to {family.name}",
            contributionId=fam2.id,
        ))

        await session.commit()

    print("Seed complete.")
    print("  Demo users (PIN = 123456):")
    print("    +60112345001  Ahmad   (owner of both pools)")
    print("    +60112345002  Siti")
    print("    +60112345003  Raj")
    print("    +60112345004  Mei")


if __name__ == "__main__":
    asyncio.run(main())
