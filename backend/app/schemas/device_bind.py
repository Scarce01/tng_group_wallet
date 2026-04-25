"""Pydantic v2 inputs for the device-bind passwordless login flow."""
from pydantic import Field

from .common import Phone, StrictBase


class InitiateIn(StrictBase):
    phone: Phone
    deviceId: str = Field(min_length=8, max_length=128)
    deviceLabel: str = Field(default="", max_length=120)
    appId: str = Field(default="tng-group-wallet-web", max_length=64)


class StatusIn(StrictBase):
    deviceId: str = Field(min_length=8, max_length=128)


class ApproveIn(StrictBase):
    requestId: str = Field(min_length=4, max_length=80)
    deviceId: str = Field(min_length=8, max_length=128)
    approverSig: str = Field(min_length=32, max_length=128)


class RejectIn(StrictBase):
    requestId: str = Field(min_length=4, max_length=80)
    deviceId: str = Field(min_length=8, max_length=128)
