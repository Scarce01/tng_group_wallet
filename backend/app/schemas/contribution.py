from typing import Optional

from pydantic import Field

from .common import MoneyStr, StrictBase


class CreateContributionIn(StrictBase):
    amount: MoneyStr
    description: Optional[str] = Field(default=None, max_length=200)
    receiptUrl: Optional[str] = None


class ListContributionsQuery(StrictBase):
    userId: Optional[str] = None
    cursor: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=500)
