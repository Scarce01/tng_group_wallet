"""Lightweight pubsub used by WebSocket fan-out.

Mirrors the Node backend: Redis-backed when REDIS_URL is set, otherwise an
in-process asyncio-based bus. Same channel naming convention so old/new
backends can interop during a transition.
"""
import asyncio
import logging
from typing import Awaitable, Callable, Optional
from urllib.parse import urlparse

import redis.asyncio as aioredis

from .config import env

log = logging.getLogger("pubsub")


class PubSub:
    kind: str = "in-process"

    async def publish(self, channel: str, payload: str) -> None:
        raise NotImplementedError

    async def subscribe(self, channel: str) -> None:
        raise NotImplementedError

    def on_message(self, handler: Callable[[str, str], Awaitable[None]]) -> None:
        raise NotImplementedError

    async def close(self) -> None:
        raise NotImplementedError


class InProcessPubSub(PubSub):
    kind = "in-process"

    def __init__(self) -> None:
        self._queue: asyncio.Queue[tuple[str, str]] = asyncio.Queue()
        self._channels: set[str] = set()
        self._handler: Optional[Callable[[str, str], Awaitable[None]]] = None
        self._task: Optional[asyncio.Task] = None

    async def publish(self, channel: str, payload: str) -> None:
        await self._queue.put((channel, payload))

    async def subscribe(self, channel: str) -> None:
        self._channels.add(channel)

    def on_message(self, handler: Callable[[str, str], Awaitable[None]]) -> None:
        self._handler = handler
        if self._task is None:
            self._task = asyncio.create_task(self._loop())

    async def _loop(self) -> None:
        while True:
            ch, payload = await self._queue.get()
            if ch in self._channels and self._handler:
                try:
                    await self._handler(ch, payload)
                except Exception as e:  # pragma: no cover
                    log.warning("pubsub handler failed: %s", e)

    async def close(self) -> None:
        if self._task:
            self._task.cancel()


class RedisPubSub(PubSub):
    kind = "redis"

    def __init__(self, url: str) -> None:
        self._pub = aioredis.from_url(url, decode_responses=True)
        self._sub_client = aioredis.from_url(url, decode_responses=True)
        self._sub = self._sub_client.pubsub()
        self._handler: Optional[Callable[[str, str], Awaitable[None]]] = None
        self._task: Optional[asyncio.Task] = None

    async def publish(self, channel: str, payload: str) -> None:
        await self._pub.publish(channel, payload)

    async def subscribe(self, channel: str) -> None:
        await self._sub.subscribe(channel)

    def on_message(self, handler: Callable[[str, str], Awaitable[None]]) -> None:
        self._handler = handler
        if self._task is None:
            self._task = asyncio.create_task(self._loop())

    async def _loop(self) -> None:
        async for msg in self._sub.listen():
            if msg.get("type") != "message":
                continue
            if self._handler:
                try:
                    await self._handler(msg["channel"], msg["data"])
                except Exception as e:  # pragma: no cover
                    log.warning("pubsub handler failed: %s", e)

    async def close(self) -> None:
        if self._task:
            self._task.cancel()
        try:
            await self._sub.close()
            await self._sub_client.close()
            await self._pub.close()
        except Exception:
            pass


def _safe_url(u: str) -> str:
    try:
        p = urlparse(u)
        if p.password:
            netloc = (p.username or "") + ":***@" + (p.hostname or "")
            if p.port:
                netloc += f":{p.port}"
            return p._replace(netloc=netloc).geturl()
        return u
    except Exception:
        return "<invalid>"


def make_pubsub() -> PubSub:
    if env.REDIS_URL.strip():
        log.info("pubsub: redis %s", _safe_url(env.REDIS_URL))
        return RedisPubSub(env.REDIS_URL)
    log.info("pubsub: in-process (no REDIS_URL set)")
    return InProcessPubSub()


pubsub: PubSub = make_pubsub()


def pool_channel(pool_id: str) -> str:
    return f"pool:{pool_id}"


def user_channel(user_id: str) -> str:
    return f"user:{user_id}"
