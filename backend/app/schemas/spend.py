from typing import Literal, Optional

from pydantic import Field, field_validator

from .common import MoneyStr, StrictBase

SpendCategoryLit = Literal[
    "ACCOMMODATION", "TRANSPORT", "FOOD", "ACTIVITIES", "SHOPPING", "TOLL",
    "PETROL", "OTHER_TRIP", "RENT", "UTILITIES", "GROCERIES", "EDUCATION",
    "MEDICAL", "INSURANCE", "CHILDCARE", "OTHER_FAMILY",
]


class CreateSpendRequestIn(StrictBase):
    amount: MoneyStr
    title: str = Field(min_length=2, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    category: SpendCategoryLit
    receiptUrl: Optional[str] = None
    isEmergency: bool = False
    expiresInHours: int = Field(default=24, ge=1, le=168)

    @field_validator("title", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v


class VoteIn(StrictBase):
    decision: Literal["APPROVE", "REJECT", "ABSTAIN"]
    comment: Optional[str] = Field(default=None, max_length=300)


class ListSpendQuery(StrictBase):
    status: Optional[Literal["PENDING", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED", "EXECUTED"]] = None
    cursor: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=100)
