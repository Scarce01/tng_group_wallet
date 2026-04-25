"""Agent HTTP API. All routes nested under /api/v1/pools/{pool_id}/agent
plus a couple of pool-less utilities under /api/v1/agent.

Note: setup / settings / messages / memory / forecast all hit the DB.
ask / check-scam / suggest-split run an LLM call inline (await), so the
client should expect 3-15s latency. evaluate-spend runs in the background
when triggered by the existing spend-request route — that path is where
most users see agent output, not this route."""
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import Field
from sqlalchemy.ext.asyncio import AsyncSession

from ..agent import tools as agent_tools
from ..agent.external.context import refresh_context_if_needed
from ..agent.memory import (
    get_pool_memory,
    list_agent_messages,
    upsert_pool_memory,
)
from ..agent.tools import _serialize_memory, _serialize_msg
from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..enums import AgentMessageType
from ..errors import Errors
from ..schemas.common import StrictBase
from ..services.pool_service import assert_pool_admin, assert_pool_member

# Per-pool routes
pool_router = APIRouter()
# Pool-less utilities
util_router = APIRouter()


# ---------- Schemas ----------

class SetupIn(StrictBase):
    description: str = Field(min_length=4, max_length=2000)


class SettingsIn(StrictBase):
    strictness: Optional[Literal["lenient", "moderate", "strict"]] = None
    detectedTone: Optional[str] = Field(default=None, max_length=40)
    humorAllowed: Optional[bool] = None
    splitStrategy: Optional[Literal["equal", "weighted", "manual"]] = None
    location: Optional[str] = Field(default=None, max_length=120)


class AskIn(StrictBase):
    question: str = Field(min_length=2, max_length=600)


class ScamIn(StrictBase):
    message: str = Field(min_length=2, max_length=2000)
    language: Optional[Literal["EN", "MS", "ZH"]] = "EN"


# ---------- Pool-scoped routes ----------

@pool_router.post("/setup")
async def agent_setup(pool_id: str, body: SetupIn,
                      auth: AuthCtx = Depends(require_auth),
                      session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    return await agent_tools.setup_pool_agent(
        session, pool_id=pool_id, description=body.description
    )


@pool_router.get("/memory")
async def agent_memory(pool_id: str,
                       auth: AuthCtx = Depends(require_auth),
                       session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    mem = await get_pool_memory(session, pool_id)
    if not mem:
        return None
    return _serialize_memory(mem)


@pool_router.patch("/settings")
async def agent_settings(pool_id: str, body: SettingsIn,
                         auth: AuthCtx = Depends(require_auth),
                         session: AsyncSession = Depends(get_session)):
    await assert_pool_admin(session, pool_id, auth.user_id)
    fields = body.model_dump(exclude_none=True)
    if not fields:
        mem = await get_pool_memory(session, pool_id)
        if not mem:
            raise Errors.not_found("Agent memory")
        return _serialize_memory(mem)
    mem = await upsert_pool_memory(session, pool_id, **fields)
    return _serialize_memory(mem)


@pool_router.get("/messages")
async def agent_messages(
    pool_id: str,
    type_: Annotated[Optional[str], Query(alias="type")] = None,
    cursor: Annotated[Optional[str], Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    await assert_pool_member(session, pool_id, auth.user_id)
    type_enum = None
    if type_:
        try:
            type_enum = AgentMessageType(type_)
        except ValueError:
            raise Errors.validation({"type": ["unknown agent message type"]})
    items = await list_agent_messages(
        session, pool_id, limit=limit, cursor=cursor, type_=type_enum,
    )
    next_cursor = None
    if len(items) > limit:
        next_cursor = items[-1].id
        items = items[:limit]
    return {"items": [_serialize_msg(m) for m in items], "nextCursor": next_cursor}


@pool_router.post("/ask")
async def agent_ask(pool_id: str, body: AskIn,
                    auth: AuthCtx = Depends(require_auth),
                    session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    try:
        return await agent_tools.ask(session, pool_id=pool_id, question=body.question)
    except Exception:
        return {"text": "AI assistant unavailable — Ollama is offline.", "messageId": None, "metadata": {}}


@pool_router.post("/suggest-split")
async def agent_suggest_split(pool_id: str,
                              auth: AuthCtx = Depends(require_auth),
                              session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    try:
        return await agent_tools.suggest_split(session, pool_id=pool_id)
    except Exception:
        return {"suggestion": "AI unavailable — Ollama is offline.", "splits": []}


@pool_router.get("/forecast")
async def agent_forecast(pool_id: str,
                         auth: AuthCtx = Depends(require_auth),
                         session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    try:
        return await agent_tools.forecast_budget(session, pool_id=pool_id)
    except Exception:
        return {"forecast": "AI unavailable — Ollama is offline.", "data": []}


@pool_router.post("/brief")
async def agent_brief(pool_id: str,
                      auth: AuthCtx = Depends(require_auth),
                      session: AsyncSession = Depends(get_session)):
    await assert_pool_member(session, pool_id, auth.user_id)
    try:
        return await agent_tools.generate_brief(session, pool_id=pool_id)
    except Exception:
        return {"text": "AI brief unavailable — Ollama is offline.", "messageId": None, "metadata": {}}


@pool_router.post("/refresh-context")
async def agent_refresh_context(pool_id: str,
                                auth: AuthCtx = Depends(require_auth),
                                session: AsyncSession = Depends(get_session)):
    """Force-refresh external context (weather, etc.). Bypasses the cache TTL."""
    await assert_pool_member(session, pool_id, auth.user_id)
    ctx = await refresh_context_if_needed(session, pool_id, force=True)
    return ctx or {"status": "no_memory_yet"}


@pool_router.get("/context")
async def agent_context(pool_id: str,
                        auth: AuthCtx = Depends(require_auth),
                        session: AsyncSession = Depends(get_session)):
    """Read-only view of cached external context."""
    await assert_pool_member(session, pool_id, auth.user_id)
    mem = await get_pool_memory(session, pool_id)
    if not mem:
        return None
    return {
        "weather": mem.weatherCache,
        "locationTips": mem.locationTips,
        "currencyRates": mem.currencyRates,
        "searchCache": mem.searchCache,
        "lastContextRefresh": (
            mem.lastContextRefresh.isoformat().replace("+00:00", "Z")
            if mem.lastContextRefresh else None
        ),
    }


# ---------- Pool-less utilities ----------

@util_router.post("/check-scam")
async def agent_check_scam(body: ScamIn, auth: AuthCtx = Depends(require_auth)):
    try:
        return await agent_tools.detect_scam(body.message, language=body.language or "EN")
    except Exception:
        return {"isScam": False, "confidence": 0, "reason": "AI unavailable — Ollama is offline."}
