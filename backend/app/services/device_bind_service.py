"""Device-bind passwordless login service.

Flow:
    1. Web app calls `initiate(phone, deviceId, deviceLabel, appId)`. The
       backend creates a row in DeviceBindChallenge bound to the full tuple
       and returns `{requestId, nonce, expiresAt, ...}` to the app.
    2. The mock_approval (TNG-side) Flutter app polls `pending_for_phone`
       to render the binding details for that phone.
    3. The TNG side calls `approve(requestId, approverSig)`. `approverSig`
       is `HMAC-SHA256(TNG_APPROVER_KEY, canonical(request))` and is what
       proves the click came from the TNG app, not a forged HTTP call.
    4. The web app polls `consume_if_approved(requestId, deviceId)`. On the
       first call after status flips to APPROVED, the row is atomically
       marked `consumedAt=now()` and a fresh access/refresh token pair is
       issued. Subsequent calls fail with `consumed`.

Bindings checked at consume time:
    - phone, deviceId, appId, requestId, nonce, expiresAt match the
      `challengeHash` computed when the row was created (no tamper).
    - status is APPROVED.
    - row hasn't expired.
    - row hasn't been consumed.
    - approverSig verifies under TNG_APPROVER_KEY.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import env
from ..errors import AppError, Errors
from ..models import DeviceBindChallenge, User
from . import auth_service


def _hmac(key: str, msg: str) -> str:
    return hmac.new(key.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()


def _canonical(req_id: str, phone: str, device_id: str, app_id: str,
               nonce: str, expires_at: datetime) -> str:
    """Stable string both sides hash. Order is part of the wire contract;
    don't reorder without changing the mock_approval Flutter app too."""
    iso = expires_at.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return "|".join(["v1", req_id, phone, device_id, app_id, nonce, iso])


def _challenge_hash(req_id: str, phone: str, device_id: str, app_id: str,
                    nonce: str, expires_at: datetime) -> str:
    return _hmac(env.DEVICE_BIND_SECRET, _canonical(req_id, phone, device_id, app_id, nonce, expires_at))


def _approver_sig(req_id: str, phone: str, device_id: str, app_id: str,
                  nonce: str, expires_at: datetime) -> str:
    """What the TNG mock_approval app must produce to approve the row."""
    msg = _canonical(req_id, phone, device_id, app_id, nonce, expires_at) + "|approved"
    return _hmac(env.TNG_APPROVER_KEY, msg)


def _row_to_public(c: DeviceBindChallenge) -> dict[str, Any]:
    """Public projection — never leaks challengeHash or approverSig."""
    return {
        "requestId": c.requestId,
        "phone": c.phone,
        "deviceId": c.deviceId,
        "deviceLabel": c.deviceLabel,
        "appId": c.appId,
        "nonce": c.nonce,
        "status": c.status,
        "expiresAt": c.expiresAt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "createdAt": c.createdAt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "expiresInSeconds": max(
            0, int((c.expiresAt - datetime.now(timezone.utc)).total_seconds())
        ),
    }


# ---------------------------------------------------------------------------


