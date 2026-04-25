from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Enum as SAEnum,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from .cuid import cuid
from . import enums as E


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _id() -> str:
    return cuid()


# Helper to bind a Python str-Enum to a Postgres enum type, naming each so
# Postgres doesn't auto-generate ugly names. Matches Prisma's enum names.
def E_(t, name: str):
    return SAEnum(t, name=name, native_enum=True, create_constraint=False, validate_strings=True)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "User"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    phone: Mapped[str] = mapped_column(String, unique=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    fullName: Mapped[str] = mapped_column(String)
    displayName: Mapped[str] = mapped_column(String)
    avatarUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pinHash: Mapped[str] = mapped_column(String)
    kycStatus: Mapped[E.KycStatus] = mapped_column(E_(E.KycStatus, "KycStatus"), default=E.KycStatus.PENDING)
    preferredLang: Mapped[E.Language] = mapped_column(E_(E.Language, "Language"), default=E.Language.MS)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updatedAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    mainBalance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))


class RefreshToken(Base):
    __tablename__ = "RefreshToken"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    userId: Mapped[str] = mapped_column(String, ForeignKey("User.id", ondelete="CASCADE"))
    tokenHash: Mapped[str] = mapped_column(String, unique=True)
    expiresAt: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revokedAt: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    __table_args__ = (Index("RefreshToken_userId_idx", "userId"),)


class Pool(Base):
    __tablename__ = "Pool"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    type: Mapped[E.PoolType] = mapped_column(E_(E.PoolType, "PoolType"))
    name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    coverImageUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    currency: Mapped[str] = mapped_column(String, default="MYR")
    targetAmount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    currentBalance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0"))
    status: Mapped[E.PoolStatus] = mapped_column(E_(E.PoolStatus, "PoolStatus"), default=E.PoolStatus.ACTIVE)
    approvalMode: Mapped[E.ApprovalMode] = mapped_column(E_(E.ApprovalMode, "ApprovalMode"), default=E.ApprovalMode.MAJORITY)
    approvalThreshold: Mapped[int] = mapped_column(Integer, default=51)
    spendLimit: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    emergencyOverride: Mapped[bool] = mapped_column(Boolean, default=False)
    startDate: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    endDate: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    isArchived: Mapped[bool] = mapped_column(Boolean, default=False)
    isFrozen: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    updatedAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc, onupdate=now_utc)
    createdById: Mapped[str] = mapped_column(String, ForeignKey("User.id"))

    __table_args__ = (
        Index("Pool_type_status_idx", "type", "status"),
        Index("Pool_createdById_idx", "createdById"),
    )


class PoolMember(Base):
    __tablename__ = "PoolMember"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    poolId: Mapped[str] = mapped_column(String, ForeignKey("Pool.id", ondelete="CASCADE"))
    userId: Mapped[str] = mapped_column(String, ForeignKey("User.id", ondelete="CASCADE"))
    role: Mapped[E.MemberRole] = mapped_column(E_(E.MemberRole, "MemberRole"), default=E.MemberRole.MEMBER)
    contributionWeight: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("1.0"))
    joinedAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)
    leftAt: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True)
    zkCommitmentHash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    zkProof: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    zkVerified: Mapped[bool] = mapped_column(Boolean, default=False)
    zkVerifiedAt: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship("User", lazy="joined")

    __table_args__ = (
        UniqueConstraint("poolId", "userId", name="PoolMember_poolId_userId_key"),
        Index("PoolMember_userId_idx", "userId"),
    )


class PoolInvite(Base):
    __tablename__ = "PoolInvite"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    poolId: Mapped[str] = mapped_column(String, ForeignKey("Pool.id", ondelete="CASCADE"))
    senderId: Mapped[str] = mapped_column(String, ForeignKey("User.id"))
    receiverId: Mapped[Optional[str]] = mapped_column(String, ForeignKey("User.id"), nullable=True)
    invitePhone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    inviteCode: Mapped[str] = mapped_column(String, unique=True)
    status: Mapped[E.InviteStatus] = mapped_column(E_(E.InviteStatus, "InviteStatus"), default=E.InviteStatus.PENDING)
    expiresAt: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    __table_args__ = (
        Index("PoolInvite_poolId_idx", "poolId"),
        Index("PoolInvite_status_idx", "status"),
    )


