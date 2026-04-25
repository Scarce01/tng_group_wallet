from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..rate_limit import auth_limiter
from ..schemas.auth import LoginIn, RefreshIn, RegisterIn
from ..services import auth_service

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterIn, req: Request, resp: Response,
                   session: AsyncSession = Depends(get_session)):
    auth_limiter.check(req, resp)
    return await auth_service.register(
        session, phone=body.phone, pin=body.pin, fullName=body.fullName,
        displayName=body.displayName, email=body.email,
    )


@router.post("/login")
async def login(body: LoginIn, req: Request, resp: Response,
                session: AsyncSession = Depends(get_session)):
    auth_limiter.check(req, resp)
    return await auth_service.login(session, phone=body.phone, pin=body.pin)


@router.post("/refresh")
async def refresh(body: RefreshIn, session: AsyncSession = Depends(get_session)):
    return await auth_service.refresh(session, refresh_token=body.refreshToken)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(body: RefreshIn, session: AsyncSession = Depends(get_session)) -> Response:
    await auth_service.logout(session, refresh_token=body.refreshToken)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
