import os
import re
import sys
from typing import Optional
from urllib.parse import urlparse, urlunparse

from dotenv import load_dotenv

# Load .env from project root (parent of backend/) — matches Node behavior
_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(os.path.join(_ROOT, ".env"))


def _parse_duration_seconds(s: str) -> int:
    s = s.strip()
    m = re.match(r"^(\d+)([smhd])?$", s)
    if not m:
        raise ValueError(f"Invalid duration: {s}")
    n = int(m.group(1))
    unit = m.group(2) or "s"
    return n * {"s": 1, "m": 60, "h": 3600, "d": 86400}[unit]


class _Env:
    NODE_ENV: str
    PORT: int
    LOG_LEVEL: str
    DATABASE_URL: str
    REDIS_URL: str
    JWT_ACCESS_SECRET: str
    JWT_REFRESH_SECRET: str
    JWT_ACCESS_EXPIRES_S: int
    JWT_REFRESH_EXPIRES_S: int
    CORS_ORIGINS: str
    WS_PATH: str

    def __init__(self) -> None:
        self.NODE_ENV = os.getenv("NODE_ENV", "development")
        self.PORT = int(os.getenv("PORT", "4000"))
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "info")
        db = os.getenv("DATABASE_URL", "")
        if not db:
            print("DATABASE_URL is required", file=sys.stderr)
            raise SystemExit(1)
        self.DATABASE_URL = _to_async_db_url(db)
        self.REDIS_URL = os.getenv("REDIS_URL", "") or ""
        access = os.getenv("JWT_ACCESS_SECRET", "")
        refresh = os.getenv("JWT_REFRESH_SECRET", "")
        if len(access) < 16 or len(refresh) < 16:
            print("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 16 chars", file=sys.stderr)
            raise SystemExit(1)
        self.JWT_ACCESS_SECRET = access
        self.JWT_REFRESH_SECRET = refresh
        self.JWT_ACCESS_EXPIRES_S = _parse_duration_seconds(os.getenv("JWT_ACCESS_EXPIRES_IN", "15m"))
        self.JWT_REFRESH_EXPIRES_S = _parse_duration_seconds(os.getenv("JWT_REFRESH_EXPIRES_IN", "7d"))
        self.CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
        self.WS_PATH = os.getenv("WS_PATH", "/ws")


def _to_async_db_url(url: str) -> str:
    """Convert Prisma-style postgres URL to SQLAlchemy async asyncpg URL.

    Strips the `?schema=public` query param (a Prisma-only knob) so asyncpg
    doesn't reject it.
    """
    if url.startswith("postgresql://") or url.startswith("postgres://"):
        # Drop schema=public param which asyncpg doesn't accept
        parsed = urlparse(url)
        query = parsed.query
        if query:
            params = [p for p in query.split("&") if not p.startswith("schema=")]
            query = "&".join(params)
        scheme = "postgresql+asyncpg"
        return urlunparse((scheme, parsed.netloc, parsed.path, parsed.params, query, parsed.fragment))
    return url


env = _Env()


def cors_origin_allowed(origin: Optional[str]) -> bool:
    """Mirror Node corsOrigins logic.

    - No Origin header -> allow (native mobile / curl)
    - "*" wildcard -> allow
    - Comma-separated allowlist match -> allow
    - In non-production, allow any http(s)://localhost:<port> or 127.0.0.1
    """
    if not origin:
        return True
    raw = env.CORS_ORIGINS
    if raw == "*":
        return True
    allowlist = [o.strip() for o in raw.split(",") if o.strip()]
    if origin in allowlist:
        return True
    if env.NODE_ENV != "production" and re.match(
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$", origin
    ):
        return True
    return False
