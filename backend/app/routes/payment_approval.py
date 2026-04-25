"""Payment approval challenge routes.

Endpoints mirror the device-bind pattern but for pool payment approvals.
"""
from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..schemas.common import MoneyAmount, StrictBase
from ..services import payment_approval_service

router = APIRouter()


# ---- Schemas ---------------------------------------------------------------

class InitiateIn(StrictBase):
    poolId: str = Field(min_length=1, max_length=128)
    deviceId: str = Field(min_length=8, max_length=128)
    amount: MoneyAmount
    merchantName: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=64)


class StatusIn(StrictBase):
    deviceId: str = Field(min_length=8, max_length=128)


class ApproveIn(StrictBase):
    requestId: str = Field(min_length=4, max_length=80)
    deviceId: str = Field(min_length=8, max_length=128)
    approverSig: str = Field(min_length=32, max_length=128)


class RejectIn(StrictBase):
    requestId: str = Field(min_length=4, max_length=80)
    deviceId: str = Field(min_length=8, max_length=128)


# ---- Endpoints -------------------------------------------------------------

@router.post("/initiate")
async def initiate(body: InitiateIn, auth: AuthCtx = Depends(require_auth),
                   session: AsyncSession = Depends(get_session)):
    return await payment_approval_service.initiate(
        session,
        user_id=auth.user_id,
        phone=auth.phone,
        device_id=body.deviceId,
        pool_id=body.poolId,
        amount=Decimal(body.amount),
        merchant_name=body.merchantName,
        category=body.category,
    )


@router.get("/pending")
async def pending(phone: str, session: AsyncSession = Depends(get_session)):
    items = await payment_approval_service.pending_for_phone(session, phone=phone)
    return {"items": items}


@router.post("/approve")
async def approve(body: ApproveIn, session: AsyncSession = Depends(get_session)):
    return await payment_approval_service.approve(
        session,
        request_id=body.requestId,
        device_id=body.deviceId,
        approver_sig=body.approverSig,
    )


@router.post("/status/{request_id}")
async def status(request_id: str, body: StatusIn,
                 auth: AuthCtx = Depends(require_auth),
                 session: AsyncSession = Depends(get_session)):
    return await payment_approval_service.consume_if_approved(
        session, request_id=request_id, device_id=body.deviceId,
    )


@router.post("/reject")
async def reject(body: RejectIn, session: AsyncSession = Depends(get_session)):
    return await payment_approval_service.reject(
        session, request_id=body.requestId, device_id=body.deviceId,
    )
