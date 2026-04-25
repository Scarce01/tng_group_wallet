"""One-time bootstrap: drop & recreate the public schema, create tables.

The existing Postgres DB has Prisma-managed enum types and tables. SQLAlchemy
attempts to recreate them differently (column quoting, enum naming) so we
wipe the schema first to avoid conflicts.
"""
import asyncio

from sqlalchemy import text

from .db import engine
from .models import Base


async def bootstrap() -> None:
    print("Dropping & recreating schema 'public'...")
    async with engine.begin() as conn:
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.run_sync(Base.metadata.create_all)
    print("Schema ready.")


if __name__ == "__main__":
    asyncio.run(bootstrap())
