"""Serialize ORM rows the same way Prisma does in the Node backend.

Prisma JSON output rules:
  - Decimal -> string with up to 2 dp ("1234.50" not number)
  - DateTime -> ISO-8601 with millis and trailing "Z" ("2024-01-01T00:00:00.000Z")
  - Enum -> bare uppercase string ("ACTIVE")
  - null -> null

We mirror that here so the React frontend (which was written against the Node
shapes) does not see any difference.
"""
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Iterable

from sqlalchemy.orm import DeclarativeBase

# Columns that hold money — we always emit a 2dp string for these.
_MONEY_KEYS = {
    "amount",
    "balanceBefore",
    "balanceAfter",
    "mainBalance",
    "currentBalance",
    "targetAmount",
    "spendLimit",
    "contributionWeight",
}


def _to_iso_z(dt: datetime) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    # Match Prisma "...Z" with millisecond precision
    s = dt.strftime("%Y-%m-%dT%H:%M:%S")
    ms = f"{dt.microsecond // 1000:03d}"
    return f"{s}.{ms}Z"


def _format_decimal(d: Decimal | str | int | float, *, money: bool) -> str:
    if not isinstance(d, Decimal):
        d = Decimal(str(d))
    if money:
        return f"{d.quantize(Decimal('0.01'))}"
    # Non-money decimals (e.g. contributionWeight) — keep up to 2dp
    return f"{d.normalize():f}" if d == d.to_integral() else f"{d:.2f}"


def _convert_value(key: str | None, v: Any) -> Any:
    if v is None:
        return None
    if isinstance(v, Enum):
        return v.value
    if isinstance(v, datetime):
        return _to_iso_z(v)
    if isinstance(v, Decimal):
        return _format_decimal(v, money=key in _MONEY_KEYS if key else False)
    if isinstance(v, dict):
        return {k: _convert_value(k, vv) for k, vv in v.items()}
    if isinstance(v, list):
        return [_convert_value(None, x) for x in v]
    return v


def model_to_dict(obj: Any, *, include: Iterable[str] | None = None,
                  exclude: Iterable[str] = (), extra: dict | None = None) -> dict:
    """Convert a SQLAlchemy ORM row to a JSON-friendly dict.

    Honors a `_json_aliases` class-level dict for renaming attributes when
    the column name differs from the desired API key (e.g. metadata_).
    """
    if obj is None:
        return None  # type: ignore[return-value]
    if isinstance(obj, dict):
        result = {k: _convert_value(k, v) for k, v in obj.items()}
        if extra:
            result.update({k: _convert_value(k, v) for k, v in extra.items()})
        return result
    mapper = getattr(obj.__class__, "__mapper__", None)
    if mapper is None:
        return _convert_value(None, obj)  # fallback

    # column_attrs is keyed by the *Python* attribute name (e.g. "metadata_"),
    # while .columns[0].name is the DB column name (e.g. "metadata"). We need
    # the Python name for getattr, and the column name for the JSON key.
    col_attrs = {ca.key: ca.columns[0].name for ca in mapper.column_attrs}
    result: dict[str, Any] = {}
    keys = include if include is not None else col_attrs.keys()
    for key in keys:
        if key in exclude:
            continue
        if key not in col_attrs:
            val = getattr(obj, key, None)
            result[key] = jsonable(val)
            continue
        out_key = col_attrs[key]
        if out_key in exclude:
            continue
        v = getattr(obj, key)
        result[out_key] = _convert_value(out_key, v)
    if extra:
        result.update({k: _convert_value(k, v) for k, v in extra.items()})
    return result


def jsonable(v: Any) -> Any:
    """Recursively convert ORM rows / containers to JSON-friendly values."""
    if v is None:
        return None
    if isinstance(v, (str, int, float, bool)):
        return v
    if isinstance(v, Enum):
        return v.value
    if isinstance(v, datetime):
        return _to_iso_z(v)
    if isinstance(v, Decimal):
        return _format_decimal(v, money=False)
    if isinstance(v, list):
        return [jsonable(x) for x in v]
    if isinstance(v, dict):
        return {k: _convert_value(k, x) for k, x in v.items()}
    if isinstance(v, DeclarativeBase) or hasattr(v.__class__, "__mapper__"):
        return model_to_dict(v)
    return v
