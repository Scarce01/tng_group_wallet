"""Agent tools — each is a high-level operation the API surface exposes.

Each tool returns a dict. The route layer is responsible for:
  1. Persisting the result as an AgentMessage if appropriate
  2. Returning a JSON-safe response

Tools that touch the DB take an `AsyncSession`."""
from __future__ import annotations

import json
import re
from decimal import Decimal
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from ..enums import AgentMessageType, ContributionStatus, TransactionType
from ..models import Contribution, Transaction
from sqlalchemy import select, func, desc
from . import router
from .external.context import format_external_for_prompt, refresh_context_if_needed
from .memory import (
    append_observation,
    get_pool_memory,
    record_agent_message,
    upsert_pool_memory,
)
from .ml import (
    anomaly_status,
    classifier_status,
    classify_transaction,
    score_transactions,
)
from .prompts import system_for
from .state import pool_financial_state


def _member_names(state: dict[str, Any]) -> list[str]:
    return [m.get("displayName", "") for m in state.get("members", []) if m.get("displayName")]


# ---------------- Pool setup (NL -> structured memory) ----------------

async def setup_pool_agent(
    session: AsyncSession, *, pool_id: str, description: str,
) -> dict[str, Any]:
    """Take a free-text description and have llama3.2 extract:
    purpose, parsedGoals[], location, spendingPlan[]. Persist into PoolAgentMemory."""
    state = await pool_financial_state(session, pool_id)
    sys = system_for(state.get("type", ""))
    prompt = f"""From this pool description, extract a JSON object with these keys:
- purpose: 1-sentence summary
- parsedGoals: array of short tags (e.g. ["beach", "seafood"])
- location: place name string or null
- spendingPlan: array of {{ category, amount, priority, notes }} (estimate amounts in MYR if not given)

Description:
\"\"\"{description}\"\"\"

Pool budget: RM {state.get('targetAmount') or 'not set'}, member count: {state.get('memberCount', 0)}.

Return ONLY JSON, no prose."""
    raw, meta = await router.query(prompt, task_type="extract_pool", system=sys, json_mode=True)
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(parsed, dict):
            parsed = {}
    except Exception:
        parsed = {}

    mem = await upsert_pool_memory(
        session, pool_id,
        purpose=parsed.get("purpose") or description[:200],
        parsedGoals=parsed.get("parsedGoals") or [],
        location=parsed.get("location"),
        spendingPlan=parsed.get("spendingPlan") or [],
    )

    summary_lines = [f"Pool agent ready. Purpose: {mem.purpose}"]
    if mem.location:
        summary_lines.append(f"Location: {mem.location}")
    if mem.parsedGoals:
        summary_lines.append("Goals: " + ", ".join(map(str, mem.parsedGoals)))
    if mem.spendingPlan:
        plan = ", ".join(
            f"{p.get('category', '?')} RM{p.get('amount', 0)}" for p in mem.spendingPlan[:5]
        )
        summary_lines.append("Plan: " + plan)
    msg = await record_agent_message(
        session, pool_id, AgentMessageType.POOL_SETUP,
        "\n".join(summary_lines), metadata={**meta, "raw": parsed},
    )
    return {"memory": _serialize_memory(mem), "message": _serialize_msg(msg)}


# ---------------- Spend evaluation ----------------

