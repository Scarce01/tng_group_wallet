"""ZK eligibility — params / prove / verify / status (FAMILY pools only)."""
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..errors import Errors
from ..models import PoolMember
from ..schemas.zk import ProveIn, VerifyIn
from ..serialize import jsonable
from ..services.pool_service import assert_pool_member
from ..services.zk_service import (
    IncomeBelowThreshold, generate_proof, get_min_contribution_cents,
    record_verification, verify_proof,
)

router = APIRouter()


@router.get("/params")
async def params(pool_id: str, auth: AuthCtx = Depends(require_auth),
                 session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    cents = await get_min_contribution_cents(session, pool_id)
    return {
        "poolId": pool_id,
        "minContributionCents": cents,
        "minContributionRM": f"{(cents / 100):.2f}",
        "backend": "stub",
    }


@router.post("/prove")
async def prove(pool_id: str, body: ProveIn,
                auth: AuthCtx = Depends(require_auth),
                session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    try:
        return await generate_proof(session, pool_id=pool_id, total_income_cents=body.totalIncomeCents)
    except IncomeBelowThreshold:
        return JSONResponse(status_code=400, content={
            "error": {
                "code": "INCOME_BELOW_THRESHOLD",
                "message": "Your income does not meet the minimum contribution threshold.",
            }
        })


@router.post("/verify")
async def verify(pool_id: str, body: VerifyIn,
                 auth: AuthCtx = Depends(require_auth),
                 session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    if not verify_proof(body.proof, body.publicSignals):
        raise Errors.conflict("Proof verification failed")
    await record_verification(
        session, pool_id=pool_id, user_id=auth.user_id,
        proof=body.proof, commitment_hash=body.commitmentHash,
    )
    return {"verified": True}


@router.get("/status")
async def status_(pool_id: str, auth: AuthCtx = Depends(require_auth),
                  session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    members = (await session.execute(
        select(PoolMember)
        .where(PoolMember.poolId == pool_id, PoolMember.isActive.is_(True))
        .options(selectinload(PoolMember.user))
        .order_by(PoolMember.joinedAt.asc())
    )).scalars().all()
    return {
        "poolId": pool_id,
        "members": [
            {
                "userId": m.user.id,
                "displayName": m.user.displayName,
                "avatarUrl": m.user.avatarUrl,
                "zkVerified": m.zkVerified,
                "zkVerifiedAt": jsonable(m.zkVerifiedAt),
            }
            for m in members
        ],
    }
