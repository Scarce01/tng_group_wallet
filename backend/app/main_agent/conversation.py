"""Main Agent message handler.

Loads/creates the active AgentConversation row, builds live context, calls
the LLM via the existing agent.router, parses the JSON response, executes
any tool calls sequentially, and saves the new turn back to the row.

The LLM response contract is strict JSON:
    {"message": "<text>", "widgets": [...], "toolCalls": [{"tool":..,"args":{}}]}

If parsing fails we fall back to plain-text {message: rawResponse}. If the
LLM returns toolCalls, we execute them one by one, collect results, and
ask the LLM to format a follow-up reply that incorporates the results.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..agent import router as agent_router
from ..enums import PoolStatus, SpendStatus
from ..models import (
    AgentConversation, Notification, Pool, PoolInvite, PoolMember,
    SpendRequest, User, Vote,
)
from .prompt import build_main_agent_prompt
from .tool_registry import execute_tool

log = logging.getLogger("main_agent")

_MAX_HISTORY = 20  # turns kept in the LLM prompt window


async def _build_context(session: AsyncSession, user_id: str) -> tuple[dict, dict]:
    """Return (user_dict, context_dict) freshly computed from the DB."""
    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one()

    pools = (await session.execute(
        select(Pool).join(PoolMember, PoolMember.poolId == Pool.id)
        .where(
            PoolMember.userId == user_id,
            PoolMember.isActive.is_(True),
            Pool.status == PoolStatus.ACTIVE,
        )
    )).scalars().all()

    # Pending votes = spend requests still pending where this user hasn't voted
    sub_voted = select(Vote.spendRequestId).where(Vote.voterId == user_id)
    pending_rows = (await session.execute(
        select(SpendRequest, Pool).join(Pool, Pool.id == SpendRequest.poolId)
        .where(
            SpendRequest.status == SpendStatus.PENDING,
            SpendRequest.poolId.in_(select(PoolMember.poolId).where(
                PoolMember.userId == user_id, PoolMember.isActive.is_(True)
            )),
            ~SpendRequest.id.in_(sub_voted),
        ).limit(10)
    )).all()

    pending_invites = (await session.execute(
        select(func.count()).select_from(PoolInvite).where(
            PoolInvite.invitedUserId == user_id,
            PoolInvite.status == "PENDING",
        )
    )).scalar_one() if hasattr(PoolInvite, "invitedUserId") else 0

    unread = (await session.execute(
        select(func.count()).select_from(Notification).where(
            Notification.userId == user_id, Notification.isRead.is_(False),
        )
    )).scalar_one()

    user_dict = {
        "id": user.id,
        "displayName": user.displayName,
        "preferredLang": user.preferredLang.value if hasattr(user.preferredLang, "value") else user.preferredLang,
    }
    context = {
        "balance": float(user.mainBalance or 0),
        "activePools": [
            {
                "id": p.id,
                "name": p.name,
                "type": p.type.value if hasattr(p.type, "value") else p.type,
                "currentBalance": float(p.currentBalance or 0),
            }
            for p in pools
        ],
        "pendingVotes": [
            {
                "id": sr.id,
                "title": sr.title,
                "amount": float(sr.amount or 0),
                "poolName": pool.name,
            }
            for sr, pool in pending_rows
        ],
        "pendingInvites": int(pending_invites or 0),
        "unreadCount": int(unread or 0),
    }
    return user_dict, context


async def _get_or_create_conversation(session: AsyncSession, user_id: str) -> AgentConversation:
    conv = (await session.execute(
        select(AgentConversation).where(
            AgentConversation.userId == user_id,
            AgentConversation.isActive.is_(True),
        ).order_by(desc(AgentConversation.updatedAt)).limit(1)
    )).scalar_one_or_none()
    if conv is None:
        conv = AgentConversation(userId=user_id, messages=[])
        session.add(conv)
        await session.flush()
    return conv


def _parse_llm_json(raw: str) -> dict[str, Any]:
    """LLMs sometimes wrap JSON in code fences or chatter — try to recover."""
    txt = (raw or "").strip()
    # Strip markdown fences
    if txt.startswith("```"):
        txt = txt.strip("`")
        if txt.lower().startswith("json"):
            txt = txt[4:].strip()
    # Find the first {...} block
    start = txt.find("{")
    end = txt.rfind("}")
    if start >= 0 and end > start:
        candidate = txt[start:end + 1]
        try:
            return json.loads(candidate)
        except Exception:
            pass
    # Fallback: raw text becomes the message
    return {"message": raw or "(no reply)"}


async def handle_message(session: AsyncSession, user_id: str, user_message: str) -> dict[str, Any]:
    """Run one full Main Agent turn and return {message, widgets}."""
    user_dict, context = await _build_context(session, user_id)
    system_prompt = build_main_agent_prompt(user_dict, context)

    conv = await _get_or_create_conversation(session, user_id)
    history = list(conv.messages or [])

    # Render last N turns as a flat dialog string for the LLM
    transcript_lines = []
    for m in history[-_MAX_HISTORY:]:
        role = "User" if m.get("role") == "user" else "Agent"
        transcript_lines.append(f"{role}: {m.get('content', '')}")
    transcript_lines.append(f"User: {user_message}")
    transcript = "\n".join(transcript_lines)

    raw, meta = await agent_router.query(
        transcript, task_type="main_agent", system=system_prompt, json_mode=True,
    )
    parsed = _parse_llm_json(raw if isinstance(raw, str) else json.dumps(raw))
    message = str(parsed.get("message", "")).strip()
    widgets = parsed.get("widgets") or []
    tool_calls = parsed.get("toolCalls") or []

    # Execute tool calls sequentially
    tool_results = []
    for call in tool_calls:
        name = call.get("tool")
        args = call.get("args") or {}
        try:
            result = await execute_tool(session, user_id, name, args)
            tool_results.append({"tool": name, "ok": True, "data": result})
            # If a tool wants a PIN, surface it as a widget automatically
            if isinstance(result, dict) and result.get("requiresPin"):
                widgets.append({
                    "type": "pin_required",
                    "action": result.get("action"),
                    "description": _pin_description(result),
                    "params": result.get("params") or {},
                })
        except Exception as e:
            log.warning("[main_agent] tool %s failed: %s", name, e)
            tool_results.append({"tool": name, "ok": False, "error": str(e)})

    # If there were tool calls, do a second LLM pass so the reply reflects results
    if tool_calls:
        follow_prompt = (
            "You called these tools and got results:\n"
            + json.dumps(tool_results, default=str, indent=2)
            + "\n\nSummarise the result for the user concisely. "
            "If any tool returned requiresPin: true, do NOT add another pin_required widget — "
            "one was already attached. Reply as JSON {\"message\":\"...\", \"widgets\":[]}."
        )
        try:
            follow_raw, _ = await agent_router.query(
                follow_prompt, task_type="main_agent_followup",
                system=system_prompt, json_mode=True,
            )
            follow = _parse_llm_json(follow_raw if isinstance(follow_raw, str) else json.dumps(follow_raw))
            if follow.get("message"):
                message = str(follow["message"]).strip()
            extra = follow.get("widgets") or []
            widgets.extend(w for w in extra if w.get("type") != "pin_required")
        except Exception as e:
            log.warning("[main_agent] follow-up LLM failed: %s", e)

    # Persist turn
    now = datetime.now(timezone.utc).isoformat()
    history.append({"role": "user", "content": user_message, "timestamp": now})
    history.append({
        "role": "agent", "content": message, "widgets": widgets,
        "toolCalls": tool_calls, "timestamp": now,
    })
    conv.messages = history
    conv.updatedAt = datetime.now(timezone.utc)
    await session.commit()

    return {
        "message": message or "(no reply)",
        "widgets": widgets,
        "toolResults": tool_results,
    }


def _pin_description(tool_result: dict) -> str:
    action = tool_result.get("action")
    params = tool_result.get("params") or {}
    if action == "contribute":
        amt = params.get("amount")
        return f"Contribute RM{amt} to this pool"
    if action == "archive":
        return "Archive this pool"
    return f"Confirm {action}"


async def list_messages(session: AsyncSession, user_id: str) -> list[dict]:
    conv = (await session.execute(
        select(AgentConversation).where(
            AgentConversation.userId == user_id,
            AgentConversation.isActive.is_(True),
        ).order_by(desc(AgentConversation.updatedAt)).limit(1)
    )).scalar_one_or_none()
    if conv is None:
        return []
    return list(conv.messages or [])


async def clear_conversation(session: AsyncSession, user_id: str) -> dict:
    convs = (await session.execute(
        select(AgentConversation).where(
            AgentConversation.userId == user_id,
            AgentConversation.isActive.is_(True),
        )
    )).scalars().all()
    for c in convs:
        c.isActive = False
    await session.commit()
    return {"cleared": len(convs)}
