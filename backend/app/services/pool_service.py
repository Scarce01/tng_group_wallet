from typing import Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..enums import MemberRole, PoolStatus
from ..errors import Errors
from ..models import Pool, PoolMember


async def assert_pool_member(session: AsyncSession, pool_id: str, user_id: str) -> Tuple[Pool, PoolMember]:
    pool = (await session.execute(select(Pool).where(Pool.id == pool_id))).scalar_one_or_none()
    if not pool:
        raise Errors.not_found("Pool")
    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == user_id)
    )).scalar_one_or_none()
    if not member or not member.isActive:
        raise Errors.forbidden("Not a member of this pool")
    return pool, member


async def assert_pool_admin(session: AsyncSession, pool_id: str, user_id: str) -> Tuple[Pool, PoolMember]:
    pool, member = await assert_pool_member(session, pool_id, user_id)
    if member.role not in (MemberRole.OWNER, MemberRole.ADMIN):
        raise Errors.forbidden("Owner or admin role required")
    return pool, member


def ensure_active_pool(pool: Pool) -> None:
    if pool.isFrozen:
        raise Errors.pool_frozen()
    if pool.status not in (PoolStatus.ACTIVE, PoolStatus.DRAFT):
        raise Errors.pool_not_active()
