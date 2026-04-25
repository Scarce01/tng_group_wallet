"""Payment approval challenge service.

Flow (mirrors device-bind but for pool payments):
    1. Web app calls `initiate(user_id, phone, device_id, pool_id, amount,
       merchantName, category)`. The backend creates a PaymentApprovalChallenge
       row bound to the full tuple and returns `{requestId, nonce, expiresAt, ...}`.
    2. The mock_approval Flutter app polls `pending_for_phone` to render
       pending payment approvals for that phone.
    3. The TNG side calls `approve(requestId, approverSig, deviceId)`.
       `approverSig` is `HMAC-SHA256(TNG_APPROVER_KEY, canonical|approved)`.
    4. The web app polls `consume_if_approved(requestId, deviceId)`. On the
       first call after status flips to APPROVED, the payment is atomically
       executed: pool balance debited, user balance credited, Transaction
       records created, row marked consumed.

Canonical format (wire contract — Flutter mock app and Lambda must match):
    v1|requestId|phone|deviceId|poolId|amount|merchantName|nonce|expiresAt_ISO

    - amount is formatted as "{:.2f}" for consistency
    - expiresAt is UTC ISO 8601: %Y-%m-%dT%H:%M:%SZ
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import env
from ..enums import TransactionDirection, TransactionType
from ..errors import AppError, Errors
from ..models import PaymentApprovalChallenge, Pool, PoolMember, Transaction, User


_TTL_S = 120  # seconds


def _hmac(key: str, msg: str) -> str:
    return hmac.new(key.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()


def _canonical(req_id: str, phone: str, device_id: str, pool_id: str,
               amount: Decimal, merchant_name: str, nonce: str,
               expires_at: datetime) -> str:
    """Stable string both sides hash. Order is part of the wire contract;
    don't reorder without changing the mock_approval Flutter app too."""
    iso = expires_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    amt = "{:.2f}".format(amount)
    return "|".join(["v1", req_id, phone, device_id, pool_id, amt, merchant_name, nonce, iso])


def _challenge_hash(req_id: str, phone: str, device_id: str, pool_id: str,
                    amount: Decimal, merchant_name: str, nonce: str,
                    expires_at: datetime) -> str:
    return _hmac(env.DEVICE_BIND_SECRET,
                 _canonical(req_id, phone, device_id, pool_id, amount, merchant_name, nonce, expires_at))


def _approver_sig(req_id: str, phone: str, device_id: str, pool_id: str,
                  amount: Decimal, merchant_name: str, nonce: str,
                  expires_at: datetime) -> str:
    """What the TNG mock_approval app must produce to approve the row."""
    msg = _canonical(req_id, phone, device_id, pool_id, amount, merchant_name, nonce, expires_at) + "|approved"
    return _hmac(env.TNG_APPROVER_KEY, msg)


def _row_to_public(c: PaymentApprovalChallenge) -> dict[str, Any]:
    """Public projection — never leaks challengeHash or approverSig."""
    return {
        "requestId": c.requestId,
        "phone": c.phone,
        "deviceId": c.deviceId,
        "poolId": c.poolId,
        "amount": str(c.amount),
        "merchantName": c.merchantName,
        "category": c.category,
        "nonce": c.nonce,
        "status": c.status,
        "expiresAt": c.expiresAt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "createdAt": c.createdAt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "expiresInSeconds": max(
            0, int((c.expiresAt - datetime.now(timezone.utc)).total_seconds())
        ),
    }


# ---------------------------------------------------------------------------


