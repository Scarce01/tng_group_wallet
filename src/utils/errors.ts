export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INSUFFICIENT_BALANCE"
  | "POOL_FROZEN"
  | "POOL_NOT_ACTIVE"
  | "ALREADY_VOTED"
  | "VOTE_CLOSED"
  | "INVITE_EXPIRED"
  | "INVITE_INVALID"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const Errors = {
  validation: (details: Record<string, unknown>) =>
    new AppError("VALIDATION_ERROR", "Invalid request body", 400, details),
  unauthenticated: (msg = "Authentication required") => new AppError("UNAUTHENTICATED", msg, 401),
  forbidden: (msg = "Forbidden") => new AppError("FORBIDDEN", msg, 403),
  notFound: (resource: string) => new AppError("NOT_FOUND", `${resource} not found`, 404),
  conflict: (msg: string) => new AppError("CONFLICT", msg, 409),
  insufficientBalance: () => new AppError("INSUFFICIENT_BALANCE", "Insufficient wallet balance", 400),
  poolFrozen: () => new AppError("POOL_FROZEN", "Pool is frozen", 403),
  poolNotActive: () => new AppError("POOL_NOT_ACTIVE", "Pool is not active", 400),
  alreadyVoted: () => new AppError("ALREADY_VOTED", "You have already voted on this request", 409),
  voteClosed: () => new AppError("VOTE_CLOSED", "Voting is closed for this request", 400),
  inviteExpired: () => new AppError("INVITE_EXPIRED", "Invite has expired", 400),
  inviteInvalid: () => new AppError("INVITE_INVALID", "Invalid invite code", 400),
};
