// Single fetch-based API client. JWT in localStorage with auto-refresh on 401.

const TOKEN_KEY = "tng_token";
const REFRESH_KEY = "tng_refresh";
const USER_KEY = "tng_user";

export interface ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
}

function makeError(status: number, body: unknown): ApiError {
  const e = new Error() as ApiError;
  e.status = status;
  const errObj = (body as { error?: { code?: string; message?: string; details?: unknown } })?.error;
  e.code = errObj?.code ?? "UNKNOWN";
  e.message = errObj?.message ?? `HTTP ${status}`;
  e.details = errObj?.details;
  return e;
}

export const tokens = {
  get access() {
    return localStorage.getItem(TOKEN_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  setSession(access: string, refresh: string, user: unknown) {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setUser(user: unknown) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
  cachedUser<T = unknown>(): T | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
};

let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  if (refreshing) return refreshing;
  const rt = tokens.refresh;
  if (!rt) return null;
  refreshing = (async () => {
    try {
      const r = await fetch("/api/v1/auth/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      if (!r.ok) return null;
      const data = await r.json();
      tokens.setSession(data.accessToken, data.refreshToken, data.user);
      return data.accessToken as string;
    } catch {
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

export interface ApiOpts {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  noAuth?: boolean;
}

export async function api<T = unknown>(path: string, opts: ApiOpts = {}): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (!opts.noAuth && tokens.access) headers.authorization = `Bearer ${tokens.access}`;

  const doFetch = (h: Record<string, string>) =>
    fetch(`/api/v1${path}`, {
      method: opts.method ?? "GET",
      headers: h,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });

  let res = await doFetch(headers);

  // Try one silent refresh on 401
  if (res.status === 401 && !opts.noAuth && tokens.refresh) {
    const newToken = await tryRefresh();
    if (newToken) {
      headers.authorization = `Bearer ${newToken}`;
      res = await doFetch(headers);
    }
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({} as unknown));
  if (!res.ok) throw makeError(res.status, data);
  return data as T;
}

// ----- Domain types (shapes returned by the backend) -----

export interface User {
  id: string;
  phone: string;
  email: string | null;
  fullName: string;
  displayName: string;
  avatarUrl: string | null;
  kycStatus: "PENDING" | "SUBMITTED" | "VERIFIED" | "REJECTED";
  preferredLang: "EN" | "MS" | "ZH";
  mainBalance: string;
  createdAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface PoolMember {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  contributionWeight: string;
  isActive: boolean;
  user?: { id: string; displayName: string; avatarUrl: string | null; phone?: string };
}

export interface Pool {
  id: string;
  type: "TRIP" | "FAMILY";
  name: string;
  description: string | null;
  currency: string;
  targetAmount: string | null;
  currentBalance: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "SETTLED" | "ARCHIVED";
  approvalMode: "MAJORITY" | "UNANIMOUS" | "THRESHOLD" | "ADMIN_ONLY";
  approvalThreshold: number;
  spendLimit: string | null;
  emergencyOverride: boolean;
  startDate: string;
  endDate: string | null;
  isArchived: boolean;
  isFrozen: boolean;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  members?: PoolMember[];
  _count?: { spendRequests?: number; contributions?: number };
}

export interface SpendVote {
  id?: string;
  voterId: string;
  decision: "APPROVE" | "REJECT" | "ABSTAIN";
  voter?: { id: string; displayName: string; avatarUrl: string | null };
}

export interface SpendRequest {
  id: string;
  poolId: string;
  requesterId: string;
  amount: string;
  title: string;
  description: string | null;
  category: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | "EXECUTED";
  isEmergency: boolean;
  expiresAt: string;
  resolvedAt: string | null;
  createdAt: string;
  requester?: { id: string; displayName: string; avatarUrl: string | null };
  votes?: SpendVote[];
}

export interface Contribution {
  id: string;
  poolId: string;
  userId: string;
  amount: string;
  type: string;
  description: string | null;
  status: string;
  createdAt: string;
  user?: { id: string; displayName: string; avatarUrl: string | null };
}

export interface Transaction {
  id: string;
  poolId: string | null;
  userId: string;
  type: "CONTRIBUTION" | "SPEND" | "REFUND" | "SETTLEMENT" | "TRANSFER" | "TOPUP";
  direction: "IN" | "OUT";
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  description: string;
  contributionId: string | null;
  spendRequestId: string | null;
  metadata: unknown;
  createdAt: string;
  user?: { id: string; displayName: string; avatarUrl: string | null };
}
