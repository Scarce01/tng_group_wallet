"""Spend-request flow — create / vote / cancel / execute / expire-sweep."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Iterable, Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..enums import (
    ApprovalMode, MemberRole, NotificationType, PoolType, SpendStatus,
    TransactionDirection, TransactionType, VoteDecision,
)
from ..errors import Errors
from ..models import Notification, Pool, PoolMember, SpendRequest, Transaction, User, Vote
from .pool_service import ensure_active_pool

Resolution = Literal["PENDING", "APPROVED", "REJECTED"]


def resolve_voting_status(
    *, approval_mode: ApprovalMode, approval_threshold: int, created_by_id: str,
    total_eligible_members: int, votes: Iterable[dict],
) -> Resolution:
    """Pure function: derive resolution from current vote tally + pool rules.

    Mirrors src/services/spend.service.ts#resolveVotingStatus.
    """
    votes = list(votes)
    approvals = sum(1 for v in votes if v["decision"] == "APPROVE")
    rejections = sum(1 for v in votes if v["decision"] == "REJECT")
    abstentions = sum(1 for v in votes if v["decision"] == "ABSTAIN")

    if approval_mode == ApprovalMode.ADMIN_ONLY:
        for v in votes:
            if v["voterId"] == created_by_id:
                if v["decision"] == "APPROVE":
                    return "APPROVED"
                if v["decision"] == "REJECT":
                    return "REJECTED"
        return "PENDING"

    denominator = max(1, total_eligible_members - abstentions)
    if approval_mode == ApprovalMode.UNANIMOUS:
        threshold = 100
    elif approval_mode == ApprovalMode.MAJORITY:
        threshold = 51
    else:
        threshold = approval_threshold

    approve_ratio = (approvals / denominator) * 100
    if approve_ratio >= threshold:
        return "APPROVED"

    remaining = total_eligible_members - approvals - rejections - abstentions
    max_possible = approvals + remaining
    max_ratio = (max_possible / denominator) * 100
    if max_ratio < threshold:
        return "REJECTED"
    return "PENDING"


async def create_spend_request(session: AsyncSession, *, pool_id: str, requester_id: str,
                               amount: str, title: str, description: str | None,
                               category: str, receipt_url: str | None,
                               is_emergency: bool, expires_in_hours: int) -> SpendRequest:
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one_or_none()
    if not pool:
        raise Errors.not_found("Pool")
    ensure_active_pool(pool)
    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == requester_id)
    )).scalar_one_or_none()
    if not member or not member.isActive:
        raise Errors.forbidden("Not a member")

    amt = Decimal(amount)
    if pool.spendLimit is not None and amt > pool.spendLimit:
        raise Errors.conflict(f"Amount exceeds pool spend limit of RM{pool.spendLimit:.2f}")
    if pool.currentBalance < amt:
        raise Errors.conflict("Pool balance insufficient")
    if is_emergency and pool.type != PoolType.FAMILY:
        raise Errors.conflict("Emergency override only available for FAMILY pools")
    if is_emergency and not pool.emergencyOverride:
        raise Errors.conflict("Emergency override is disabled for this pool")

    expires_at = datetime.now(timezone.utc) + timedelta(hours=expires_in_hours)
    sr = SpendRequest(
        poolId=pool.id, requesterId=requester_id, amount=amt, title=title,
        description=description, category=category, receiptUrl=receipt_url,
        isEmergency=is_emergency,
        status=SpendStatus.APPROVED if is_emergency else SpendStatus.PENDING,
        expiresAt=expires_at,
        resolvedAt=datetime.now(timezone.utc) if is_emergency else None,
    )
    session.add(sr)
    await session.flush()

    others = (await session.execute(
        select(PoolMember.userId).where(
            PoolMember.poolId == pool.id, PoolMember.isActive.is_(True),
            PoolMember.userId != requester_id,
        )
    )).scalars().all()
    nt = NotificationType.SPEND_REQUEST_APPROVED if is_emergency else NotificationType.SPEND_REQUEST_NEW
    note_title = "Emergency spend approved" if is_emergency else "Vote needed"
    for uid in others:
        session.add(Notification(
            userId=uid, type=nt, title=note_title,
            body=f"{title} — RM{amt:.2f}",
            metadata_={"poolId": pool.id, "spendRequestId": sr.id},
        ))
    await session.commit()
    await session.refresh(sr)
    return sr


async def cast_vote(session: AsyncSession, *, pool_id: str, spend_request_id: str,
                    voter_id: str, decision: str, comment: str | None) -> dict[str, Any]:
    sr = (await session.execute(
        select(SpendRequest).where(SpendRequest.id == spend_request_id)
    )).scalar_one_or_none()
    if not sr or sr.poolId != pool_id:
        raise Errors.not_found("Spend request")
    if sr.status != SpendStatus.PENDING:
        raise Errors.vote_closed()
    now = datetime.now(timezone.utc)
    if sr.expiresAt < now:
        sr.status = SpendStatus.EXPIRED
        sr.resolvedAt = now
        await session.commit()
        raise Errors.vote_closed()
    if sr.requesterId == voter_id:
        raise Errors.forbidden("Requester cannot vote on own request")

    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == sr.poolId, PoolMember.userId == voter_id)
    )).scalar_one_or_none()
    if not member or not member.isActive:
        raise Errors.forbidden("Not a member")
    if member.role == MemberRole.VIEWER:
        raise Errors.forbidden("Viewers cannot vote")

    existing = (await session.execute(
        select(Vote).where(Vote.spendRequestId == sr.id, Vote.voterId == voter_id)
    )).scalar_one_or_none()
    if existing:
        raise Errors.already_voted()

    vote = Vote(spendRequestId=sr.id, voterId=voter_id, decision=decision, comment=comment)
    session.add(vote)
    await session.flush()

    pool = (await session.execute(select(Pool).where(Pool.id == sr.poolId))).scalar_one()
    eligible = (await session.execute(
        select(func.count()).select_from(PoolMember).where(
            PoolMember.poolId == sr.poolId,
            PoolMember.isActive.is_(True),
            PoolMember.role != MemberRole.VIEWER,
            PoolMember.userId != sr.requesterId,
        )
    )).scalar_one()
    all_votes = (await session.execute(
        select(Vote.voterId, Vote.decision).where(Vote.spendRequestId == sr.id)
    )).all()
    vote_dicts = [{"voterId": vid, "decision": d.value if hasattr(d, "value") else d} for vid, d in all_votes]

    resolution = resolve_voting_status(
        approval_mode=pool.approvalMode, approval_threshold=pool.approvalThreshold,
        created_by_id=pool.createdById, total_eligible_members=int(eligible), votes=vote_dicts,
    )

    if resolution != "PENDING":
        sr.status = SpendStatus.APPROVED if resolution == "APPROVED" else SpendStatus.REJECTED
        sr.resolvedAt = datetime.now(timezone.utc)
        nt = (
            NotificationType.SPEND_REQUEST_APPROVED if resolution == "APPROVED"
            else NotificationType.SPEND_REQUEST_REJECTED
        )
        session.add(Notification(
            userId=sr.requesterId, type=nt,
            title=f"Spend request {resolution.lower()}",
            body=f"{sr.title} — RM{sr.amount:.2f}",
            metadata_={"poolId": sr.poolId, "spendRequestId": sr.id},
        ))

    await session.commit()
    await session.refresh(sr)
    await session.refresh(vote)
    return {"vote": vote, "spendRequest": sr, "resolution": resolution}


async def execute_approved_spend(session: AsyncSession, *, pool_id: str,
                                 spend_request_id: str, actor_id: str) -> dict[str, Any]:
    sr = (await session.execute(
        select(SpendRequest).where(SpendRequest.id == spend_request_id)
    )).scalar_one_or_none()
    if not sr or sr.poolId != pool_id:
        raise Errors.not_found("Spend request")
    if sr.status != SpendStatus.APPROVED:
        raise Errors.conflict(f"Cannot execute spend in {sr.status.value} state")
    if sr.requesterId != actor_id:
        actor = (await session.execute(
            select(PoolMember).where(PoolMember.poolId == sr.poolId, PoolMember.userId == actor_id)
        )).scalar_one_or_none()
        if not actor or actor.role not in (MemberRole.OWNER, MemberRole.ADMIN):
            raise Errors.forbidden("Only requester or pool admin can execute")

    pool = (await session.execute(select(Pool).where(Pool.id == sr.poolId))).scalar_one()
    if pool.isFrozen:
        raise Errors.pool_frozen()
    if pool.currentBalance < sr.amount:
        raise Errors.conflict("Pool balance insufficient at execution time")

    requester = (await session.execute(select(User).where(User.id == sr.requesterId))).scalar_one()

    pool_before = pool.currentBalance
    pool_after = pool_before - sr.amount
    user_before = requester.mainBalance
    user_after = user_before + sr.amount

    pool.currentBalance = pool_after
    requester.mainBalance = user_after

    session.add(Transaction(
        poolId=pool.id, userId=requester.id, type=TransactionType.SPEND,
        direction=TransactionDirection.OUT, amount=sr.amount,
        balanceBefore=pool_before, balanceAfter=pool_after,
        description=f"Spend: {sr.title}", spendRequestId=sr.id,
    ))
    session.add(Transaction(
        userId=requester.id, type=TransactionType.SPEND,
        direction=TransactionDirection.IN, amount=sr.amount,
        balanceBefore=user_before, balanceAfter=user_after,
        description=f"Pool payout: {sr.title}", spendRequestId=sr.id,
        metadata_={"poolId": pool.id},
    ))

    sr.status = SpendStatus.EXECUTED
    await session.commit()
    await session.refresh(sr)
    return {"spendRequest": sr, "poolBalance": pool_after, "userBalance": user_after}


async def cancel_spend_request(session: AsyncSession, *, pool_id: str,
                               spend_request_id: str, actor_id: str) -> SpendRequest:
    sr = (await session.execute(
        select(SpendRequest).where(SpendRequest.id == spend_request_id)
    )).scalar_one_or_none()
    if not sr or sr.poolId != pool_id:
        raise Errors.not_found("Spend request")
    if sr.requesterId != actor_id:
        raise Errors.forbidden("Only requester can cancel")
    if sr.status != SpendStatus.PENDING:
        raise Errors.conflict(f"Cannot cancel spend in {sr.status.value} state")
    sr.status = SpendStatus.CANCELLED
    sr.resolvedAt = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(sr)
    return sr


async def expire_stale_requests(session: AsyncSession) -> int:
    now = datetime.now(timezone.utc)
    stale = (await session.execute(
        select(SpendRequest).where(
            SpendRequest.status == SpendStatus.PENDING, SpendRequest.expiresAt < now
        )
    )).scalars().all()
    if not stale:
        return 0
    for sr in stale:
        sr.status = SpendStatus.EXPIRED
        sr.resolvedAt = now
        session.add(Notification(
            userId=sr.requesterId, type=NotificationType.SPEND_REQUEST_EXPIRED,
            title="Spend request expired", body=sr.title,
            metadata_={"poolId": sr.poolId, "spendRequestId": sr.id},
        ))
    await session.commit()
    return len(stale)
