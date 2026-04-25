from typing import Any, Optional


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int, details: Optional[dict] = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details


class Errors:
    @staticmethod
    def validation(details: dict) -> AppError:
        return AppError("VALIDATION_ERROR", "Invalid request body", 400, details)

    @staticmethod
    def unauthenticated(msg: str = "Authentication required") -> AppError:
        return AppError("UNAUTHENTICATED", msg, 401)

    @staticmethod
    def forbidden(msg: str = "Forbidden") -> AppError:
        return AppError("FORBIDDEN", msg, 403)

    @staticmethod
    def not_found(resource: str) -> AppError:
        return AppError("NOT_FOUND", f"{resource} not found", 404)

    @staticmethod
    def conflict(msg: str) -> AppError:
        return AppError("CONFLICT", msg, 409)

    @staticmethod
    def insufficient_balance() -> AppError:
        return AppError("INSUFFICIENT_BALANCE", "Insufficient wallet balance", 400)

    @staticmethod
    def pool_frozen() -> AppError:
        return AppError("POOL_FROZEN", "Pool is frozen", 403)

    @staticmethod
    def pool_not_active() -> AppError:
        return AppError("POOL_NOT_ACTIVE", "Pool is not active", 400)

    @staticmethod
    def already_voted() -> AppError:
        return AppError("ALREADY_VOTED", "You have already voted on this request", 409)

    @staticmethod
    def vote_closed() -> AppError:
        return AppError("VOTE_CLOSED", "Voting is closed for this request", 400)

    @staticmethod
    def invite_expired() -> AppError:
        return AppError("INVITE_EXPIRED", "Invite has expired", 400)

    @staticmethod
    def invite_invalid() -> AppError:
        return AppError("INVITE_INVALID", "Invalid invite code", 400)