async def evaluate_spend(
    session: AsyncSession, *, pool_id: str, amount: str, category: str,
    title: str, description: Optional[str] = None,
) -> dict[str, Any]:
    """Quick gut-check on a spend request — returns recommendation + 2-3 sentences."""
    state = await pool_financial_state(session, pool_id)
    mem = await get_pool_memory(session, pool_id)
    sys = system_for(state.get("type", ""))

    plan_str = "(no plan set)"
    if mem and mem.spendingPlan:
        plan_str = "; ".join(
            f"{p.get('category')} RM{p.get('amount', '?')}" for p in mem.spendingPlan
        )

    ext_ctx = await refresh_context_if_needed(session, pool_id)
    ext_block = format_external_for_prompt(ext_ctx)

    prompt = f"""Evaluate this spend request:
- amount: RM {amount}
- category: {category}
- title: {title}
- description: {description or '(none)'}

Pool state:
- balance RM {state.get('currentBalance')}, target RM {state.get('targetAmount') or '-'}
- spent so far RM {state.get('totalSpent')} ({state.get('spendCount')} executed)
- pace: {state.get('pace')}, daily avg RM {state.get('dailyAvgSpend')} vs target RM {state.get('dailyBudgetTarget')}
- spending plan: {plan_str}
- members: {len(state.get('members', []))}, days remaining: {state.get('daysRemaining')}{ext_block}

Return 2-3 short sentences in this format:
recommendation: APPROVE | CAUTION | FLAG
reasoning: why
suggestion: optional one-line tip"""
    text, meta = await router.query(prompt, task_type="evaluate_spend", system=sys)
    rec = "APPROVE"
    m = re.search(r"recommendation\s*[:：]\s*(APPROVE|CAUTION|FLAG)", text, re.IGNORECASE)
    if m:
        rec = m.group(1).upper()

    msg = await record_agent_message(
        session, pool_id, AgentMessageType.SPEND_EVALUATION, text,
        metadata={**meta, "recommendation": rec, "amount": str(amount), "category": category},
    )
    await append_observation(session, pool_id, f"Eval {category} RM{amount} -> {rec}")
    return {
        "recommendation": rec,
        "text": text,
        "messageId": msg.id,
        "metadata": meta,
    }


# ---------------- Daily brief ----------------

async def generate_brief(session: AsyncSession, *, pool_id: str) -> dict[str, Any]:
    state = await pool_financial_state(session, pool_id)
    mem = await get_pool_memory(session, pool_id)
    sys = system_for(state.get("type", ""))

    obs_str = "(none yet)"
    if mem and mem.observations:
        obs_str = "; ".join(o.get("note", "") for o in mem.observations[-5:])

    ext_ctx = await refresh_context_if_needed(session, pool_id)
    ext_block = format_external_for_prompt(ext_ctx)

    prompt = f"""Write a 3-sentence daily brief for the pool members.
- balance RM {state.get('currentBalance')}, spent RM {state.get('totalSpent')} of RM {state.get('targetAmount') or '-'}
- pace: {state.get('pace')}, days remaining: {state.get('daysRemaining')}
- spend by category: {state.get('spendByCategory')}
- recent observations: {obs_str}{ext_block}

If pace is 'over', flag it with one concrete tip. If on track, just acknowledge.
If weather alerts are present and the pool is a TRIP, mention them with a practical suggestion."""
    text, meta = await router.query(prompt, task_type="daily_brief", system=sys)
    msg = await record_agent_message(
        session, pool_id, AgentMessageType.DAILY_BRIEF, text, metadata=meta,
    )
    return {"text": text, "messageId": msg.id, "metadata": meta}


# ---------------- Smart split (deepseek reasoning) ----------------

async def suggest_split(session: AsyncSession, *, pool_id: str) -> dict[str, Any]:
    state = await pool_financial_state(session, pool_id)
    sys = system_for(state.get("type", ""))

    contributed = (await session.execute(
        select(Contribution.userId, func.coalesce(func.sum(Contribution.amount), 0))
        .where(Contribution.poolId == pool_id, Contribution.status == ContributionStatus.COMPLETED)
        .group_by(Contribution.userId)
    )).all()
    contrib_map = {uid: float(amt or 0) for uid, amt in contributed}
    members = state.get("members", [])
    total_spent = float(state.get("totalSpent") or 0)
    n = max(1, len(members))
    fair_share = total_spent / n

    member_lines = []
    for m in members:
        uid = m["id"]
        paid = contrib_map.get(uid, 0.0)
        delta = paid - fair_share
        member_lines.append(f"- {m['displayName']} (id {uid}): contributed RM{paid:.2f}, fair share RM{fair_share:.2f}, delta RM{delta:+.2f}")

    prompt = f"""Compute a fair settlement for this pool. Total executed spend: RM {total_spent:.2f} across {n} members.

Per-member:
{chr(10).join(member_lines)}

Strategy: equal split unless someone's contribution is clearly above/below fair share. Return:
1. A short paragraph (2-3 sentences) explaining the recommended split
2. A JSON object on the LAST line with key `transfers`: array of {{from, to, amount}} with whole RM amounts (round 0.5 up).

Example final line:
{{"transfers":[{{"from":"id1","to":"id2","amount":50}}]}}"""

    text, meta = await router.query(prompt, task_type="smart_split", system=sys, max_tokens=700)

    transfers = []
    m = re.search(r"\{[^{}]*\"transfers\"[^{}]*\[[^\]]*\][^{}]*\}", text, re.DOTALL)
    if m:
        try:
            transfers = json.loads(m.group(0)).get("transfers", [])
        except Exception:
            pass

    msg = await record_agent_message(
        session, pool_id, AgentMessageType.SMART_SPLIT, text,
        metadata={**meta, "transfers": transfers, "fairShare": round(fair_share, 2)},
    )
    return {"text": text, "transfers": transfers, "messageId": msg.id, "metadata": meta}


