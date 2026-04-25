from typing import Literal, Optional

from pydantic import Field

from .common import Phone, StrictBase


class AddMemberIn(StrictBase):
    phone: Phone
    role: Literal["ADMIN", "MEMBER", "VIEWER"] = "MEMBER"
    contributionWeight: float = Field(default=1.0, gt=0, le=99)


class UpdateMemberIn(StrictBase):
    role: Optional[Literal["ADMIN", "MEMBER", "VIEWER"]] = None
    contributionWeight: Optional[float] = Field(default=None, gt=0, le=99)


class CreateInviteIn(StrictBase):
    phone: Optional[Phone] = None
    expiresInHours: int = Field(default=48, ge=1, le=168)
