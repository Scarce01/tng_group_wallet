from datetime import datetime
from typing import Literal, Optional

from pydantic import Field, model_validator, field_validator

from .common import MoneyStr, StrictBase


class CreatePoolIn(StrictBase):
    type: Literal["TRIP", "FAMILY"]
    name: str = Field(min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    coverImageUrl: Optional[str] = None
    targetAmount: Optional[MoneyStr] = None
    spendLimit: Optional[MoneyStr] = None
    approvalMode: Literal["MAJORITY", "UNANIMOUS", "THRESHOLD", "ADMIN_ONLY"] = "MAJORITY"
    approvalThreshold: int = Field(default=51, ge=1, le=100)
    emergencyOverride: bool = False
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None

    @field_validator("name", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v

    @model_validator(mode="after")
    def _trip_needs_end(self):
        if self.type == "TRIP" and not self.endDate:
            raise ValueError("Trip pools require endDate")
        return self


class UpdatePoolIn(StrictBase):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    coverImageUrl: Optional[str] = None
    targetAmount: Optional[MoneyStr] = None
    spendLimit: Optional[MoneyStr] = None
    approvalMode: Optional[Literal["MAJORITY", "UNANIMOUS", "THRESHOLD", "ADMIN_ONLY"]] = None
    approvalThreshold: Optional[int] = Field(default=None, ge=1, le=100)
    emergencyOverride: Optional[bool] = None
    endDate: Optional[datetime] = None


class ListPoolsQuery(StrictBase):
    type: Optional[Literal["TRIP", "FAMILY"]] = None
    status: Optional[Literal["DRAFT", "ACTIVE", "PAUSED", "SETTLED", "ARCHIVED"]] = None
