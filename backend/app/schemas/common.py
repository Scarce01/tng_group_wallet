"""Shared validators / Pydantic v2 building blocks."""
from __future__ import annotations

import re
from decimal import Decimal
from typing import Annotated, Any

from pydantic import AfterValidator, BaseModel, BeforeValidator, ConfigDict, Field

_MONEY_RE = re.compile(r"^\d+(\.\d{1,2})?$")
_PHONE_RE = re.compile(r"^\+60\d{8,11}$")
_PIN_RE = re.compile(r"^\d{6}$")


def _coerce_money(v: Any) -> str:
    if isinstance(v, (int, float)):
        v = f"{Decimal(str(v)):.2f}"
    if not isinstance(v, str):
        raise ValueError("Invalid money amount")
    v = v.strip()
    if not _MONEY_RE.match(v):
        raise ValueError("Invalid money amount")
    if Decimal(v) <= 0:
        raise ValueError("Amount must be greater than zero")
    return v


def _money_str_only(v: Any) -> str:
    if not isinstance(v, str) or not _MONEY_RE.match(v):
        raise ValueError("Amount must be a positive decimal with up to 2 dp")
    return v


def _phone(v: str) -> str:
    v = v.strip()
    if not _PHONE_RE.match(v):
        raise ValueError("Phone must be a Malaysian number starting with +60")
    return v


def _pin(v: str) -> str:
    if not _PIN_RE.match(v):
        raise ValueError("PIN must be 6 digits")
    return v


MoneyAmount = Annotated[str, BeforeValidator(_coerce_money)]
"""Accepts string or number; output string with up to 2 dp; must be > 0."""

MoneyStr = Annotated[str, BeforeValidator(_money_str_only)]
"""String only; must look like /^\\d+(\\.\\d{1,2})?$/."""

Phone = Annotated[str, AfterValidator(_phone)]
Pin = Annotated[str, AfterValidator(_pin)]


class StrictBase(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=False)


class Pagination(StrictBase):
    cursor: str | None = None
    limit: int = Field(default=20, ge=1, le=100)