async def initiate(session: AsyncSession, *, user_id: str, phone: str,
                   device_id: str, pool_id: str, amount: Decimal,
                   merchant_name: str, category: str) -> dict[str, Any]:
    # Validate user is active pool member
    member = (await session.execute(
        select(PoolMember).where(
            PoolMember.poolId == pool_id,
            PoolMember.userId == user_id,
            PoolMember.isActive.is_(True),
        )
    )).scalar_one_or_none()
    if not member:
        raise Errors.forbidden("Not an active member of this pool")

    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one_or_none()
    if not pool:
        raise Errors.not_found("Pool")
    if pool.isFrozen:
        raise Errors.pool_frozen()
    if pool.currentBalance < amount:
        raise Errors.conflict("Pool balance insufficient")

    req_id = "pac_" + secrets.token_urlsafe(16)
    nonce = secrets.token_urlsafe(12)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=_TTL_S)
    h = _challenge_hash(req_id, phone, device_id, pool_id, amount, merchant_name, nonce, expires_at)

    row = PaymentApprovalChallenge(
        requestId=req_id,
        userId=user_id,
        phone=phone,
        poolId=pool_id,
        deviceId=device_id,
        amount=amount,
        merchantName=merchant_name,
        category=category,
        nonce=nonce,
        challengeHash=h,
        status="PENDING",
        expiresAt=expires_at,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return _row_to_public(row)


async def pending_for_phone(session: AsyncSession, *, phone: str) -> list[dict[str, Any]]:
    """TNG-side fetches this to render a payment approval inbox."""
    now = datetime.now(timezone.utc)
    rows = (await session.execute(
        select(PaymentApprovalChallenge)
        .where(PaymentApprovalChallenge.phone == phone)
        .where(PaymentApprovalChallenge.status == "PENDING")
        .where(PaymentApprovalChallenge.expiresAt > now)
        .order_by(PaymentApprovalChallenge.createdAt.desc())
    )).scalars().all()
    return [_row_to_public(r) for r in rows]


async def approve(session: AsyncSession, *, request_id: str, approver_sig: str,
                  device_id: str) -> dict[str, Any]:
    """TNG side confirms. Backend re-derives the expected sig from the
    stored bindings — if the TNG app changed any field, the HMAC won't match."""
    row = (await session.execute(
        select(PaymentApprovalChallenge).where(PaymentApprovalChallenge.requestId == request_id)
    )).scalar_one_or_none()
    if not row:
        raise Errors.not_found("Challenge")

    now = datetime.now(timezone.utc)
    if row.status != "PENDING":
        raise AppError("CHALLENGE_NOT_PENDING", f"Challenge is {row.status}", 409)
    if row.expiresAt < now:
        row.status = "EXPIRED"
        await session.commit()
        raise AppError("CHALLENGE_EXPIRED", "Challenge has expired", 410)
    if not hmac.compare_digest(row.deviceId, device_id):
        raise Errors.unauthenticated("Device mismatch")

    expected_sig = _approver_sig(
        row.requestId, row.phone, row.deviceId, row.poolId,
        row.amount, row.merchantName, row.nonce, row.expiresAt,
    )
    if not hmac.compare_digest(expected_sig, approver_sig):
        raise Errors.unauthenticated("Invalid approver signature")

    row.status = "APPROVED"
    row.approverSig = approver_sig
    row.approvedAt = now
    await session.commit()
    return _row_to_public(row)


async def reject(session: AsyncSession, *, request_id: str,
                 device_id: str) -> dict[str, Any]:
    row = (await session.execute(
        select(PaymentApprovalChallenge).where(PaymentApprovalChallenge.requestId == request_id)
    )).scalar_one_or_none()
    if not row:
        raise Errors.not_found("Challenge")
    if row.status != "PENDING":
        raise AppError("CHALLENGE_NOT_PENDING", f"Challenge is {row.status}", 409)
    if not hmac.compare_digest(row.deviceId, device_id):
        raise Errors.unauthenticated("Device mismatch")
    row.status = "REJECTED"
    await session.commit()
    return _row_to_public(row)


async def consume_if_approved(session: AsyncSession, *, request_id: str,
                              device_id: str) -> dict[str, Any]:
    """Web app polls this. Payment is executed exactly once on the first
    call that finds the row in APPROVED state — afterwards the row is
    `consumed` and never executes again."""
    row = (await session.execute(
        select(PaymentApprovalChallenge).where(PaymentApprovalChallenge.requestId == request_id)
    )).scalar_one_or_none()
    if not row:
        raise Errors.not_found("Challenge")

    if not hmac.compare_digest(row.deviceId, device_id):
        raise Errors.unauthenticated("Device mismatch")

    now = datetime.now(timezone.utc)

    # Expire lazily on read
    if row.expiresAt < now and row.status == "PENDING":
        row.status = "EXPIRED"
        await session.commit()

    public = _row_to_public(row)

    if row.status == "APPROVED" and row.consumedAt is None:
        # Recompute expected hash and approver sig from the stored bindings.
        expected_hash = _challenge_hash(
            row.requestId, row.phone, row.deviceId, row.poolId,
            row.amount, row.merchantName, row.nonce, row.expiresAt,
        )
        if not hmac.compare_digest(expected_hash, row.challengeHash):
            raise Errors.unauthenticated("Challenge tampered")
        expected_sig = _approver_sig(
            row.requestId, row.phone, row.deviceId, row.poolId,
            row.amount, row.merchantName, row.nonce, row.expiresAt,
        )
        if not row.approverSig or not hmac.compare_digest(expected_sig, row.approverSig):
            raise Errors.unauthenticated("Approver signature invalid")
        if row.expiresAt < now:
            raise Errors.unauthenticated("Approval expired before consumption")

        # Atomic claim: only the first UPDATE that flips consumedAt from NULL
        # gets to execute the payment.
        result = await session.execute(
            update(PaymentApprovalChallenge)
            .where(
                PaymentApprovalChallenge.id == row.id,
                PaymentApprovalChallenge.consumedAt.is_(None),
            )
            .values(consumedAt=now)
        )
        await session.commit()
        if result.rowcount != 1:
            return {**public, "status": "CONSUMED"}

        # Re-verify pool balance
        pool = (await session.execute(select(Pool).where(Pool.id == row.poolId))).scalar_one()
        if pool.isFrozen:
            raise Errors.pool_frozen()
        if pool.currentBalance < row.amount:
            raise Errors.conflict("Pool balance insufficient at execution time")

        user = (await session.execute(select(User).where(User.id == row.userId))).scalar_one()

        pool_before = pool.currentBalance
        pool_after = pool_before - row.amount
        user_before = user.mainBalance
        user_after = user_before + row.amount

        pool.currentBalance = pool_after
        user.mainBalance = user_after

        pool_tx = Transaction(
            poolId=pool.id, userId=user.id, type=TransactionType.SPEND,
            direction=TransactionDirection.OUT, amount=row.amount,
            balanceBefore=pool_before, balanceAfter=pool_after,
            description=f"Payment: {row.merchantName}",
            metadata_={"merchantName": row.merchantName, "category": row.category},
        )
        user_tx = Transaction(
            userId=user.id, type=TransactionType.SPEND,
            direction=TransactionDirection.IN, amount=row.amount,
            balanceBefore=user_before, balanceAfter=user_after,
            description=f"Pool payout: {row.merchantName}",
            metadata_={"poolId": pool.id, "merchantName": row.merchantName, "category": row.category},
        )
        session.add(pool_tx)
        session.add(user_tx)
        await session.commit()

        return {
            **public,
            "status": "APPROVED",
            "transaction": {
                "poolTxId": pool_tx.id,
                "userTxId": user_tx.id,
                "amount": str(row.amount),
                "merchantName": row.merchantName,
                "category": row.category,
            },
            "poolBalance": str(pool_after),
            "userBalance": str(user_after),
        }

    if row.status == "APPROVED" and row.consumedAt is not None:
        return {**public, "status": "CONSUMED"}

    return public
