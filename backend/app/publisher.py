"""Fire-and-forget publish helpers used by HTTP routes.

The Node version returns synchronously; we wrap the awaitable in a task so
HTTP handlers don't have to await pubsub I/O on the hot path.
"""
import asyncio
import json
import logging
import time
from typing import Any

from .pubsub import pool_channel, pubsub, user_channel
from .serialize import jsonable

log = logging.getLogger("publisher")


def _publish(channel: str, event: str, data: Any) -> None:
    payload = json.dumps({"event": event, "data": jsonable(data), "ts": int(time.time() * 1000)})
    asyncio.create_task(_publish_safe(channel, payload, event))


async def _publish_safe(channel: str, payload: str, event: str) -> None:
    try:
        await pubsub.publish(channel, payload)
    except Exception as e:
        log.warning("publish failed: channel=%s event=%s err=%s", channel, event, e)


def publish_to_pool(pool_id: str, event: str, data: Any) -> None:
    _publish(pool_channel(pool_id), event, data)


def publish_to_user(user_id: str, event: str, data: Any) -> None:
    _publish(user_channel(user_id), event, data)
