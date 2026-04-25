/**
 * Maps backend payloads (decimal strings, ISO dates, separate contribution rows)
 * into the shape the existing App.tsx UI expects (numbers, "paid"/"pending"
 * member status, spendingRequests with approver names, transaction history with
 * "person" + "timestamp" strings).
 *
 * Lets us keep the Figma-imported UI verbatim while wiring the data through
 * React Query / our REST API.
 */

import type { Contribution, Pool, SpendRequest, Transaction, User } from "./client";

export interface UiMember {
  id: string;
  name: string;
  contribution: number;
  status: "paid" | "pending";
}

export interface UiPool {
  id: string;
  name: string;
  recommendedContribution: number;
  currentBalance: number;
  members: UiMember[];
}

export interface UiSpendingRequest {
  id: string;
  description: string;
  amount: number;
  requester: string;
  votes: { approved: number; total: number };
  status: "pending" | "approved" | "rejected";
  isLarge?: boolean;
  approvers: string[];
}

export interface UiTransaction {
  id: string;
  poolId: string;
  type: "contribution" | "spending";
  description: string;
  amount: number;
  person: string;
  timestamp: string;
  location?: string;
  category?: string;
  approvers?: string[];
  contributors?: { name: string; amount: number }[];
  notes?: string;
  remainingBalance?: number;
}

export function num(v: string | null | undefined): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function recommendedContribution(p: Pool): number {
  const activeMembers = p.members?.filter((m) => m.isActive).length || 1;
  if (p.targetAmount) return Math.round((num(p.targetAmount) / activeMembers) * 100) / 100;
  return 0;
}

export function adaptPool(p: Pool, contribs: Contribution[]): UiPool {
  const totalsByUser = new Map<string, number>();
  for (const c of contribs) {
    totalsByUser.set(c.userId, (totalsByUser.get(c.userId) ?? 0) + num(c.amount));
  }
  const target = recommendedContribution(p);
  const members: UiMember[] = (p.members ?? [])
    .filter((m) => m.isActive)
    .map((m) => {
      const contributed = totalsByUser.get(m.userId) ?? 0;
      const status: "paid" | "pending" = target === 0 || contributed >= target ? "paid" : "pending";
      return {
        id: m.id,
        name: m.user?.displayName ?? m.userId.slice(0, 6),
        contribution: contributed,
        status,
      };
    });
  return {
    id: p.id,
    name: p.name,
    recommendedContribution: target,
    currentBalance: num(p.currentBalance),
    members,
  };
}

export function adaptSpendRequest(sr: SpendRequest, totalEligibleMembers: number): UiSpendingRequest {
  const approvers = (sr.votes ?? [])
    .filter((v) => v.decision === "APPROVE")
    .map((v) => v.voter?.displayName ?? "");
  const approved = approvers.length;
  const status: UiSpendingRequest["status"] =
    sr.status === "APPROVED" || sr.status === "EXECUTED"
      ? "approved"
      : sr.status === "REJECTED" || sr.status === "EXPIRED" || sr.status === "CANCELLED"
      ? "rejected"
      : "pending";
  return {
    id: sr.id,
    description: sr.title + (sr.description ? ` — ${sr.description}` : ""),
    amount: num(sr.amount),
    requester: sr.requester?.displayName ?? "",
    votes: { approved, total: totalEligibleMembers },
    status,
    isLarge: num(sr.amount) > 400,
    approvers,
  };
}

export function adaptTransaction(t: Transaction): UiTransaction {
  const isContribution = t.type === "CONTRIBUTION" || t.type === "GRANT_DEPOSIT" as never;
  return {
    id: t.id,
    poolId: t.poolId ?? "",
    type: isContribution ? "contribution" : "spending",
    description: t.description,
    amount: num(t.amount),
    person: t.user?.displayName ?? "",
    timestamp: formatTimestamp(t.createdAt),
    category: extractStringMeta(t.metadata, "category"),
    location: extractStringMeta(t.metadata, "location"),
    remainingBalance: num(t.balanceAfter),
  };
}

function extractStringMeta(meta: unknown, key: string): string | undefined {
  if (typeof meta !== "object" || meta === null) return undefined;
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const now = new Date();
  const yest = new Date(Date.now() - 86400_000);
  const time = d.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" });
  if (sameDay(d, now)) return `Today, ${time}`;
  if (sameDay(d, yest)) return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short" }) + `, ${time}`;
}

export function userDisplay(u: User | undefined | null): string {
  return u?.displayName ?? "You";
}
