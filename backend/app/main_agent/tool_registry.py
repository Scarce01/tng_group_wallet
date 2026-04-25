"""Main Agent tool registry.

Each tool is an async function (session, user_id, args) -> dict. The
executor in conversation.py looks up the tool by name and runs it.

Tools fall into three buckets:
  1. Read-only — issue a SELECT, return JSON-safe dict
  2. Mutation — delegate to existing service functions in app/services/
  3. PIN-gated — return {"requiresPin": True, "action": ..., "params": ...}
     The frontend then collects PIN and POSTs /api/v1/agent/action-confirm
     which calls confirm_action() below.

Tools that map to features we haven't built (transfer, settlement preview,
income streams, grants, etc.) are intentionally absent — the LLM is told
in the system prompt to reply "that feature isn't available yet".
"""
from __future__ import annotations

from decimal import Decimal
from typing import Any, Awaitable, Callable

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..agent import tools as pool_agent_tools
from ..enums import (
    ContributionStatus, MemberRole, PoolStatus, PoolType, SpendStatus,
    VoteDecision,
)
from ..errors import Errors
from ..models import (
    Contribution, Notification, Pool, PoolMember, SpendRequest, Transaction,
    User, Vote,
)
from ..services import contribution_service, spend_service
from ..services.pool_service import assert_pool_admin, assert_pool_member


# ──────────────────────────── helpers ─────────────────────────────────────

def _decimal_str(d) -> str:
    return f"{(d or Decimal('0')):.2f}"


