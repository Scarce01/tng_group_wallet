import base64
import binascii

from fastapi import APIRouter, Depends, Request, Response, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..db import get_session
from ..errors import Errors
from ..rate_limit import auth_limiter
from ..schemas.auth import LoginIn, RefreshIn, RegisterIn
from ..schemas.common import StrictBase
from ..schemas.device_bind import ApproveIn, InitiateIn, RejectIn
from ..services import auth_service, device_bind_service
from ..services.qr_auth_service import issue_qr_for_user, login_with_qr

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


# ---- QR steganographic login ----------------------------------------------
# /auth/qr-issue   : phone+PIN -> base64 PNG of a stega QR valid for 60s
# /auth/qr-login   : upload that PNG (or post a base64 data URL) -> tokens
#
# The QR carries `TNGWALLET:USER=<id>` visibly + a 64-bit hidden HMAC tag.
# Standard QR scanners just see the visible string; our scanner samples the
# hidden modules to validate. See services/security/qr_stega.py for details.


class QrLoginIn(StrictBase):
    """JSON-style alternative to multipart upload. Accepts either a raw
    base64 string or a `data:image/png;base64,...` data URL."""

    image: str


@router.post("/qr-issue")
async def qr_issue(body: LoginIn, req: Request, resp: Response,
                   session: AsyncSession = Depends(get_session)):
    auth_limiter.check(req, resp)
    return await issue_qr_for_user(session, phone=body.phone, pin=body.pin)


@router.post("/qr-login")
async def qr_login(req: Request, resp: Response,
                   session: AsyncSession = Depends(get_session)):
    """Accepts either:
      - multipart/form-data with a `file` field (raw PNG), or
      - application/json with `{ "image": "<base64 or data: URL>" }`."""
    auth_limiter.check(req, resp)

    ctype = (req.headers.get("content-type") or "").lower()
    image_bytes: bytes | None = None

    if ctype.startswith("multipart/form-data"):
        form = await req.form()
        upload = form.get("file")
        if isinstance(upload, UploadFile):
            image_bytes = await upload.read()
    else:
        try:
            data = await req.json()
        except Exception:
            data = None
        if isinstance(data, dict) and isinstance(data.get("image"), str):
            s = data["image"]
            if s.startswith("data:"):
                _, _, s = s.partition(",")
            try:
                image_bytes = base64.b64decode(s)
            except (binascii.Error, ValueError):
                raise Errors.unauthenticated("Invalid base64 image")

    if not image_bytes:
        raise Errors.unauthenticated("No QR image provided")

    user = await login_with_qr(session, image_bytes=image_bytes)
    return await auth_service._issue_tokens(session, user)


# ---- Device-bind passwordless login ---------------------------------------
# Replaces the PIN-based path on the web app:
#   1. POST /auth/device-bind/initiate {phone, deviceId, ...}
#      -> creates a challenge bound to the full tuple, returns requestId.
#   2. The mock_approval Flutter app (the "TNG side") fetches
#      GET /auth/device-bind/pending?phone=... to render the approval inbox,
#      then POSTs /auth/device-bind/approve with an HMAC signature proving
#      the click came from the TNG side.
#   3. The web app polls POST /auth/device-bind/status to claim a session
#      once the challenge is approved. First poll wins; row is consumed.


@router.post("/device-bind/initiate")
async def device_bind_initiate(body: InitiateIn, req: Request, resp: Response,
                               session: AsyncSession = Depends(get_session)):
    auth_limiter.check(req, resp)
    return await device_bind_service.initiate(
        session,
        phone=body.phone,
        device_id=body.deviceId,
        device_label=body.deviceLabel,
        app_id=body.appId,
    )


class DeviceBindStatusIn(StrictBase):
    deviceId: str


@router.post("/device-bind/status/{request_id}")
async def device_bind_status(request_id: str, body: DeviceBindStatusIn,
                             session: AsyncSession = Depends(get_session)):
    return await device_bind_service.get_status(
        session, request_id=request_id, device_id=body.deviceId,
    )


@router.get("/device-bind/pending")
async def device_bind_pending(phone: str,
                              session: AsyncSession = Depends(get_session)):
    # No PIN, no auth — by design. The pending list only reveals public
    # binding details; tokens still require an HMAC-signed approval.
    items = await device_bind_service.pending_for_phone(session, phone=phone)
    return {"items": items}


@router.post("/device-bind/approve")
async def device_bind_approve(body: ApproveIn,
                              session: AsyncSession = Depends(get_session)):
    return await device_bind_service.approve(
        session,
        request_id=body.requestId,
        device_id=body.deviceId,
        approver_sig=body.approverSig,
    )


@router.post("/device-bind/reject")
async def device_bind_reject(body: RejectIn,
                             session: AsyncSession = Depends(get_session)):
    return await device_bind_service.reject(
        session, request_id=body.requestId, device_id=body.deviceId,
    )
