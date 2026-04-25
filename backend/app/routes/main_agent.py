"""Main Agent HTTP API.

Mounted at /api/v1/agent (alongside existing pool agent utilities). Endpoints:

    POST   /message          — send a turn, get back {message, widgets, toolResults}
    GET    /conversation     — current chat history (full transcript)
    DELETE /conversation     — close the active conversation, start fresh next message
    POST   /action-confirm   — execute a PIN-gated action after frontend collects PIN

These coexist with /api/v1/agent/check-scam from agent.util_router because
the path prefixes don't conflict.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth_dep import AuthCtx, require_auth
from ..db import get_session
from ..main_agent import conversation as main_conv
from ..main_agent.tool_registry import confirm_action
from ..schemas.common import StrictBase

router = APIRouter()


class MessageIn(StrictBase):
    message: str


class ActionConfirmIn(StrictBase):
    action: str
    params: dict


@router.post("/message")
async def main_agent_message(
    body: MessageIn,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    return await main_conv.handle_message(session, auth.user_id, body.message)


@router.get("/conversation")
async def main_agent_conversation(
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    items = await main_conv.list_messages(session, auth.user_id)
    return {"items": items}


@router.delete("/conversation")
async def main_agent_clear(
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    return await main_conv.clear_conversation(session, auth.user_id)


@router.post("/action-confirm")
async def main_agent_action_confirm(
    body: ActionConfirmIn,
    auth: AuthCtx = Depends(require_auth),
    session: AsyncSession = Depends(get_session),
):
    return await confirm_action(session, auth.user_id, body.action, body.params)
