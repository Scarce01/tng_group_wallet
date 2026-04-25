from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from .config import env

engine = create_async_engine(
    env.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    echo=False,
)

SessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    engine, expire_on_commit=False, class_=AsyncSession
)


async def get_session() -> AsyncSession:
    async with SessionLocal() as s:
        yield s