async def initiate(session: AsyncSession, *, phone: str, device_id: str,
                   device_label: str, app_id: str) -> dict[str, Any]:
    user = (await session.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
    if not user or not user.isActive:
        raise Errors.unauthenticated("No active account for this phone")

    req_id = "dbc_" + secrets.token_urlsafe(16)
    nonce = secrets.token_urlsafe(12)
    expires_at = datetime.now(timezone.utc) + timedelta(seconds=env.DEVICE_BIND_TTL_S)
    h = _challenge_hash(req_id, phone, device_id, app_id, nonce, expires_at)

    row = DeviceBindChallenge(
        requestId=req_id,
        userId=user.id,
        phone=phone,
        deviceId=device_id,
        deviceLabel=device_label or "",
        appId=app_id,
        nonce=nonce,
        challengeHash=h,
        status="PENDING",
        expiresAt=expires_at,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    return _row_to_public(row)


async def get_status(session: AsyncSession, *, request_id: str,
                     device_id: str) -> dict[str, Any]:
    """Web app polls this. Tokens are issued exactly once on the first
    call that finds the row in APPROVED state — afterwards the row is
    `consumed` and never hands out tokens again."""
    row = (await session.execute(
        select(DeviceBindChallenge).where(DeviceBindChallenge.requestId == request_id)
    )).scalar_one_or_none()
    if not row:
        raise Errors.not_found("Challenge")

    # The deviceId must match the device that started the flow. Stops a
    # different browser from polling someone else's pending request.
    if not hmac.compare_digest(row.deviceId, device_id):
        raise Errors.unauthenticated("Device mismatch")

    now = datetime.now(timezone.utc)

    # Expire lazily on read so the web side sees EXPIRED without us
    # needing a sweeper. Don't override APPROVED rows that haven't been
    # consumed yet — the approval still wins until the user picks them up.
    if row.expiresAt < now and row.status == "PENDING":
        row.status = "EXPIRED"
        await session.commit()

    public = _row_to_public(row)

    if row.status == "APPROVED" and row.consumedAt is None:
        # Recompute expected hash and approver sig from the stored bindings.
        expected_hash = _challenge_hash(
            row.requestId, row.phone, row.deviceId, row.appId, row.nonce, row.expiresAt,
        )
        if not hmac.compare_digest(expected_hash, row.challengeHash):
            raise Errors.unauthenticated("Challenge tampered")
        expected_sig = _approver_sig(
            row.requestId, row.phone, row.deviceId, row.appId, row.nonce, row.expiresAt,
        )
        if not row.approverSig or not hmac.compare_digest(expected_sig, row.approverSig):
            raise Errors.unauthenticated("Approver signature invalid")
        if row.expiresAt < now:
            raise Errors.unauthenticated("Approval expired before consumption")

        # Atomic claim: only the first request whose UPDATE flips
        # consumedAt from NULL gets to issue tokens. Anything else racing
        # in falls through to the `consumed` path below.
        result = await session.execute(
            update(DeviceBindChallenge)
            .where(
                DeviceBindChallenge.id == row.id,
                DeviceBindChallenge.consumedAt.is_(None),
            )
            .values(consumedAt=now)
        )
        await session.commit()
        if result.rowcount != 1:
            return {**public, "status": "CONSUMED"}

        user = (await session.execute(
            select(User).where(User.id == row.userId)
        )).scalar_one_or_none()
        if not user:
            raise Errors.unauthenticated("User not found")
        tokens = await auth_service._issue_tokens(session, user)
        return {**public, "status": "APPROVED", "session": tokens}

    if row.status == "APPROVED" and row.consumedAt is not None:
        return {**public, "status": "CONSUMED"}

    return public


async def pending_for_phone(session: AsyncSession, *, phone: str) -> list[dict[str, Any]]:
    """TNG-side fetches this to render an approval inbox. Only returns
    rows that are PENDING and not expired — already-approved rows aren't
    re-shown to the user."""
    now = datetime.now(timezone.utc)
    rows = (await session.execute(
        select(DeviceBindChallenge)
        .where(DeviceBindChallenge.phone == phone)
        .where(DeviceBindChallenge.status == "PENDING")
        .where(DeviceBindChallenge.expiresAt > now)
        .order_by(DeviceBindChallenge.createdAt.desc())
    )).scalars().all()
    return [_row_to_public(r) for r in rows]


async def approve(session: AsyncSession, *, request_id: str, approver_sig: str,
                  device_id: str) -> dict[str, Any]:
    """TNG side confirms. Backend re-derives the expected sig from the
    stored bindings — if the TNG app changed any field (phone/device/app/etc),
    the HMAC won't match."""
    row = (await session.execute(
        select(DeviceBindChallenge).where(DeviceBindChallenge.requestId == request_id)
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
        row.requestId, row.phone, row.deviceId, row.appId, row.nonce, row.expiresAt,
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
        select(DeviceBindChallenge).where(DeviceBindChallenge.requestId == request_id)
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
