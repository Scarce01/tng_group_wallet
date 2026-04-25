"""Strip RM amounts and PII before sending to the Claude API.

Ollama runs locally so it sees raw financial data. Claude gets a sanitized
view: amounts replaced by tier labels, phones masked, names replaced with
placeholder labels. This keeps personal money / identity off third-party
servers, matching the addon spec's privacy contract."""
import re
from typing import Iterable

# RM 1,234.56  /  RM1234.5  /  rm 100
_AMOUNT = re.compile(r"\bRM\s?\d[\d,]*(?:\.\d{1,2})?\b", re.IGNORECASE)
# +60xxxxxxxxx and 0xx-xxxxxxx-style Malaysian phones
_PHONE = re.compile(r"\+?60[\d\-\s]{8,12}|\b0\d[\d\-\s]{7,10}\b")
# IC: 6-2-4 like 900101-14-1234
_IC = re.compile(r"\b\d{6}-\d{2}-\d{4}\b")


def _bucket_amount(amount_str: str) -> str:
    digits = "".join(c for c in amount_str if c.isdigit() or c == ".")
    try:
        amt = float(digits)
    except ValueError:
        return "<amount>"
    if amt < 50:
        return "<small_amount>"
    if amt < 200:
        return "<medium_amount>"
    if amt < 1000:
        return "<large_amount>"
    return "<very_large_amount>"


def sanitize_text(text: str, *, member_names: Iterable[str] = ()) -> str:
    """Return a copy of `text` safe to send to Claude."""
    out = _AMOUNT.sub(lambda m: _bucket_amount(m.group(0)), text)
    out = _PHONE.sub("<phone>", out)
    out = _IC.sub("<ic>", out)
    # Replace member display names with stable labels (Member1, Member2...)
    for i, name in enumerate(member_names, start=1):
        if not name or len(name) < 2:
            continue
        out = re.sub(rf"\b{re.escape(name)}\b", f"Member{i}", out)
    return out


def sanitize_payload(payload: dict, *, member_names: Iterable[str] = ()) -> dict:
    """Deep-sanitize a dict (recurses through values)."""
    def _walk(v):
        if isinstance(v, str):
            return sanitize_text(v, member_names=member_names)
        if isinstance(v, dict):
            return {k: _walk(x) for k, x in v.items()}
        if isinstance(v, list):
            return [_walk(x) for x in v]
        if isinstance(v, (int, float)):
            return _bucket_amount(str(v))
        return v
    return _walk(payload)
