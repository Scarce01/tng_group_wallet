"""Three-tier model router.

Decides which backend a given task should hit:

  llama3.2     — high-frequency, simple extraction / templated generation
  deepseek-r1  — reasoning-heavy: smart split, scam detection, anomaly explain
  claude       — nuance: settlement narrative, conflict mediation, personality

The caller passes a `task_type` string. If none is given, llama3.2 is used.

Sanitization: Claude calls automatically run through the sanitizer. Ollama
calls do NOT — they see raw RM amounts and member names, which is safe
because Ollama runs on the user's machine.

Fallback: if the local Ollama daemon is unreachable, the router transparently
re-routes the call to Claude (sanitized) so Main Agent and Pool Agent keep
working when llama3.2 is offline."""
import asyncio
import json as _json
import logging
import os
import re
import time
from typing import Iterable, Literal, Optional

import httpx

from .claude_client import query_claude_sanitized
from .ollama_client import (
    DEFAULT_MODEL,
    REASONING_MODEL,
    query_ollama,
    query_ollama_json,
)

log = logging.getLogger("agent.router")

Tier = Literal["llama3.2", "deepseek-r1", "claude", "auto"]

# Task → tier table. Anything not listed stays on llama3.2 (the cheap default).
_DEEPSEEK_TASKS = {
    "smart_split",
    "scam_analysis",
    "grant_eligibility",
    "anomaly_explain",
    "complex_eval",
    "forecast_reasoning",
}
_CLAUDE_TASKS = {
    "settlement_narrative",
    "conflict_mediation",
    "personality_calibration",
    "anticipatory",
    "humor_response",
    # Main Agent + Pool Agent — promoted to Claude for better instruction
    # following (tool calls + JSON shape). If ANTHROPIC_API_KEY is unset or
    # Claude errors, the existing Ollama fallback path catches it.
    "main_agent",
    "main_agent_followup",
    "daily_brief",
    "evaluate_spend",
    "extract_pool",
    "forecast",
}


def select_tier(task_type: Optional[str]) -> Tier:
    if task_type in _CLAUDE_TASKS:
        return "claude"
    if task_type in _DEEPSEEK_TASKS:
        return "deepseek-r1"
    return "llama3.2"


async def query(
    prompt: str,
    *,
    task_type: Optional[str] = None,
    tier: Tier = "auto",
    system: Optional[str] = None,
    json_mode: bool = False,
    member_names: Iterable[str] = (),
    temperature: float = 0.4,
    max_tokens: int = 600,
) -> tuple[str, dict]:
    """Run a prompt on the chosen tier. Returns (response, meta).

    meta is a dict suitable for storing on AgentMessage.metadata so the UI /
    audit log knows which backend produced what."""
    chosen: Tier = select_tier(task_type) if tier == "auto" else tier
    start = time.monotonic()

    response: str
    fallback_used = False
    if chosen == "claude":
        try:
            # Claude SDK is sync-only; offload to a thread.
            response = await asyncio.to_thread(
                _claude_call,
                prompt,
                member_names=member_names,
                system=system,
                max_tokens=max_tokens,
                temperature=temperature,
                json_mode=json_mode,
            )
            model_id = "claude-sonnet-4-5"
        except Exception as e:
            log.warning(
                "agent.query claude failed (task=%s): %s — falling back to Ollama",
                task_type, e,
            )
            model_id = DEFAULT_MODEL
            if json_mode:
                response = await query_ollama_json(
                    prompt, model=model_id, system=system, temperature=temperature
                )
                response = response if isinstance(response, str) else _to_json(response)
            else:
                response = await query_ollama(
                    prompt, model=model_id, system=system, temperature=temperature
                )
            chosen = "llama3.2"
            fallback_used = True
            fallback_from_label = "claude"
        else:
            fallback_from_label = None
    else:
        fallback_from_label = None
        model_id = REASONING_MODEL if chosen == "deepseek-r1" else DEFAULT_MODEL
        try:
            if json_mode:
                response = await query_ollama_json(
                    prompt, model=model_id, system=system, temperature=temperature
                )
                response = response if isinstance(response, str) else _to_json(response)
            else:
                response = await query_ollama(
                    prompt, model=model_id, system=system, temperature=temperature
                )
        except Exception as e:
            if not _is_ollama_unreachable(e) or not _claude_fallback_enabled():
                raise
            log.warning(
                "agent.query ollama unreachable (model=%s task=%s): %s — falling back to Claude",
                model_id, task_type, e,
            )
            response = await _claude_fallback(
                prompt,
                system=system,
                json_mode=json_mode,
                member_names=member_names,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            model_id = "claude-sonnet-4-5"
            chosen = "claude"
            fallback_used = True
            fallback_from_label = "ollama"

    latency_ms = int((time.monotonic() - start) * 1000)
    meta = {
        "tier": chosen,
        "model": model_id,
        "task_type": task_type,
        "latency_ms": latency_ms,
    }
    if fallback_used and fallback_from_label:
        meta["fallback_from"] = fallback_from_label
    log.info(
        "agent.query tier=%s model=%s task=%s latency=%dms%s",
        chosen, model_id, task_type, latency_ms,
        f" fallback={fallback_from_label}→{chosen}" if fallback_used else "",
    )
    return response, meta


def _claude_call(
    prompt: str,
    *,
    member_names: Iterable[str],
    system: Optional[str],
    max_tokens: int,
    temperature: float,
    json_mode: bool,
) -> str:
    """Sync helper: sanitized Claude call. Adds a JSON-only system note when
    json_mode is requested, then strips fences/prose and returns a parseable
    JSON string (or '{}' if Claude refused to comply)."""
    sys_prompt = system
    if json_mode:
        json_note = (
            "Respond ONLY with a single valid JSON object. "
            "No prose, no markdown fences, no commentary before or after."
        )
        sys_prompt = f"{system}\n\n{json_note}" if system else json_note
    text = query_claude_sanitized(
        prompt,
        member_names=member_names,
        system=sys_prompt,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    if not json_mode:
        return text
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    m = re.search(r"\{[\s\S]*\}", cleaned)
    candidate = m.group(0) if m else cleaned
    try:
        _json.loads(candidate)
        return candidate
    except Exception:
        log.warning("claude returned non-JSON: %r", text[:200])
        return "{}"


def _claude_fallback_enabled() -> bool:
    if os.getenv("AGENT_CLAUDE_FALLBACK", "1") == "0":
        return False
    return bool(os.getenv("ANTHROPIC_API_KEY"))


def _is_ollama_unreachable(err: Exception) -> bool:
    """True if the error is Ollama being down/missing — connection refused,
    DNS failure, timeout. We do NOT fall back on real model errors (e.g.
    bad prompt) since those would also fail on Claude."""
    if isinstance(err, (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout, httpx.NetworkError)):
        return True
    if isinstance(err, httpx.HTTPStatusError):
        # 404 model-not-pulled is a config issue; fall back so the user still gets a reply.
        return err.response.status_code in (404, 500, 502, 503, 504)
    msg = str(err).lower()
    return any(s in msg for s in ("connection refused", "name or service", "ollama"))


async def _claude_fallback(
    prompt: str,
    *,
    system: Optional[str],
    json_mode: bool,
    member_names: Iterable[str],
    temperature: float,
    max_tokens: int,
) -> str:
    return await asyncio.to_thread(
        _claude_call,
        prompt,
        member_names=member_names,
        system=system,
        max_tokens=max_tokens,
        temperature=temperature,
        json_mode=json_mode,
    )


def _to_json(d) -> str:
    import json as _json
    try:
        return _json.dumps(d)
    except Exception:
        return str(d)