# ---------------- Forecast ----------------

async def forecast_budget(session: AsyncSession, *, pool_id: str) -> dict[str, Any]:
    state = await pool_financial_state(session, pool_id)
    sys = system_for(state.get("type", ""))

    prompt = f"""Project end-of-period spending for this pool.
- balance RM {state.get('currentBalance')}, target RM {state.get('targetAmount') or '-'}
- spent RM {state.get('totalSpent')}, {state.get('daysElapsed')} days elapsed, {state.get('daysRemaining')} remaining
- daily avg: RM {state.get('dailyAvgSpend')}, daily budget target: RM {state.get('dailyBudgetTarget')}

Return:
projectedFinalSpend: <number RM>
verdict: ON_TRACK | TIGHT | OVER
note: one-sentence explanation"""
    text, meta = await router.query(prompt, task_type="forecast", system=sys)

    # Pull "projectedFinalSpend: 5400" out of the text if present
    proj = None
    m = re.search(r"projectedFinalSpend\s*[:：]\s*RM?\s*([\d,.]+)", text, re.IGNORECASE)
    if m:
        try:
            proj = float(m.group(1).replace(",", ""))
        except Exception:
            pass
    verdict = "ON_TRACK"
    m2 = re.search(r"verdict\s*[:：]\s*(ON_TRACK|TIGHT|OVER)", text, re.IGNORECASE)
    if m2:
        verdict = m2.group(1).upper()

    msg = await record_agent_message(
        session, pool_id, AgentMessageType.BUDGET_WARNING if verdict == "OVER" else AgentMessageType.DAILY_BRIEF,
        text, metadata={**meta, "verdict": verdict, "projectedFinalSpend": proj},
    )
    return {
        "text": text,
        "verdict": verdict,
        "projectedFinalSpend": proj,
        "messageId": msg.id,
        "metadata": meta,
    }


# ---------------- Scam detection (deepseek-r1) ----------------

async def detect_scam(message: str, *, language: str = "EN") -> dict[str, Any]:
    """No DB writes — caller decides whether to persist. Pure analysis."""
    sys = (
        "You are a Malaysian scam-detection analyst. You know common scam patterns: "
        "fake LHDN tax notices, parcel-pickup fees, JPJ saman, fake bank OTP, "
        "Macau scam, e-wallet 'reward', love-scam etc. Be skeptical."
    )
    prompt = f"""Analyse this message ({language}). Decide:
- isScam: true / false
- confidence: 0..1
- patterns: short tags (e.g. ["fake_authority", "urgency", "click_link"])
- explanation: 2 sentences for the user

Message:
\"\"\"{message}\"\"\"

Return JSON only."""
    raw, meta = await router.query(
        prompt, task_type="scam_analysis", system=sys, json_mode=True, temperature=0.2,
    )
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        parsed = {"isScam": False, "confidence": 0, "patterns": [], "explanation": str(raw)[:300]}
    return {**parsed, "metadata": meta}


