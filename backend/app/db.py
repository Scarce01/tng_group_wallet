from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import env


def _is_supabase_pooler(url: str) -> bool:
    """Supabase's transaction-mode pooler runs PgBouncer, which does NOT
    support prepared statements. asyncpg uses them by default, so we must
    turn caching off whenever the URL points at *.pooler.supabase.com.
    Direct connections and session-mode pooler don't need this, but the
    flag is safe to set there too."""
    return "pooler.supabase.com" in url or ":6543/" in url


_connect_args: dict = {}
_is_pooler = _is_supabase_pooler(env.DATABASE_URL)

# Drop pgbouncer-incompatible asyncpg features when running through the pooler.
# Cloud deployments (Vercel/Render/Fly) almost always want the pooler URL.
if _is_pooler:
    _connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
        "server_settings": {"jit": "off"},
    }

engine = create_async_engine(
    env.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=10,
    echo=False,
    connect_args=_connect_args,
)

SessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)


async def get_session() -> AsyncSession:
    async with SessionLocal() as s:
        yield s
