import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import { api, tokens, type AuthResult, type Contribution, type Pool, type SpendRequest, type Transaction, type User } from "./client";

// ----------------- Auth -----------------

export function useMe(options?: Partial<UseQueryOptions<User>>) {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/users/me"),
    enabled: !!tokens.access,
    staleTime: 30_000,
    ...options,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { phone: string; pin: string }) =>
      api<AuthResult>("/auth/login", { method: "POST", body: vars, noAuth: true }),
    onSuccess: (data) => {
      tokens.setSession(data.accessToken, data.refreshToken, data.user);
      qc.setQueryData(["me"], data.user);
      qc.invalidateQueries();
    },
  });
}

/**
 * Two-step "Sign in with QR" demo:
 *   1. POST /auth/qr-issue with phone+PIN -> server returns a stega-signed QR image
 *      (visible payload binds to the user, hidden bits carry an HMAC + timestamp).
 *   2. POST /auth/qr-login with that image -> server validates stega + 60s window,
 *      issues fresh obfuscated access/refresh tokens.
 *
 * Returns the QR image bytes via `qrImage` so the UI can flash it briefly to
 * prove the stega path actually ran.
 */
export interface QrIssueResult {
  image: string;
  visiblePayload: string;
  issuedAt: number;
  tag: string;
  expiresInSeconds: number;
}

export function useQrLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { phone: string; pin: string }) => {
      const issued = await api<QrIssueResult>("/auth/qr-issue", {
        method: "POST",
        body: vars,
        noAuth: true,
      });
      const auth = await api<AuthResult>("/auth/qr-login", {
        method: "POST",
        body: { image: issued.image },
        noAuth: true,
      });
      return { issued, auth };
    },
    onSuccess: ({ auth }) => {
      tokens.setSession(auth.accessToken, auth.refreshToken, auth.user);
      qc.setQueryData(["me"], auth.user);
      qc.invalidateQueries();
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const rt = tokens.refresh;
      if (rt) {
        try {
          await api("/auth/logout", { method: "POST", body: { refreshToken: rt } });
        } catch {
          // ignore
        }
      }
    },
    onSettled: () => {
      tokens.clear();
      qc.clear();
      // AppShell.Gate reads `tokens.access` non-reactively, so we need a hard
      // reload to bounce back to LoginPage. Also resets any in-flight queries
      // / WebSocket connections cleanly.
      if (typeof window !== "undefined") {
        window.location.assign("/");
      }
    },
  });
}

// ----------------- Pools -----------------

export function usePools() {
  return useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      const r = await api<{ items: Pool[] }>("/pools");
      return r.items;
    },
    enabled: !!tokens.access,
    staleTime: 10_000,
  });
}

export function usePool(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId],
    queryFn: () => api<Pool>(`/pools/${poolId}`),
    enabled: !!poolId && !!tokens.access,
    staleTime: 5_000,
  });
}

export function useCreatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      type: "TRIP" | "FAMILY";
      name: string;
      description?: string;
      targetAmount?: string;
      endDate?: string;
    }) => api<Pool>("/pools", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pools"] }),
  });
}

// ----------------- Members -----------------

export interface PoolMemberWithTotal {
  id: string;
  userId: string;
  role: string;
  isActive: boolean;
  contributedTotal: string;
  user: { id: string; displayName: string; avatarUrl: string | null; phone?: string };
}

export function usePoolMembers(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId, "members"],
    queryFn: async () => {
      const r = await api<{ items: PoolMemberWithTotal[] }>(`/pools/${poolId}/members`);
      return r.items;
    },
    enabled: !!poolId && !!tokens.access,
    staleTime: 10_000,
  });
}

// ----------------- Contributions -----------------

export function useContributions(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId, "contributions"],
    queryFn: async () => {
      const r = await api<{ items: Contribution[] }>(`/pools/${poolId}/contributions?limit=100`);
      return r.items;
    },
    enabled: !!poolId && !!tokens.access,
  });
}

export function useContribute(poolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: string; description?: string }) =>
      api(`/pools/${poolId}/contributions`, { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool", poolId] });
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["pools"] });
    },
  });
}

// ----------------- Spend requests + voting -----------------

export function useSpendRequests(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId, "spend-requests"],
    queryFn: async () => {
      const r = await api<{ items: SpendRequest[] }>(`/pools/${poolId}/spend-requests?limit=100`);
      return r.items;
    },
    enabled: !!poolId && !!tokens.access,
    staleTime: 5_000,
  });
}

export function useCreateSpendRequest(poolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      amount: string;
      title: string;
      category: string;
      description?: string;
      isEmergency?: boolean;
      expiresInHours?: number;
    }) =>
      api(`/pools/${poolId}/spend-requests`, {
        method: "POST",
        body: { isEmergency: false, expiresInHours: 24, ...body },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pool", poolId, "spend-requests"] }),
  });
}

