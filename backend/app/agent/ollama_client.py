"""Thin async client for the local Ollama daemon.

Usage:
    text = await query_ollama("Hello", model="llama3.2")

We deliberately avoid the official `ollama` Python package — it pulls in
sync httpx and an extra layer for no benefit; uvicorn already runs async
so we just hit /api/generate ourselves."""
import json
import logging
import os
import re
from typing import Optional

import httpx

log = logging.getLogger("agent.ollama")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("AGENT_DEFAULT_MODEL", "llama3.2")
REASONING_MODEL = os.getenv("AGENT_REASONING_MODEL", "deepseek-r1:8b")

# deepseek-r1 emits its chain-of-thought wrapped in <think>...</think>.
# We strip those before returning so the caller sees only the final answer
# (the chain-of-thought is logged at DEBUG level for inspection).
_THINK = re.compile(r"<think>[\s\S]*?</think>", re.IGNORECASE)


async def query_ollama(
    prompt: str,
    *,
    model: str = DEFAULT_MODEL,
    system: Optional[str] = None,
    json_mode: bool = False,
    temperature: float = 0.4,
    timeout_s: float = 120.0,
) -> str:
    body = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": temperature},
    }
    if system:
        body["system"] = system
    if json_mode:
        body["format"] = "json"

    async with httpx.AsyncClient(timeout=timeout_s) as client:
        r = await client.post(f"{OLLAMA_URL}/api/generate", json=body)
        r.raise_for_status()
        data = r.json()
    raw = data.get("response", "")
    if model.startswith("deepseek-r1"):
        cot_match = _THINK.search(raw)
        if cot_match:
            log.debug("deepseek thinking: %s", cot_match.group(0)[:400])
        raw = _THINK.sub("", raw).strip()
    return raw


async def query_ollama_json(prompt: str, **kwargs) -> dict:
    """Same as query_ollama but parses JSON. Returns {} on parse failure."""
    text = await query_ollama(prompt, json_mode=True, **kwargs)
    try:
        return json.loads(text)
    except Exception:
        # llama3 sometimes leaves stray prose around the JSON; try to extract
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
        log.warning("ollama returned non-JSON: %r", text[:200])
        return {}
