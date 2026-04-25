"""Thin Claude client for the nuance tier (Sonnet 4.5).

PRIVACY GATE: callers must use `query_claude_sanitized` (not the raw
`query_claude`) so the payload is run through `sanitize_text` first.
The raw helper is exposed only for non-pool prompts that have no PII."""
import logging
import os
from typing import Iterable, Optional

import anthropic

from .sanitizer import sanitize_text

log = logging.getLogger("agent.claude")

# Per user request — Sonnet 4.5 specifically.
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5")

_client: Optional[anthropic.Anthropic] = None


def _client_singleton() -> anthropic.Anthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        _client = anthropic.Anthropic(api_key=api_key)
    return _client


def query_claude(
    prompt: str,
    *,
    system: Optional[str] = None,
    max_tokens: int = 600,
    temperature: float = 0.6,
) -> str:
    """Raw call. NOT sanitized — only use for prompts with no pool PII."""
    c = _client_singleton()
    msg = c.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system or "You are a helpful assistant.",
        messages=[{"role": "user", "content": prompt}],
    )
    parts = [b.text for b in msg.content if getattr(b, "type", None) == "text"]
    return "".join(parts).strip()


def query_claude_sanitized(
    prompt: str,
    *,
    member_names: Iterable[str] = (),
    system: Optional[str] = None,
    max_tokens: int = 600,
    temperature: float = 0.6,
) -> str:
    """Sanitize PII/RM amounts, then call Claude. Use this for any pool
    content. The model receives placeholders like <medium_amount>,
    Member1, <phone> instead of real values."""
    safe_prompt = sanitize_text(prompt, member_names=member_names)
    safe_system = sanitize_text(system, member_names=member_names) if system else None
    log.debug("claude sanitized: %s", safe_prompt[:300])
    return query_claude(
        safe_prompt,
        system=safe_system,
        max_tokens=max_tokens,
        temperature=temperature,
    )