export function useVote(poolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { spendRequestId: string; decision: "APPROVE" | "REJECT" | "ABSTAIN" }) =>
      api(`/pools/${poolId}/spend-requests/${vars.spendRequestId}/vote`, {
        method: "POST",
        body: { decision: vars.decision },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool", poolId] });
      qc.invalidateQueries({ queryKey: ["pool", poolId, "spend-requests"] });
    },
  });
}

// ----------------- Pool transactions -----------------

export function usePoolTransactions(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId, "transactions"],
    queryFn: async () => {
      const r = await api<{ items: Transaction[] }>(`/pools/${poolId}/transactions?limit=100`);
      return r.items;
    },
    enabled: !!poolId && !!tokens.access,
  });
}

// ----------------- Personal (cross-pool) transactions -----------------

export function useMyTransactions(limit = 25) {
  return useQuery({
    queryKey: ["me", "transactions", limit],
    queryFn: async () => {
      const r = await api<{ items: Transaction[] }>(`/users/me/transactions?limit=${limit}`);
      return r.items;
    },
    enabled: !!tokens.access,
    staleTime: 5_000,
  });
}

// ----------------- Pool analytics -----------------

export interface PoolAnalytics {
  pool: { name: string; currentBalance: string; targetAmount: string | null; type: string } | null;
  totals: {
    contributedTotal: string;
    contributionCount: number;
    spentTotal: string;
    spendCount: number;
  };
  perMember: {
    user?: { id: string; displayName: string; avatarUrl: string | null };
    contributed: string;
    spent: string;
    net: string;
  }[];
  spendByCategory: { category: string; total: string; count: number }[];
  flow: {
    contributors: { user?: { id: string; displayName: string }; amount: string }[];
    categories: { category: string; amount: string }[];
  };
}

export function usePoolAnalytics(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId, "analytics"],
    queryFn: () => api<PoolAnalytics>(`/pools/${poolId}/analytics`),
    enabled: !!poolId && !!tokens.access,
    staleTime: 10_000,
  });
}

// ----------------- Pool Agent (AI) -----------------

export interface AgentMessage {
  id: string;
  poolId: string;
  type: string;
  content: string;
  metadata: unknown;
  isRead: boolean;
  createdAt: string;
}

export interface AgentAskResult {
  answer: string;
  messageId?: string;
  reasoning?: string;
}

export function useAgentMessages(poolId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["pool", poolId, "agent", "messages", limit],
    queryFn: async () => {
      const r = await api<{ items: AgentMessage[]; nextCursor: string | null }>(
        `/pools/${poolId}/agent/messages?limit=${limit}`,
      );
      return r.items;
    },
    enabled: !!poolId && !!tokens.access,
    staleTime: 5_000,
  });
}

export function useAgentAsk(poolId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { question: string }) =>
      api<AgentAskResult>(`/pools/${poolId}/agent/ask`, { method: "POST", body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool", poolId, "agent", "messages"] });
    },
  });
}

export function useAgentBrief(poolId: string | undefined) {
  return useMutation({
    mutationFn: () => api<{ brief: string }>(`/pools/${poolId}/agent/brief`, { method: "POST" }),
  });
}

export function useAgentForecast(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId, "agent", "forecast"],
    queryFn: () => api<unknown>(`/pools/${poolId}/agent/forecast`),
    enabled: !!poolId && !!tokens.access,
    staleTime: 60_000,
  });
}

export function useAgentSuggestSplit(poolId: string | undefined) {
  return useMutation({
    mutationFn: () =>
      api<unknown>(`/pools/${poolId}/agent/suggest-split`, { method: "POST" }),
  });
}

export interface AgentContext {
  weather: unknown;
  locationTips: unknown;
  currencyRates: unknown;
  searchCache: unknown;
  lastContextRefresh: string | null;
}

export function useAgentContext(poolId: string | undefined) {
  return useQuery({
    queryKey: ["pool", poolId, "agent", "context"],
    queryFn: () => api<AgentContext | null>(`/pools/${poolId}/agent/context`),
    enabled: !!poolId && !!tokens.access,
    staleTime: 30_000,
  });
}

export interface ScamCheckResult {
  isScam: boolean;
  confidence: number;
  reason: string;
  signals?: string[];
}

export function useScamCheck() {
  return useMutation({
    mutationFn: (body: { message: string; language?: "EN" | "MS" | "ZH" }) =>
      api<ScamCheckResult>("/agent/check-scam", { method: "POST", body }),
  });
}

// ----------------- Top up (demo helper) -----------------

export function useTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: string }) => api("/users/me/topup", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
