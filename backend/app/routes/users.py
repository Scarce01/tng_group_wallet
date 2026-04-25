"""User profile, balance, top-up, notifications, transactions."""
from decimal import Decimal
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import EmailStr, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..enums import TransactionDirection, TransactionType
from ..errors import Errors
from ..models import Notification, Transaction, User
from ..schemas.common import MoneyAmount, StrictBase
from ..serialize import jsonable, model_to_dict
from ..services.auth_service import _PUBLIC_FIELDS, public_user

router = APIRouter()


class UpdateProfileIn(StrictBase):
    fullName: Optional[str] = Field(default=None, min_length=2, max_length=120)
    displayName: Optional[str] = Field(default=None, min_length=1, max_length=60)
    email: Optional[EmailStr] = Field(default=None, max_length=200)
    avatarUrl: Optional[str] = None
    preferredLang: Optional[Literal["EN", "MS", "ZH"]] = None


class TopupIn(StrictBase):
    amount: MoneyAmount


@router.get("/me")
async def me(auth: AuthCtx = Depends(require_auth), session: AsyncSession = Depends(get_session)):
    u = (await session.execute(select(User).where(User.id == auth.user_id))).scalar_one_or_none()
    if not u:
        raise Errors.not_found("User")
    return public_user(u)


@router.patch("/me")
async def patch_me(body: UpdateProfileIn, auth: AuthCtx = Depends(require_auth),
                   session: AsyncSession = Depends(get_session)):
    data = body.model_dump(exclude_none=True)
    if not data:
        u = (await session.execute(select(User).where(User.id == auth.user_id))).scalar_one()
        return public_user(u)
    await session.execute(update(User).where(User.id == auth.user_id).values(**data))
    await session.commit()
    u = (await session.execute(select(User).where(User.id == auth.user_id))).scalar_one()
    return public_user(u)


@router.get("/me/balance")
async def my_balance(auth: AuthCtx = Depends(require_auth),
                     session: AsyncSession = Depends(get_session)):
    u = (await session.execute(select(User).where(User.id == auth.user_id))).scalar_one_or_none()
    if not u:
        raise Errors.not_found("User")
    return {"balance": f"{u.mainBalance:.2f}", "currency": "MYR"}


@router.post("/me/topup")
async def topup(body: TopupIn, auth: AuthCtx = Depends(require_auth),
                session: AsyncSession = Depends(get_session)):
    u = (await session.execute(select(User).where(User.id == auth.user_id))).scalar_one_or_none()
    if not u:
        raise Errors.not_found("User")
    before = u.mainBalance
    after = before + Decimal(body.amount)
    u.mainBalance = after
    session.add(Transaction(
        userId=u.id, type=TransactionType.TOPUP, direction=TransactionDirection.IN,
        amount=Decimal(body.amount), balanceBefore=before, balanceAfter=after,
        description="Wallet top-up (demo)",
    ))
    await session.commit()
    return {"balance": f"{after:.2f}", "currency": "MYR"}


@router.get("/me/notifications")
async def my_notifications(
    cursor: Annotated[Optional[str], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    q = select(Notification).where(Notification.userId == auth.user_id).order_by(Notification.createdAt.desc()).limit(limit + 1)
    if cursor:
        anchor = (await session.execute(
            select(Notification.createdAt, Notification.id).where(Notification.id == cursor)
        )).first()
        if anchor:
            cur_ts, cur_id = anchor
            q = (
                select(Notification)
                .where(Notification.userId == auth.user_id)
                .where((Notification.createdAt < cur_ts) | ((Notification.createdAt == cur_ts) & (Notification.id < cur_id)))
                .order_by(Notification.createdAt.desc())
                .limit(limit + 1)
            )
    items = (await session.execute(q)).scalars().all()
    next_cursor = None
    if len(items) > limit:
        last = items[-1]
        items = items[:limit]
        next_cursor = last.id
    return {"items": [model_to_dict(n) for n in items], "nextCursor": next_cursor}


@router.patch("/me/notifications/{nid}", status_code=status.HTTP_204_NO_CONTENT)
async def mark_read(nid: str, auth: AuthCtx = Depends(require_auth),
                    session: AsyncSession = Depends(get_session)) -> Response:
    res = await session.execute(
        update(Notification)
        .where(Notification.id == nid, Notification.userId == auth.user_id)
        .values(isRead=True)
    )
    await session.commit()
    if res.rowcount == 0:
        raise Errors.not_found("Notification")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me/transactions")
async def my_transactions(
    cursor: Annotated[Optional[str], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    q = (
        select(Transaction)
        .where(Transaction.userId == auth.user_id)
        .order_by(Transaction.createdAt.desc())
        .limit(limit + 1)
    )
    if cursor:
        anchor = (await session.execute(
            select(Transaction.createdAt, Transaction.id).where(Transaction.id == cursor)
        )).first()
        if anchor:
            cur_ts, cur_id = anchor
            q = (
                select(Transaction)
                .where(Transaction.userId == auth.user_id)
                .where((Transaction.createdAt < cur_ts) | ((Transaction.createdAt == cur_ts) & (Transaction.id < cur_id)))
                .order_by(Transaction.createdAt.desc())
                .limit(limit + 1)
            )
    items = (await session.execute(q)).scalars().all()
    next_cursor = None
    if len(items) > limit:
        next_cursor = items[-1].id
        items = items[:limit]
    return {"items": [model_to_dict(t) for t in items], "nextCursor": next_cursor}
