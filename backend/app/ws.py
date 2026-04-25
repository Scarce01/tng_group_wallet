"""WebSocket fan-out — mirrors src/websocket/server.ts.

Auth is via ?token=<jwt> in the upgrade URL (or Authorization header).
Clients get auto-subscribed to user:<id>; can opt into pool:<id> via a
{"action":"subscribe","poolId":...} message after the per-pool membership
check passes.
"""
import asyncio
import json
import logging
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from .db import SessionLocal
from .jwt_utils import verify_access
from .models import PoolMember
from .pubsub import pool_channel, pubsub, user_channel

log = logging.getLogger("ws")


class _Client:
    __slots__ = ("ws", "user_id", "pools")

    def __init__(self, ws: WebSocket, user_id: str):
        self.ws = ws
        self.user_id = user_id
        self.pools: set[str] = set()


_clients: set[_Client] = set()
_subscribed: set[str] = set()
_lock = asyncio.Lock()
_dispatch_attached = False


async def _ensure_subscribed(channel: str) -> None:
    async with _lock:
        if channel in _subscribed:
            return
        _subscribed.add(channel)
        await pubsub.subscribe(channel)


async def _dispatch(channel: str, payload: str) -> None:
    try:
        parsed = json.loads(payload)
    except Exception:
        return
    if channel.startswith("pool:"):
        pool_id = channel[len("pool:"):]
        for c in list(_clients):
            if pool_id in c.pools:
                try:
                    await c.ws.send_text(json.dumps(parsed))
                except Exception:
                    pass
    elif channel.startswith("user:"):
        user_id = channel[len("user:"):]
        for c in list(_clients):
            if c.user_id == user_id:
                try:
                    await c.ws.send_text(json.dumps(parsed))
                except Exception:
                    pass


async def setup_pubsub_dispatcher() -> None:
    global _dispatch_attached
    if _dispatch_attached:
        return
    _dispatch_attached = True
    pubsub.on_message(_dispatch)


def _extract_token(ws: WebSocket) -> Optional[str]:
    tok = ws.query_params.get("token")
    if tok:
        return tok
    auth = ws.headers.get("authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth[7:].strip()
    return None


async def websocket_endpoint(ws: WebSocket) -> None:
    token = _extract_token(ws)
    if not token:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    try:
        payload = verify_access(token)
    except Exception:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws.accept()
    user_id = payload["sub"]
    client = _Client(ws, user_id)
    _clients.add(client)
    log.info("ws connected user=%s", user_id)

    await _ensure_subscribed(user_channel(user_id))
    await ws.send_text(json.dumps({"event": "ready", "data": {"userId": user_id}}))

    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                await ws.send_text(json.dumps({"event": "error", "data": {"message": "Invalid JSON"}}))
                continue
            action = msg.get("action")
            pool_id = msg.get("poolId")
            if action == "subscribe" and pool_id:
                async with SessionLocal() as session:
                    res = await session.execute(
                        select(PoolMember).where(
                            PoolMember.poolId == pool_id, PoolMember.userId == user_id
                        )
                    )
                    member = res.scalar_one_or_none()
                if not member or not member.isActive:
                    await ws.send_text(
                        json.dumps({"event": "error", "data": {"message": "Not a member of pool"}})
                    )
                    continue
                client.pools.add(pool_id)
                await _ensure_subscribed(pool_channel(pool_id))
                await ws.send_text(json.dumps({"event": "subscribed", "data": {"poolId": pool_id}}))
            elif action == "unsubscribe" and pool_id:
                client.pools.discard(pool_id)
                await ws.send_text(json.dumps({"event": "unsubscribed", "data": {"poolId": pool_id}}))
    except WebSocketDisconnect:
        pass
    except Exception as e:
        log.warning("ws error user=%s: %s", user_id, e)
    finally:
        _clients.discard(client)
        log.info("ws disconnected user=%s", user_id)
