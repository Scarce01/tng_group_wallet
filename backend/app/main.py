"""FastAPI app — mirrors src/app.ts.

Mounts all routers under /api/v1, serves the SPA from /web/dist (or /public),
exposes the WebSocket on env.WS_PATH, and runs the spend-expiry sweep every
60 seconds for parity with the Node interval.
"""
import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response

from .serialize import jsonable as _jsonable
from .config import cors_origin_allowed, env
from .db import SessionLocal, engine
from .errors import AppError
from .models import AgentConversation, Base, DeviceBindChallenge, PaymentApprovalChallenge
from .pubsub import pubsub
from .routes import agent as agent_routes
from .routes import auth as auth_routes
from .routes import main_agent as main_agent_routes
from .routes import contributions as contrib_routes
from .routes import invites as invite_routes
from .routes import members as member_routes
from .routes import pools as pool_routes
from .routes import spend as spend_routes
from .routes import transactions as tx_routes
from .routes import users as user_routes
from .routes import payment_approval as payment_approval_routes
from .routes import zk as zk_routes
from .services.spend_service import expire_stale_requests
from .ws import setup_pubsub_dispatcher, websocket_endpoint

log = logging.getLogger("app")
logging.basicConfig(level=getattr(logging, env.LOG_LEVEL.upper(), logging.INFO))


class PrismaJSONResponse(JSONResponse):
    """JSONResponse that runs our Prisma-shaped serializer instead of FastAPI's
    jsonable_encoder. Our serializer already converts Decimal/datetime/Enum to
    Prisma-compatible primitives, so this both avoids RecursionErrors on ORM
    objects and matches the Node API output byte-for-byte."""

    def render(self, content: Any) -> bytes:
        return json.dumps(
            _jsonable(content),
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
        ).encode("utf-8")


# ---------------- security headers (helmet-equivalent) ----------------
async def _security_headers_mw(request: Request, call_next):
    resp = await call_next(request)
    # Helmet defaults; CSP intentionally omitted to allow demo SPA inline scripts.
    h = resp.headers
    if "x-content-type-options" not in h:
        h["x-content-type-options"] = "nosniff"
    if "x-frame-options" not in h:
        h["x-frame-options"] = "SAMEORIGIN"
    if "referrer-policy" not in h:
        h["referrer-policy"] = "no-referrer"
    if "strict-transport-security" not in h:
        h["strict-transport-security"] = "max-age=15552000; includeSubDomains"
    return resp


# ---------------- lifespan: bg expiry sweep + pubsub dispatcher ----------------
async def _ensure_runtime_tables() -> None:
    """Idempotent create-if-missing for tables added after the original
    bootstrap. Lets us ship new auth tables (DeviceBindChallenge) without
    forcing operators to re-run `python -m app.bootstrap` (which drops
    all data). Existing tables are untouched."""
    async with engine.begin() as conn:
        await conn.run_sync(
            Base.metadata.create_all,
            tables=[
                DeviceBindChallenge.__table__,
                AgentConversation.__table__,
                PaymentApprovalChallenge.__table__,
            ],
            checkfirst=True,
        )


async def _reset_main_agent_conversations() -> None:
    """Mark all AgentConversation rows isActive=False on each server boot.

    The next /agent/message request will create a fresh row, so users start
    every server session with a clean slate. History rows are kept (just
    deactivated) so we can always go back and inspect them via DB if needed.
    Without this, stale turns in the active conversation kept poisoning
    the LLM (e.g. it would copy a previous pool_selector even after the
    prompt rules forbade it).
    """
    from sqlalchemy import update
    from .models import AgentConversation
    async with SessionLocal() as s:
        result = await s.execute(
            update(AgentConversation)
            .where(AgentConversation.isActive.is_(True))
            .values(isActive=False)
        )
        await s.commit()
        log.info("deactivated %d active main-agent conversations on boot", result.rowcount)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        await _ensure_runtime_tables()
    except Exception as e:
        log.warning("runtime table ensure failed: %s", e)
    try:
        await _reset_main_agent_conversations()
    except Exception as e:
        log.warning("main-agent conversation reset failed: %s", e)
    await setup_pubsub_dispatcher()
    stop = asyncio.Event()

    async def _expiry_loop():
        while not stop.is_set():
            try:
                async with SessionLocal() as s:
                    await expire_stale_requests(s)
            except Exception as e:
                log.warning("expiry sweep failed: %s", e)
            try:
                await asyncio.wait_for(stop.wait(), timeout=60)
            except asyncio.TimeoutError:
                pass

    task = asyncio.create_task(_expiry_loop())
    log.info("TNG Pool Engine listening port=%s env=%s ws=%s", env.PORT, env.NODE_ENV, env.WS_PATH)
    try:
        yield
    finally:
        stop.set()
        task.cancel()
        try:
            await pubsub.close()
        except Exception:
            pass


