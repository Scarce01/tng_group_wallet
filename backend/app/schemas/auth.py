from typing import Optional

from pydantic import EmailStr, Field, field_validator

from .common import Phone, Pin, StrictBase


class RegisterIn(StrictBase):
    phone: Phone
    pin: Pin
    fullName: str = Field(min_length=2, max_length=120)
    displayName: Optional[str] = Field(default=None, max_length=60)
    email: Optional[EmailStr] = Field(default=None, max_length=200)

    @field_validator("fullName", "displayName", mode="before")
    @classmethod
    def _strip(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("displayName")
    @classmethod
    def _displayname_min(cls, v):
        if v is not None and len(v) < 1:
            raise ValueError("displayName too short")
        return v


class LoginIn(StrictBase):
    phone: Phone
    pin: Pin


class RefreshIn(StrictBase):
    refreshToken: str = Field(min_length=10)