async def _get_user(session: AsyncSession, user_id: str) -> User:
    user = (await session.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not user:
        raise Errors.not_found("User")
    return user


async def _resolve_pool_id(session: AsyncSession, user_id: str, args: dict) -> str:
    """Tools accept either poolId or poolName. Resolve name → id by querying
    the user's active pools."""
    if args.get("poolId"):
        return args["poolId"]
    name = args.get("poolName") or args.get("name")
    if not name:
        raise Errors.validation({"poolId": ["pool id or name is required"]})
    rows = (await session.execute(
        select(Pool).join(PoolMember, PoolMember.poolId == Pool.id)
        .where(PoolMember.userId == user_id, PoolMember.isActive.is_(True))
    )).scalars().all()
    matches = [p for p in rows if name.lower() in (p.name or "").lower()]
    if not matches:
        raise Errors.not_found(f"Pool matching '{name}'")
    if len(matches) > 1:
        raise Errors.conflict(
            f"Multiple pools match '{name}': {', '.join(p.name for p in matches)}"
        )
    return matches[0].id


# ──────────────────────────── WALLET ──────────────────────────────────────

async def t_get_balance(session, user_id, args):
    u = await _get_user(session, user_id)
    return {"balance": _decimal_str(u.mainBalance), "currency": "MYR"}


async def t_top_up(session, user_id, args):
    amount = Decimal(str(args["amount"]))
    if amount <= 0:
        raise Errors.validation({"amount": ["must be > 0"]})
    u = await _get_user(session, user_id)
    u.mainBalance = (u.mainBalance or Decimal("0")) + amount
    await session.commit()
    return {"newBalance": _decimal_str(u.mainBalance), "topUpAmount": _decimal_str(amount)}


# ──────────────────────────── POOLS ───────────────────────────────────────

async def t_list_my_pools(session, user_id, args):
    q = (
        select(Pool).join(PoolMember, PoolMember.poolId == Pool.id)
        .where(PoolMember.userId == user_id, PoolMember.isActive.is_(True))
    )
    if args.get("type"):
        q = q.where(Pool.type == args["type"].upper())
    if args.get("status"):
        q = q.where(Pool.status == args["status"].upper())
    rows = (await session.execute(q)).scalars().all()
    return {"items": [
        {
            "id": p.id, "name": p.name, "type": p.type.value if hasattr(p.type, "value") else p.type,
            "currentBalance": _decimal_str(p.currentBalance),
            "status": p.status.value if hasattr(p.status, "value") else p.status,
        }
        for p in rows
    ]}


async def t_get_pool_detail(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    pool, _ = await assert_pool_member(session, pool_id, user_id)
    return {
        "id": pool.id, "name": pool.name,
        "type": pool.type.value if hasattr(pool.type, "value") else pool.type,
        "description": pool.description,
        "currentBalance": _decimal_str(pool.currentBalance),
        "status": pool.status.value if hasattr(pool.status, "value") else pool.status,
        "approvalMode": pool.approvalMode.value if hasattr(pool.approvalMode, "value") else pool.approvalMode,
        "spendLimit": _decimal_str(pool.spendLimit) if pool.spendLimit else None,
    }


async def t_create_pool(session, user_id, args):
    pool_type = (args.get("type") or "FAMILY").upper()
    name = args.get("name")
    if not name:
        raise Errors.validation({"name": ["required"]})
    pool = Pool(
        type=PoolType(pool_type), name=name, description=args.get("description"),
        currentBalance=Decimal("0"),
        targetAmount=Decimal(str(args["targetAmount"])) if args.get("targetAmount") else None,
        createdById=user_id, status=PoolStatus.ACTIVE,
    )
    session.add(pool)
    await session.flush()
    session.add(PoolMember(poolId=pool.id, userId=user_id, role=MemberRole.OWNER, isActive=True))
    await session.commit()
    return {"id": pool.id, "name": pool.name, "type": pool_type}


async def t_archive_pool(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    return {"requiresPin": True, "action": "archive", "params": {"poolId": pool_id}}


async def t_delete_pool(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    pool, _ = await assert_pool_admin(session, pool_id, user_id)
    if pool.status != PoolStatus.DRAFT:
        raise Errors.conflict("Only DRAFT pools can be deleted")
    await session.delete(pool)
    await session.commit()
    return {"deleted": True, "poolId": pool_id}


# ──────────────────────────── MEMBERS ─────────────────────────────────────

async def t_list_pool_members(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    rows = (await session.execute(
        select(PoolMember, User).join(User, User.id == PoolMember.userId)
        .where(PoolMember.poolId == pool_id, PoolMember.isActive.is_(True))
    )).all()
    return {"items": [
        {
            "id": m.id, "userId": m.userId,
            "role": m.role.value if hasattr(m.role, "value") else m.role,
            "displayName": u.displayName, "phone": u.phone,
        }
        for m, u in rows
    ]}


async def t_remove_member(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    target = args.get("userId") or args.get("targetUserId")
    if not target:
        raise Errors.validation({"userId": ["required"]})
    await assert_pool_admin(session, pool_id, user_id)
    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == target)
    )).scalar_one_or_none()
    if not member:
        raise Errors.not_found("Member")
    member.isActive = False
    await session.commit()
    return {"removed": True, "userId": target}


async def t_leave_pool(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    member = (await session.execute(
        select(PoolMember).where(PoolMember.poolId == pool_id, PoolMember.userId == user_id)
    )).scalar_one_or_none()
    if not member:
        raise Errors.not_found("Member")
    member.isActive = False
    await session.commit()
    return {"left": True, "poolId": pool_id}


# ──────────────────────────── CONTRIBUTIONS ───────────────────────────────

async def t_contribute(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    return {
        "requiresPin": True, "action": "contribute",
        "params": {
            "poolId": pool_id,
            "amount": str(args["amount"]),
            "description": args.get("description"),
        },
    }


async def t_list_contributions(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    await assert_pool_member(session, pool_id, user_id)
    q = (
        select(Contribution, User).join(User, User.id == Contribution.userId)
        .where(Contribution.poolId == pool_id)
        .order_by(desc(Contribution.createdAt)).limit(50)
    )
    if args.get("memberId"):
        q = q.where(Contribution.userId == args["memberId"])
    rows = (await session.execute(q)).all()
    return {"items": [
        {
            "id": c.id, "amount": _decimal_str(c.amount), "userId": c.userId,
            "displayName": u.displayName, "createdAt": c.createdAt.isoformat(),
        }
        for c, u in rows
    ]}


async def t_get_contribution_summary(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    await assert_pool_member(session, pool_id, user_id)
    total, count = (await session.execute(
        select(func.coalesce(func.sum(Contribution.amount), 0), func.count())
        .where(Contribution.poolId == pool_id, Contribution.status == ContributionStatus.COMPLETED)
    )).first()
    return {"total": _decimal_str(total), "count": count}


# ──────────────────────────── SPEND REQUESTS ──────────────────────────────

async def t_create_spend_request(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    sr = await spend_service.create_spend_request(
        session, pool_id=pool_id, requester_id=user_id,
        amount=str(args["amount"]), title=args["title"],
        description=args.get("description"),
        category=args.get("category", "OTHER_TRIP"),
        receipt_url=args.get("receiptUrl"),
        is_emergency=bool(args.get("isEmergency", False)),
        expires_in_hours=int(args.get("expiresInHours", 24)),
    )
    await session.commit()
    return {"id": sr.id, "title": sr.title, "amount": _decimal_str(sr.amount), "status": sr.status.value}


async def t_list_spend_requests(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    await assert_pool_member(session, pool_id, user_id)
    q = select(SpendRequest).where(SpendRequest.poolId == pool_id).order_by(desc(SpendRequest.createdAt)).limit(50)
    if args.get("status"):
        q = q.where(SpendRequest.status == args["status"].upper())
    rows = (await session.execute(q)).scalars().all()
    return {"items": [
        {
            "id": r.id, "title": r.title, "amount": _decimal_str(r.amount),
            "status": r.status.value if hasattr(r.status, "value") else r.status,
            "category": r.category.value if hasattr(r.category, "value") else r.category,
            "createdAt": r.createdAt.isoformat(),
        }
        for r in rows
    ]}


async def t_vote(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    decision = (args.get("decision") or "APPROVE").upper()
    if decision not in {"APPROVE", "REJECT", "ABSTAIN"}:
        raise Errors.validation({"decision": ["must be APPROVE/REJECT/ABSTAIN"]})
    res = await spend_service.cast_vote(
        session, pool_id=pool_id, spend_request_id=args["requestId"],
        voter_id=user_id, decision=VoteDecision(decision), comment=args.get("comment"),
    )
    await session.commit()
    return res if isinstance(res, dict) else {"voted": True}


async def t_cancel_spend_request(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    res = await spend_service.cancel_spend_request(
        session, pool_id=pool_id, spend_request_id=args["requestId"], requester_id=user_id,
    )
    await session.commit()
    return res if isinstance(res, dict) else {"cancelled": True}


# ──────────────────────────── TRANSACTIONS ────────────────────────────────

async def t_get_my_transactions(session, user_id, args):
    limit = min(int(args.get("limit", 20)), 100)
    rows = (await session.execute(
        select(Transaction).where(Transaction.userId == user_id)
        .order_by(desc(Transaction.createdAt)).limit(limit)
    )).scalars().all()
    return {"items": [_serialize_tx(t) for t in rows]}


async def t_get_pool_transactions(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    await assert_pool_member(session, pool_id, user_id)
    limit = min(int(args.get("limit", 20)), 100)
    rows = (await session.execute(
        select(Transaction).where(Transaction.poolId == pool_id)
        .order_by(desc(Transaction.createdAt)).limit(limit)
    )).scalars().all()
    return {"items": [_serialize_tx(t) for t in rows]}


def _serialize_tx(t):
    return {
        "id": t.id, "amount": _decimal_str(t.amount),
        "type": t.type.value if hasattr(t.type, "value") else t.type,
        "direction": t.direction.value if hasattr(t.direction, "value") else t.direction,
        "description": t.description, "createdAt": t.createdAt.isoformat(),
    }


# ──────────────────────────── PROFILE / NOTIFICATIONS ─────────────────────

async def t_get_profile(session, user_id, args):
    u = await _get_user(session, user_id)
    return {
        "id": u.id, "displayName": u.displayName, "phone": u.phone,
        "preferredLang": u.preferredLang.value if hasattr(u.preferredLang, "value") else u.preferredLang,
    }


async def t_update_profile(session, user_id, args):
    u = await _get_user(session, user_id)
    if "displayName" in args:
        u.displayName = args["displayName"]
    if "preferredLang" in args:
        u.preferredLang = args["preferredLang"]
    await session.commit()
    return {"updated": True}


async def t_get_notifications(session, user_id, args):
    limit = min(int(args.get("limit", 20)), 100)
    q = select(Notification).where(Notification.userId == user_id)
    if args.get("unreadOnly"):
        q = q.where(Notification.isRead.is_(False))
    rows = (await session.execute(q.order_by(desc(Notification.createdAt)).limit(limit))).scalars().all()
    return {"items": [
        {
            "id": n.id, "title": n.title, "body": n.body,
            "isRead": n.isRead, "createdAt": n.createdAt.isoformat(),
        }
        for n in rows
    ]}


async def t_mark_notification_read(session, user_id, args):
    n = (await session.execute(
        select(Notification).where(Notification.id == args["notificationId"], Notification.userId == user_id)
    )).scalar_one_or_none()
    if not n:
        raise Errors.not_found("Notification")
    n.isRead = True
    await session.commit()
    return {"marked": True}


# ──────────────────────────── SAFETY / POOL AGENT DELEGATION ──────────────

async def t_check_scam(session, user_id, args):
    return await pool_agent_tools.detect_scam(args["message"], language=args.get("language", "EN"))


async def t_ask_pool_agent(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    await assert_pool_member(session, pool_id, user_id)
    return await pool_agent_tools.ask(session, pool_id=pool_id, question=args["question"])


async def t_get_budget_forecast(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    await assert_pool_member(session, pool_id, user_id)
    return await pool_agent_tools.forecast_budget(session, pool_id=pool_id)


async def t_suggest_smart_split(session, user_id, args):
    pool_id = await _resolve_pool_id(session, user_id, args)
    await assert_pool_member(session, pool_id, user_id)
    return await pool_agent_tools.suggest_split(session, pool_id=pool_id)


# ──────────────────────────── REGISTRY ────────────────────────────────────

ToolFn = Callable[[AsyncSession, str, dict], Awaitable[dict[str, Any]]]

REGISTRY: dict[str, ToolFn] = {
    # Wallet
    "get_balance": t_get_balance,
    "top_up": t_top_up,
    # Pools
    "list_my_pools": t_list_my_pools,
    "get_pool_detail": t_get_pool_detail,
    "create_pool": t_create_pool,
    "archive_pool": t_archive_pool,
    "delete_pool": t_delete_pool,
    # Members
    "list_pool_members": t_list_pool_members,
    "remove_member": t_remove_member,
    "leave_pool": t_leave_pool,
    # Contributions
    "contribute": t_contribute,
    "list_contributions": t_list_contributions,
    "get_contribution_summary": t_get_contribution_summary,
    # Spend requests
    "create_spend_request": t_create_spend_request,
    "list_spend_requests": t_list_spend_requests,
    "vote": t_vote,
    "cancel_spend_request": t_cancel_spend_request,
    # Transactions
    "get_my_transactions": t_get_my_transactions,
    "get_pool_transactions": t_get_pool_transactions,
    # Profile / notifications
    "get_profile": t_get_profile,
    "update_profile": t_update_profile,
    "get_notifications": t_get_notifications,
    "mark_notification_read": t_mark_notification_read,
    # Safety / pool agent delegation
    "check_scam": t_check_scam,
    "ask_pool_agent": t_ask_pool_agent,
    "get_budget_forecast": t_get_budget_forecast,
    "suggest_smart_split": t_suggest_smart_split,
}


async def execute_tool(session: AsyncSession, user_id: str, tool: str, args: dict) -> dict:
    fn = REGISTRY.get(tool)
    if fn is None:
        raise Errors.not_found(f"Unknown tool: {tool}")
    return await fn(session, user_id, args or {})


# ──────────────────────────── PIN-confirmed action executor ───────────────

async def confirm_action(session: AsyncSession, user_id: str, action: str, params: dict) -> dict:
    """Run a deferred action after the frontend collects the PIN.

    The frontend verifies PIN locally, then POSTs here. We trust the local
    PIN check (matches existing /auth flow) and simply execute the action.
    """
    if action == "contribute":
        res = await contribution_service.make_contribution(
            session, pool_id=params["poolId"], user_id=user_id,
            amount=str(params["amount"]),
            description=params.get("description"), receipt_url=None,
        )
        await session.commit()
        return {"ok": True, "result": res}
    if action == "archive":
        pool, _ = await assert_pool_admin(session, params["poolId"], user_id)
        pool.status = PoolStatus.ARCHIVED
        pool.isArchived = True
        await session.commit()
        return {"ok": True, "poolId": pool.id, "status": "ARCHIVED"}
    raise Errors.validation({"action": [f"unsupported action: {action}"]})
