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

// ----------------- Top up (demo helper) -----------------

export function useTopup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: string }) => api("/users/me/topup", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
  });
}
