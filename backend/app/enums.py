import enum


class KycStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class Language(str, enum.Enum):
    EN = "EN"
    MS = "MS"
    ZH = "ZH"


class PoolType(str, enum.Enum):
    TRIP = "TRIP"
    FAMILY = "FAMILY"


class PoolStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    SETTLED = "SETTLED"
    ARCHIVED = "ARCHIVED"


class ApprovalMode(str, enum.Enum):
    MAJORITY = "MAJORITY"
    UNANIMOUS = "UNANIMOUS"
    THRESHOLD = "THRESHOLD"
    ADMIN_ONLY = "ADMIN_ONLY"


class MemberRole(str, enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    MEMBER = "MEMBER"
    VIEWER = "VIEWER"


class InviteStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"


class ContributionType(str, enum.Enum):
    MANUAL = "MANUAL"
    AUTO_INCOME = "AUTO_INCOME"
    GRANT = "GRANT"
    REFUND = "REFUND"


class ContributionStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class SpendCategory(str, enum.Enum):
    ACCOMMODATION = "ACCOMMODATION"
    TRANSPORT = "TRANSPORT"
    FOOD = "FOOD"
    ACTIVITIES = "ACTIVITIES"
    SHOPPING = "SHOPPING"
    TOLL = "TOLL"
    PETROL = "PETROL"
    OTHER_TRIP = "OTHER_TRIP"
    RENT = "RENT"
    UTILITIES = "UTILITIES"
    GROCERIES = "GROCERIES"
    EDUCATION = "EDUCATION"
    MEDICAL = "MEDICAL"
    INSURANCE = "INSURANCE"
    CHILDCARE = "CHILDCARE"
    OTHER_FAMILY = "OTHER_FAMILY"


class SpendStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"
    EXECUTED = "EXECUTED"


class VoteDecision(str, enum.Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    ABSTAIN = "ABSTAIN"


class TransactionType(str, enum.Enum):
    CONTRIBUTION = "CONTRIBUTION"
    SPEND = "SPEND"
    REFUND = "REFUND"
    SETTLEMENT = "SETTLEMENT"
    TRANSFER = "TRANSFER"
    TOPUP = "TOPUP"


class TransactionDirection(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"


class NotificationType(str, enum.Enum):
    CONTRIBUTION_RECEIVED = "CONTRIBUTION_RECEIVED"
    SPEND_REQUEST_NEW = "SPEND_REQUEST_NEW"
    SPEND_REQUEST_APPROVED = "SPEND_REQUEST_APPROVED"
    SPEND_REQUEST_REJECTED = "SPEND_REQUEST_REJECTED"
    SPEND_REQUEST_EXPIRED = "SPEND_REQUEST_EXPIRED"
    VOTE_REMINDER = "VOTE_REMINDER"
    POOL_INVITE = "POOL_INVITE"
    MEMBER_JOINED = "MEMBER_JOINED"
    MEMBER_LEFT = "MEMBER_LEFT"
    POOL_FROZEN = "POOL_FROZEN"