# ---------------- Freeform ask ----------------

# ---------------- Local ML signals (ONNX classifier + anomaly detector) ----

async def _recent_pool_transactions(session: AsyncSession, pool_id: str, limit: int = 100) -> list[Transaction]:
    """Newest-first list of transactions tied to this pool. Used as input
    for both the classifier (label each one) and the anomaly detector
    (compute anomaly scores on the time-ordered sequence)."""
    rows = (await session.execute(
        select(Transaction)
        .where(Transaction.poolId == pool_id)
        .order_by(desc(Transaction.createdAt))
        .limit(limit)
    )).scalars().all()
    return list(rows)


def _tx_to_anomaly_input(tx: Transaction) -> dict[str, Any]:
    """Map a Transaction row to the dict shape expected by ml.anomaly.score_transactions."""
    desc_str = tx.description or ""
    # cheap merchant extraction: text up to the first dash, comma, or @ symbol
    merchant = re.split(r"[-,@]", desc_str, maxsplit=1)[0].strip()
    return {
        "id": tx.id,
        "amount": float(tx.amount or 0),
        "created_at": tx.createdAt,
        "category": (tx.metadata_ or {}).get("category", "other") if isinstance(tx.metadata_, dict) else "other",
        "recipient_id": merchant or "unknown",
        "user_id": tx.userId,
        "description": desc_str,
        "merchant": merchant,
    }


async def gather_ml_signals(session: AsyncSession, pool_id: str) -> dict[str, Any]:
    """Run the local ONNX models over the pool's recent transactions and
    return a compact digest the LLM can paste into its reasoning context.

    Cheap to call: bounded to 100 most-recent tx, both models are CPU-only
    and complete in well under 100 ms even on commodity hardware.

    Returns:
        {
          "available": bool,                   # at least one model loaded
          "classifier": {loaded, sample[]},     # labels for top spends
          "anomaly":    {loaded, anomalies[]}, # tx flagged as outliers
        }
    """
    txs = await _recent_pool_transactions(session, pool_id, limit=100)
    if not txs:
        return {"available": False, "reason": "no transactions"}

    cls_status = classifier_status()
    ano_status = anomaly_status()
    out: dict[str, Any] = {"available": cls_status["loaded"] or ano_status["loaded"]}

    # ── Classifier: tag the 5 largest spends so the LLM has category context
    if cls_status["loaded"]:
        spends = [t for t in txs if t.type == TransactionType.SPEND][:5]
        labelled = []
        for t in spends:
            inp = _tx_to_anomaly_input(t)
            r = classify_transaction(
                description=inp["description"],
                merchant_name=inp["merchant"],
                amount=inp["amount"],
                hour=t.createdAt.hour if t.createdAt else 12,
            )
            if r:
                labelled.append({
                    "txId": t.id,
                    "description": inp["description"][:60],
                    "amount": inp["amount"],
                    "predictedCategory": r["label"],
                    "confidence": round(r["confidence"], 3),
                })
        out["classifier"] = {"loaded": True, "sample": labelled}
    else:
        out["classifier"] = {"loaded": False, "reason": cls_status.get("loadError")}

    # ── Anomaly: flag outliers in the (chronological) tx stream
    if ano_status["loaded"]:
        # Anomaly model needs chronological order
        chrono = sorted(txs, key=lambda t: t.createdAt)
        rows = [_tx_to_anomaly_input(t) for t in chrono]
        # rough budget for normalization: pool target if known else sum of all
        state = await pool_financial_state(session, pool_id)
        budget = float(state.get("targetAmount") or sum(r["amount"] for r in rows) or 5000.0)
        scored = score_transactions(rows, pool_budget=budget)
        anomalies = [s for s in scored if s.get("isAnomaly")][:5]
        out["anomaly"] = {
            "loaded": True,
            "scanned": len(scored),
            "anomalies": [
                {
                    "txId": a["tx_id"],
                    "amount": a["amount"],
                    "score": round(a["score"], 4),
                    "category": a["category"],
                    "createdAt": a["createdAt"],
                }
                for a in anomalies
            ],
        }
    else:
        out["anomaly"] = {"loaded": False, "reason": ano_status.get("loadError")}

    return out