def create_app() -> FastAPI:
    app = FastAPI(
        title="TNG Pool Engine",
        version="0.1.0",
        lifespan=lifespan,
        default_response_class=PrismaJSONResponse,
    )

    # --- CORS (mirrors Node corsOrigins resolver) ---
    raw = env.CORS_ORIGINS
    if raw == "*":
        app.add_middleware(
            CORSMiddleware,
            allow_origin_regex=".*",
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    else:
        allowlist = [o.strip() for o in raw.split(",") if o.strip()]
        regex = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$" if env.NODE_ENV != "production" else None
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowlist,
            allow_origin_regex=regex,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.middleware("http")(_security_headers_mw)

    # --- Error handlers (match Express response shapes) ---
    @app.exception_handler(AppError)
    async def app_error_handler(_req: Request, exc: AppError):
        body: dict[str, Any] = {"error": {"code": exc.code, "message": exc.message}}
        if exc.details:
            body["error"]["details"] = exc.details
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_req: Request, exc: RequestValidationError):
        # Reshape to match Zod's flatten() output as closely as possible
        field_errors: dict[str, list[str]] = {}
        form_errors: list[str] = []
        for e in exc.errors():
            loc = list(e.get("loc") or [])
            if loc and loc[0] in ("body", "query", "path"):
                loc = loc[1:]
            if loc:
                key = ".".join(str(x) for x in loc)
                field_errors.setdefault(key, []).append(e.get("msg", "Invalid"))
            else:
                form_errors.append(e.get("msg", "Invalid"))
        return JSONResponse(status_code=400, content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Invalid request body",
                "details": {"formErrors": form_errors, "fieldErrors": field_errors},
            }
        })

    @app.exception_handler(Exception)
    async def fallback_handler(req: Request, exc: Exception):
        log.exception("unhandled error path=%s", req.url.path)
        return JSONResponse(status_code=500, content={
            "error": {"code": "INTERNAL_ERROR", "message": "Internal server error"}
        })

    # --- Health ---
    @app.get("/api/v1/health")
    async def health():
        return {"status": "ok", "ts": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")}

    # --- API routers ---
    app.include_router(auth_routes.router, prefix="/api/v1/auth")
    app.include_router(user_routes.router, prefix="/api/v1/users")
    app.include_router(pool_routes.router, prefix="/api/v1/pools")
    app.include_router(member_routes.router, prefix="/api/v1/pools/{pool_id}/members")
    app.include_router(invite_routes.pool_invites_router, prefix="/api/v1/pools/{pool_id}/invites")
    app.include_router(invite_routes.invite_actions_router, prefix="/api/v1/invites")
    app.include_router(contrib_routes.router, prefix="/api/v1/pools/{pool_id}/contributions")
    app.include_router(spend_routes.router, prefix="/api/v1/pools/{pool_id}/spend-requests")
    app.include_router(zk_routes.router, prefix="/api/v1/pools/{pool_id}/zk")
    app.include_router(agent_routes.pool_router, prefix="/api/v1/pools/{pool_id}/agent")
    app.include_router(agent_routes.util_router, prefix="/api/v1/agent")
    app.include_router(main_agent_routes.router, prefix="/api/v1/agent")
    app.include_router(payment_approval_routes.router, prefix="/api/v1/payment-approval")
    app.include_router(tx_routes.router, prefix="/api/v1/pools/{pool_id}")

    # --- WebSocket ---
    app.add_api_websocket_route(env.WS_PATH, websocket_endpoint)

    # --- Static SPA: serves the React build from web/dist ---
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    web_dist = os.path.join(project_root, "web", "dist")

    spa_dirs = [web_dist] if os.path.isdir(web_dist) else []
    if spa_dirs:
        primary = spa_dirs[0]

        @app.get("/{full_path:path}", include_in_schema=False)
        async def spa(full_path: str):
            # Don't shadow API or WS paths
            if full_path.startswith("api/") or full_path == env.WS_PATH.lstrip("/"):
                return JSONResponse(status_code=404, content={
                    "error": {"code": "NOT_FOUND", "message": f"Route GET /{full_path} not found"}
                })
            for base in spa_dirs:
                candidate = os.path.normpath(os.path.join(base, full_path))
                # Path-traversal guard
                if not candidate.startswith(os.path.abspath(base)):
                    continue
                if os.path.isfile(candidate):
                    return FileResponse(candidate)
            # SPA fallback: serve index.html
            for base in spa_dirs:
                idx = os.path.join(base, "index.html")
                if os.path.isfile(idx):
                    return FileResponse(idx)
            return JSONResponse(status_code=404, content={
                "error": {"code": "NOT_FOUND", "message": "Not found"}
            })

    return app


app = create_app()
