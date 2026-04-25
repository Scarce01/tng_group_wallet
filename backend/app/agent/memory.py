"""Agent memory CRUD — pool-level + user-level + message log.

Public surface (everything else in `agent/` should go through this module):

  - get_pool_memory(session, pool_id) -> PoolAgentMemory | None
  - upsert_pool_memory(session, pool_id, **fields) -> PoolAgentMemory
  - append_observation(session, pool_id, note: str) -> None
  - get_user_memory(session, user_id) -> UserAgentMemory | None
  - upsert_user_memory(session, user_id, **fields) -> UserAgentMemory
  - record_agent_message(session, pool_id, type, content, metadata) -> AgentMessage
  - list_agent_messages(session, pool_id, ...) -> list[AgentMessage]
"""
from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..enums import AgentMessageType
from ..models import AgentMessage, PoolAgentMemory, UserAgentMemory


# ---------------- Pool memory ----------------

async def get_pool_memory(session: AsyncSession, pool_id: str) -> Optional[PoolAgentMemory]:
    return (await session.execute(
        select(PoolAgentMemory).where(PoolAgentMemory.poolId == pool_id)
    )).scalar_one_or_none()


async def upsert_pool_memory(session: AsyncSession, pool_id: str, **fields: Any) -> PoolAgentMemory:
    mem = await get_pool_memory(session, pool_id)
    if mem is None:
        mem = PoolAgentMemory(poolId=pool_id, purpose=fields.pop("purpose", ""))
        session.add(mem)
    for k, v in fields.items():
        setattr(mem, k, v)
    await session.commit()
    await session.refresh(mem)
    return mem


async def append_observation(session: AsyncSession, pool_id: str, note: str,
                             *, max_keep: int = 50) -> None:
    """Push a short timestamped note onto the running observations list.

    Bounded at `max_keep` entries so the JSON column doesn't grow forever."""
    mem = await get_pool_memory(session, pool_id)
    if mem is None:
        return
    obs = list(mem.observations or [])
    obs.append({
        "note": note[:500],
        "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    })
    mem.observations = obs[-max_keep:]
    await session.commit()


# ---------------- User memory ----------------

async def get_user_memory(session: AsyncSession, user_id: str) -> Optional[UserAgentMemory]:
    return (await session.execute(
        select(UserAgentMemory).where(UserAgentMemory.userId == user_id)
    )).scalar_one_or_none()


async def upsert_user_memory(session: AsyncSession, user_id: str, **fields: Any) -> UserAgentMemory:
    mem = await get_user_memory(session, user_id)
    if mem is None:
        mem = UserAgentMemory(userId=user_id)
        session.add(mem)
    for k, v in fields.items():
        setattr(mem, k, v)
    await session.commit()
    await session.refresh(mem)
    return mem


# ---------------- Agent messages ----------------

async def record_agent_message(
    session: AsyncSession,
    pool_id: str,
    type_: AgentMessageType,
    content: str,
    *,
    metadata: Optional[dict] = None,
) -> AgentMessage:
    msg = AgentMessage(poolId=pool_id, type=type_, content=content, metadata_=metadata or {})
    session.add(msg)
    await session.commit()
    await session.refresh(msg)
    return msg


async def list_agent_messages(
    session: AsyncSession,
    pool_id: str,
    *,
    limit: int = 50,
    cursor: Optional[str] = None,
    type_: Optional[AgentMessageType] = None,
) -> list[AgentMessage]:
    q = (
        select(AgentMessage)
        .where(AgentMessage.poolId == pool_id)
        .order_by(desc(AgentMessage.createdAt))
        .limit(limit + 1)
    )
    if type_ is not None:
        q = q.where(AgentMessage.type == type_)
    if cursor:
        anchor = (await session.execute(
            select(AgentMessage.createdAt, AgentMessage.id).where(AgentMessage.id == cursor)
        )).first()
        if anchor:
            ct, cid = anchor
            q = q.where(
                (AgentMessage.createdAt < ct)
                | ((AgentMessage.createdAt == ct) & (AgentMessage.id < cid))
            )
    return (await session.execute(q)).scalars().all()