def _format_ml_for_prompt(signals: dict[str, Any]) -> str:
    """Render ML signals as a compact human-readable block for the LLM."""
    if not signals.get("available"):
        return "Local ML models: not loaded (skipping signals)."

    parts = ["Local ML signals (computed live from this pool's transactions):"]
    cls = signals.get("classifier", {})
    if cls.get("loaded") and cls.get("sample"):
        parts.append("  Top spends classified by DistilBERT:")
        for s in cls["sample"]:
            parts.append(
                f"    - RM {s['amount']:.2f} '{s['description']}' → {s['predictedCategory']} ({s['confidence']:.0%})"
            )
    ano = signals.get("anomaly", {})
    if ano.get("loaded"):
        n = len(ano.get("anomalies", []))
        if n == 0:
            parts.append(f"  Anomaly model scanned {ano.get('scanned', 0)} txs — none flagged as outliers.")
        else:
            parts.append(f"  Anomaly model flagged {n} of {ano.get('scanned', 0)} txs:")
            for a in ano["anomalies"]:
                parts.append(
                    f"    - RM {a['amount']:.2f} on {a['createdAt']} (score={a['score']}, cat={a['category']})"
                )
    return "\n".join(parts)


# ---------------- Q&A ----------------

async def ask(session: AsyncSession, *, pool_id: str, question: str) -> dict[str, Any]:
    state = await pool_financial_state(session, pool_id)
    mem = await get_pool_memory(session, pool_id)
    sys = system_for(state.get("type", ""))
    obs_str = "; ".join((o.get("note", "") for o in (mem.observations[-5:] if mem else [])))

    # Run local ONNX models over the pool's recent transactions; failures
    # degrade gracefully (render as "models not loaded" in the prompt block).
    ml_signals = await gather_ml_signals(session, pool_id)
    ml_block = _format_ml_for_prompt(ml_signals)

    prompt = f"""Pool snapshot:
{json.dumps({k: state.get(k) for k in ('name','type','currentBalance','targetAmount','totalSpent','spendCount','memberCount','daysRemaining','pace','spendByCategory')}, default=str)}

Recent agent observations: {obs_str or '(none)'}

{ml_block}

User question: {question}

Reply concisely (3-5 sentences). When the user asks about unusual spending,
anomalies, or categories, base your answer on the Local ML signals above."""

    text, meta = await router.query(prompt, task_type=None, system=sys)

    # Note: not persisting user/assistant turns to AgentMessage — that table's
    # type enum is domain-event shaped (SPEND_EVALUATION, BUDGET_WARNING, ...)
    # not chat turns. Frontend keeps the conversation in local state.

    return {"answer": text, "text": text, "metadata": meta, "mlSignals": ml_signals}


# ---------------- Helpers ----------------

def _serialize_memory(mem) -> dict[str, Any]:
    if mem is None:
        return None  # type: ignore[return-value]
    return {
        "poolId": mem.poolId,
        "purpose": mem.purpose,
        "parsedGoals": mem.parsedGoals or [],
        "location": mem.location,
        "spendingPlan": mem.spendingPlan or [],
        "splitStrategy": mem.splitStrategy,
        "strictness": mem.strictness,
        "detectedTone": mem.detectedTone,
        "humorAllowed": mem.humorAllowed,
        "observations": mem.observations or [],
        "lastBriefAt": mem.lastBriefAt.isoformat().replace("+00:00", "Z") if mem.lastBriefAt else None,
        "createdAt": mem.createdAt.isoformat().replace("+00:00", "Z"),
    }


def _serialize_msg(msg) -> dict[str, Any]:
    return {
        "id": msg.id,
        "poolId": msg.poolId,
        "type": msg.type.value if hasattr(msg.type, "value") else msg.type,
        "content": msg.content,
        "metadata": msg.metadata_ or {},
        "isRead": msg.isRead,
        "createdAt": msg.createdAt.isoformat().replace("+00:00", "Z"),
    }
