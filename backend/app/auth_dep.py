from typing import Annotated

from fastapi import Header

from .errors import Errors
from .jwt_utils import verify_access


class AuthCtx:
    __slots__ = ("user_id", "phone")

    def __init__(self, user_id: str, phone: str):
        self.user_id = user_id
        self.phone = phone


async def require_auth(authorization: Annotated[str | None, Header()] = None) -> AuthCtx:
    if not authorization or not authorization.startswith("Bearer "):
        raise Errors.unauthenticated("Missing bearer token")
    token = authorization[len("Bearer "):].strip()
    try:
        payload = verify_access(token)
    except Exception:
        raise Errors.unauthenticated("Invalid or expired token")
    return AuthCtx(payload["sub"], payload["phone"])