class Contribution(Base):
    __tablename__ = "Contribution"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    poolId: Mapped[str] = mapped_column(String, ForeignKey("Pool.id", ondelete="CASCADE"))
    userId: Mapped[str] = mapped_column(String, ForeignKey("User.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    type: Mapped[E.ContributionType] = mapped_column(E_(E.ContributionType, "ContributionType"), default=E.ContributionType.MANUAL)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    receiptUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[E.ContributionStatus] = mapped_column(E_(E.ContributionStatus, "ContributionStatus"), default=E.ContributionStatus.COMPLETED)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped["User"] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("Contribution_poolId_idx", "poolId"),
        Index("Contribution_userId_idx", "userId"),
        Index("Contribution_createdAt_idx", "createdAt"),
    )


class SpendRequest(Base):
    __tablename__ = "SpendRequest"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    poolId: Mapped[str] = mapped_column(String, ForeignKey("Pool.id", ondelete="CASCADE"))
    requesterId: Mapped[str] = mapped_column(String, ForeignKey("User.id"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    title: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[E.SpendCategory] = mapped_column(E_(E.SpendCategory, "SpendCategory"))
    receiptUrl: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[E.SpendStatus] = mapped_column(E_(E.SpendStatus, "SpendStatus"), default=E.SpendStatus.PENDING)
    isEmergency: Mapped[bool] = mapped_column(Boolean, default=False)
    expiresAt: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    resolvedAt: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    requester: Mapped["User"] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("SpendRequest_poolId_status_idx", "poolId", "status"),
        Index("SpendRequest_requesterId_idx", "requesterId"),
        Index("SpendRequest_expiresAt_idx", "expiresAt"),
    )


class Vote(Base):
    __tablename__ = "Vote"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    spendRequestId: Mapped[str] = mapped_column(String, ForeignKey("SpendRequest.id", ondelete="CASCADE"))
    voterId: Mapped[str] = mapped_column(String, ForeignKey("User.id"))
    decision: Mapped[E.VoteDecision] = mapped_column(E_(E.VoteDecision, "VoteDecision"))
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    votedAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    voter: Mapped["User"] = relationship("User", lazy="joined")

    __table_args__ = (
        UniqueConstraint("spendRequestId", "voterId", name="Vote_spendRequestId_voterId_key"),
        Index("Vote_voterId_idx", "voterId"),
    )


class Transaction(Base):
    __tablename__ = "Transaction"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    poolId: Mapped[Optional[str]] = mapped_column(String, ForeignKey("Pool.id"), nullable=True)
    userId: Mapped[str] = mapped_column(String, ForeignKey("User.id"))
    type: Mapped[E.TransactionType] = mapped_column(E_(E.TransactionType, "TransactionType"))
    direction: Mapped[E.TransactionDirection] = mapped_column(E_(E.TransactionDirection, "TransactionDirection"))
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    balanceBefore: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    balanceAfter: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    description: Mapped[str] = mapped_column(Text)
    contributionId: Mapped[Optional[str]] = mapped_column(String, ForeignKey("Contribution.id"), nullable=True)
    spendRequestId: Mapped[Optional[str]] = mapped_column(String, ForeignKey("SpendRequest.id"), nullable=True)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    user: Mapped["User"] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("Transaction_poolId_createdAt_idx", "poolId", "createdAt"),
        Index("Transaction_userId_createdAt_idx", "userId", "createdAt"),
        Index("Transaction_type_idx", "type"),
    )


class Notification(Base):
    __tablename__ = "Notification"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_id)
    userId: Mapped[str] = mapped_column(String, ForeignKey("User.id", ondelete="CASCADE"))
    type: Mapped[E.NotificationType] = mapped_column(E_(E.NotificationType, "NotificationType"))
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(Text)
    metadata_: Mapped[Optional[dict]] = mapped_column("metadata", JSONB, nullable=True)
    isRead: Mapped[bool] = mapped_column(Boolean, default=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now_utc)

    __table_args__ = (
        Index("Notification_userId_isRead_idx", "userId", "isRead"),
        Index("Notification_createdAt_idx", "createdAt"),
    )
