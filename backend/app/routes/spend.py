"""Spend requests: create / list / detail / vote / cancel / execute."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..models import SpendRequest, Vote
from ..publisher import publish_to_pool, publish_to_user
from ..schemas.spend import CreateSpendRequestIn, VoteIn
from ..serialize import model_to_dict
from ..services.pool_service import assert_pool_member
from ..services.spend_service import (
    cancel_spend_request, cast_vote, create_spend_request, execute_approved_spend,
)

router = APIRouter()


def _ser_user_brief(u) -> dict:
    return {"id": u.id, "displayName": u.displayName, "avatarUrl": u.avatarUrl}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create(pool_id: str, body: CreateSpendRequestIn,
                 auth: AuthCtx = Depends(require_auth),
                 session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    sr = await create_spend_request(
        session, pool_id=pool_id, requester_id=auth.user_id,
        amount=body.amount, title=body.title, description=body.description,
        category=body.category, receipt_url=body.receiptUrl,
        is_emergency=body.isEmergency, expires_in_hours=body.expiresInHours,
    )
    out = model_to_dict(sr)
    publish_to_pool(pool_id, "spend_request_created", {"spendRequest": out})
    return out


@router.get("")
async def list_(
    pool_id: str,
    status_: Annotated[Optional[str], Query(alias="status")] = None,
    cursor: Annotated[Optional[str], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    await assert_pool_member(session, pool_id, auth.user_id)
    q = (
        select(SpendRequest)
        .where(SpendRequest.poolId == pool_id)
        .options(selectinload(SpendRequest.requester))
        .order_by(SpendRequest.createdAt.desc())
        .limit(limit + 1)
    )
    if status_:
        q = q.where(SpendRequest.status == status_)
    if cursor:
        anchor = (await session.execute(
            select(SpendRequest.createdAt, SpendRequest.id).where(SpendRequest.id == cursor)
        )).first()
        if anchor:
            ct, cid = anchor
            q = q.where((SpendRequest.createdAt < ct) |
                        ((SpendRequest.createdAt == ct) & (SpendRequest.id < cid)))
    items = (await session.execute(q)).scalars().all()
    next_cursor = None
    if len(items) > limit:
        next_cursor = items[-1].id
        items = items[:limit]

    serialized = []
    for sr in items:
        d = model_to_dict(sr)
        d["requester"] = _ser_user_brief(sr.requester)
        votes = (await session.execute(
            select(Vote.decision, Vote.voterId).where(Vote.spendRequestId == sr.id)
        )).all()
        d["votes"] = [{"decision": dec.value if hasattr(dec, "value") else dec, "voterId": vid}
                      for dec, vid in votes]
        serialized.append(d)
    return {"items": serialized, "nextCursor": next_cursor}


@router.get("/{sid}")
async def detail(pool_id: str, sid: str, auth: AuthCtx = Depends(require_auth),
                 session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    sr = (await session.execute(
        select(SpendRequest)
        .where(SpendRequest.id == sid, SpendRequest.poolId == pool_id)
        .options(selectinload(SpendRequest.requester))
    )).scalar_one_or_none()
    if not sr:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=404,
            content={"error": {"code": "NOT_FOUND", "message": "Spend request not found"}},
        )
    out = model_to_dict(sr)
    out["requester"] = _ser_user_brief(sr.requester)
    votes = (await session.execute(
        select(Vote).where(Vote.spendRequestId == sid).options(selectinload(Vote.voter))
    )).scalars().all()
    out["votes"] = [{
        **model_to_dict(v),
        "voter": _ser_user_brief(v.voter),
    } for v in votes]
    return out


@router.post("/{sid}/vote")
async def vote(pool_id: str, sid: str, body: VoteIn,
               auth: AuthCtx = Depends(require_auth),
               session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    res = await cast_vote(
        session, pool_id=pool_id, spend_request_id=sid, voter_id=auth.user_id,
        decision=body.decision, comment=body.comment,
    )
    sr_dict = model_to_dict(res["spendRequest"])
    publish_to_pool(pool_id, "vote_cast", {
        "spendRequestId": res["spendRequest"].id,
        "voterId": auth.user_id,
        "decision": body.decision,
        "resolution": res["resolution"],
        "status": sr_dict["status"],
    })
    if res["resolution"] != "PENDING":
        publish_to_user(res["spendRequest"].requesterId, "spend_request_resolved", {
            "spendRequestId": res["spendRequest"].id,
            "status": sr_dict["status"],
        })
    return {
        "vote": model_to_dict(res["vote"]),
        "spendRequest": sr_dict,
        "resolution": res["resolution"],
    }


@router.post("/{sid}/cancel")
async def cancel(pool_id: str, sid: str, auth: AuthCtx = Depends(require_auth),
                 session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    sr = await cancel_spend_request(session, pool_id=pool_id, spend_request_id=sid, actor_id=auth.user_id)
    publish_to_pool(pool_id, "spend_request_cancelled", {"spendRequestId": sr.id})
    return model_to_dict(sr)


@router.post("/{sid}/execute")
async def execute(pool_id: str, sid: str, auth: AuthCtx = Depends(require_auth),
                  session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    res = await execute_approved_spend(
        session, pool_id=pool_id, spend_request_id=sid, actor_id=auth.user_id
    )
    publish_to_pool(pool_id, "balance_updated", {
        "poolBalance": f"{res['poolBalance']:.2f}",
        "reason": "spend_executed",
        "spendRequestId": res["spendRequest"].id,
    })
    return {
        "spendRequest": model_to_dict(res["spendRequest"]),
        "poolBalance": f"{res['poolBalance']:.2f}",
        "userBalance": f"{res['userBalance']:.2f}",
    }
