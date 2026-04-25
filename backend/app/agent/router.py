"""Three-tier model router.

Decides which backend a given task should hit:

  llama3.2     — high-frequency, simple extraction / templated generation
  deepseek-r1  — reasoning-heavy: smart split, scam detection, anomaly explain
  claude       — nuance: settlement narrative, conflict mediation, personality

The caller passes a `task_type` string. If none is given, llama3.2 is used.

Sanitization: Claude calls automatically run through the sanitizer. Ollama
calls do NOT — they see raw RM amounts and member names, which is safe
because Ollama runs on the user's machine."""
import asyncio
import logging
import time
from typing import Iterable, Literal, Optional

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
    if chosen == "claude":
        # Claude SDK is sync-only; offload to a thread.
        response = await asyncio.to_thread(
            query_claude_sanitized,
            prompt,
            member_names=member_names,
            system=system,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        model_id = "claude-sonnet-4-5"
    else:
        model_id = REASONING_MODEL if chosen == "deepseek-r1" else DEFAULT_MODEL
        if json_mode:
            response = await query_ollama_json(
                prompt, model=model_id, system=system, temperature=temperature
            )
            response = response if isinstance(response, str) else _to_json(response)
        else:
            response = await query_ollama(
                prompt, model=model_id, system=system, temperature=temperature
            )

    latency_ms = int((time.monotonic() - start) * 1000)
    meta = {
        "tier": chosen,
        "model": model_id,
        "task_type": task_type,
        "latency_ms": latency_ms,
    }
    log.info("agent.query tier=%s model=%s task=%s latency=%dms", chosen, model_id, task_type, latency_ms)
    return response, meta


def _to_json(d) -> str:
    import json as _json
    try:
        return _json.dumps(d)
    except Exception:
        return str(d)
