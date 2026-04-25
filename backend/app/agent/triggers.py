"""Event-driven agent triggers — spawned as fire-and-forget background tasks.

The HTTP handler should NOT await these; they may take 5-15s on the local
LLM. Use `asyncio.create_task(on_spend_request(...))` and return the user
response immediately. The agent message is stored when the task finishes
and pushed to clients via the existing WebSocket fan-out so the frontend
can update the pool feed in real time."""
import asyncio
import logging
from typing import Optional

from ..db import SessionLocal
from ..publisher import publish_to_pool
from . import tools

log = logging.getLogger("agent.triggers")


def _spawn(coro) -> asyncio.Task:
    task = asyncio.create_task(coro)

    def _log(t: asyncio.Task) -> None:
        if t.cancelled():
            return
        exc = t.exception()
        if exc:
            log.warning("agent trigger failed: %s", exc)

    task.add_done_callback(_log)
    return task


async def _evaluate_in_bg(pool_id: str, *, amount: str, category: str,
                          title: str, description: Optional[str]) -> None:
    async with SessionLocal() as session:
        try:
            result = await tools.evaluate_spend(
                session, pool_id=pool_id, amount=str(amount),
                category=category, title=title, description=description,
            )
        except Exception as e:
            log.warning("evaluate_spend failed pool=%s: %s", pool_id, e)
            return
    publish_to_pool(pool_id, "agent_message", {
        "messageId": result["messageId"],
        "type": "SPEND_EVALUATION",
        "recommendation": result["recommendation"],
        "preview": (result["text"] or "")[:160],
    })


def on_spend_request(*, pool_id: str, amount: str, category: str,
                     title: str, description: Optional[str] = None) -> None:
    """Fire-and-forget. Caller must be inside a running event loop."""
    _spawn(_evaluate_in_bg(pool_id, amount=amount, category=category,
                           title=title, description=description))
