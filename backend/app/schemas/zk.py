from typing import Any

from pydantic import Field

from .common import StrictBase


class ProveIn(StrictBase):
    totalIncomeCents: int = Field(gt=0, le=1_000_000_000)


class VerifyIn(StrictBase):
    proof: dict[str, Any]
    publicSignals: list[str] = Field(min_length=1)
    commitmentHash: str = Field(min_length=8)
