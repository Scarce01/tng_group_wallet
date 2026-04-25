/**
 * Top-level hook the UI uses instead of hard-coded useState arrays.
 * Loads pools + their contributions + spend requests + transactions, and
 * adapts each into the UI's expected shape.
 */

import { useQueries, useQuery } from "@tanstack/react-query";
import { api, tokens, type Contribution, type Pool, type SpendRequest, type Transaction } from "./client";
import { adaptPool, adaptSpendRequest, adaptTransaction, type UiPool, type UiSpendingRequest, type UiTransaction } from "./adapter";
import { useMe } from "./hooks";

export function useUiData() {
  const me = useMe();
  const myUserId = me.data?.id;

  // Step 1: pool list
  const poolsQ = useQuery({
    queryKey: ["pools"],
    queryFn: async () => {
      const r = await api<{ items: Pool[] }>("/pools");
      return r.items;
    },
    enabled: !!tokens.access,
    staleTime: 5_000,
  });
  const pools = poolsQ.data ?? [];

  // Step 2: contributions for each pool (parallel)
  const contribQs = useQueries({
    queries: pools.map((p) => ({
      queryKey: ["pool", p.id, "contributions"],
      queryFn: async () => (await api<{ items: Contribution[] }>(`/pools/${p.id}/contributions?limit=200`)).items,
      enabled: !!tokens.access,
      staleTime: 5_000,
    })),
  });

  // Step 3: spend-requests for each pool (parallel)
  const srQs = useQueries({
    queries: pools.map((p) => ({
      queryKey: ["pool", p.id, "spend-requests"],
      queryFn: async () => (await api<{ items: SpendRequest[] }>(`/pools/${p.id}/spend-requests?limit=100`)).items,
      enabled: !!tokens.access,
      staleTime: 5_000,
    })),
  });

  // Step 4: transactions for each pool (parallel)
  const txQs = useQueries({
    queries: pools.map((p) => ({
      queryKey: ["pool", p.id, "transactions"],
      queryFn: async () => (await api<{ items: Transaction[] }>(`/pools/${p.id}/transactions?limit=100`)).items,
      enabled: !!tokens.access,
      staleTime: 5_000,
    })),
  });

  // Adapt each pool
  const uiPools: UiPool[] = pools.map((p, i) => adaptPool(p, contribQs[i]?.data ?? []));

  // Flatten spend requests across pools, attach poolId for the existing UI
  const uiSpendingRequests: (UiSpendingRequest & { poolId: string })[] = pools.flatMap((p, i) => {
    const list = srQs[i]?.data ?? [];
    const eligible = Math.max(1, (p.members?.filter((m) => m.isActive && m.role !== "VIEWER").length ?? 1) - 1);
    return list
      .filter((sr) => sr.requesterId !== myUserId || sr.status !== "EXECUTED")
      .map((sr) => ({ ...adaptSpendRequest(sr, eligible), poolId: p.id }));
  });

  const uiTransactions: UiTransaction[] = pools.flatMap((_, i) =>
    (txQs[i]?.data ?? []).map(adaptTransaction)
  );

  // Total personal balance — equal to my main wallet, plus my share of pool balances.
  // For the UI's "Total Family Funds" card we use sum of currentBalance across pools.
  const totalPersonalBalance = uiPools.reduce((s, p) => s + p.currentBalance, 0);
  const totalContributed = uiPools.reduce((s, p) => s + p.members.reduce((mm, m) => mm + m.contribution, 0), 0);

  const isLoading = poolsQ.isLoading || me.isLoading;
  const isError = poolsQ.isError || me.isError;

  return {
    me: me.data,
    myUserId,
    pools: uiPools,
    backendPools: pools,
    spendingRequests: uiSpendingRequests,
    transactions: uiTransactions,
    totalPersonalBalance,
    totalContributed,
    isLoading,
    isError,
  };
}
