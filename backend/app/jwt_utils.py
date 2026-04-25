import time
import uuid
from typing import TypedDict

from jose import jwt, JWTError

from .config import env
from .services.security.obfuscator import deobfuscate_token, obfuscate_token


class AccessPayload(TypedDict):
    sub: str
    phone: str


class RefreshPayload(TypedDict):
    sub: str
    jti: str


def sign_access(sub: str, phone: str) -> str:
    now = int(time.time())
    payload = {"sub": sub, "phone": phone, "iat": now, "exp": now + env.JWT_ACCESS_EXPIRES_S}
    raw = jwt.encode(payload, env.JWT_ACCESS_SECRET, algorithm="HS256")
    return obfuscate_token(raw)


def sign_refresh(sub: str) -> tuple[str, str]:
    now = int(time.time())
    jti = uuid.uuid4().hex
    payload = {"sub": sub, "jti": jti, "iat": now, "exp": now + env.JWT_REFRESH_EXPIRES_S}
    raw = jwt.encode(payload, env.JWT_REFRESH_SECRET, algorithm="HS256")
    return obfuscate_token(raw), jti


def verify_access(token: str) -> AccessPayload:
    try:
        real = deobfuscate_token(token)
        data = jwt.decode(real, env.JWT_ACCESS_SECRET, algorithms=["HS256"])
        return {"sub": data["sub"], "phone": data["phone"]}
    except (JWTError, ValueError) as e:
        raise ValueError(str(e))


def verify_refresh(token: str) -> RefreshPayload:
    try:
        real = deobfuscate_token(token)
        data = jwt.decode(real, env.JWT_REFRESH_SECRET, algorithms=["HS256"])
        return {"sub": data["sub"], "jti": data["jti"]}
    except (JWTError, ValueError) as e:
        raise ValueError(str(e))
