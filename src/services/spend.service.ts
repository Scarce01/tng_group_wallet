import { Prisma, type ApprovalMode, type Pool, type Vote, type SpendRequest } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { Errors } from "../utils/errors.js";
import { ensureActivePool } from "./pool.service.js";

type Resolution = "PENDING" | "APPROVED" | "REJECTED";

/**
 * Returns the new SpendRequest.status based on current votes & pool rules.
 * Pure function (no I/O) so it can be unit tested.
 */
export function resolveVotingStatus(
  pool: Pick<Pool, "approvalMode" | "approvalThreshold" | "createdById">,
  totalEligibleMembers: number,
  votes: Pick<Vote, "voterId" | "decision">[]
): Resolution {
  const approvals = votes.filter((v) => v.decision === "APPROVE").length;
  const rejections = votes.filter((v) => v.decision === "REJECT").length;
  const abstentions = votes.filter((v) => v.decision === "ABSTAIN").length;

  if (pool.approvalMode === ("ADMIN_ONLY" as ApprovalMode)) {
    if (votes.some((v) => v.voterId === pool.createdById && v.decision === "APPROVE")) return "APPROVED";
    if (votes.some((v) => v.voterId === pool.createdById && v.decision === "REJECT")) return "REJECTED";
    return "PENDING";
  }

  const denominator = Math.max(1, totalEligibleMembers - abstentions);

  let threshold: number;
  if (pool.approvalMode === ("UNANIMOUS" as ApprovalMode)) threshold = 100;
  else if (pool.approvalMode === ("MAJORITY" as ApprovalMode)) threshold = 51;
  else threshold = pool.approvalThreshold;

  const approveRatio = (approvals / denominator) * 100;
  if (approveRatio >= threshold) return "APPROVED";

  // Can the remaining unvoted members still push it over the threshold?
  const remaining = totalEligibleMembers - approvals - rejections - abstentions;
  const maxPossibleApprovals = approvals + remaining;
  const maxRatio = (maxPossibleApprovals / denominator) * 100;
  if (maxRatio < threshold) return "REJECTED";

  return "PENDING";
}

export async function createSpendRequest(input: {
  poolId: string;
  requesterId: string;
  amount: string;
  title: string;
  description?: string;
  category: SpendRequest["category"];
  receiptUrl?: string;
  isEmergency?: boolean;
  expiresInHours: number;
}) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.pool.findUnique({ where: { id: input.poolId } });
    if (!pool) throw Errors.notFound("Pool");
    ensureActivePool(pool);

    const member = await tx.poolMember.findUnique({
      where: { poolId_userId: { poolId: pool.id, userId: input.requesterId } },
    });
    if (!member || !member.isActive) throw Errors.forbidden("Not a member");

    const amount = new Prisma.Decimal(input.amount);
    if (pool.spendLimit && amount.greaterThan(pool.spendLimit)) {
      throw Errors.conflict(`Amount exceeds pool spend limit of RM${pool.spendLimit.toFixed(2)}`);
    }
    if (pool.currentBalance.lessThan(amount)) {
      throw Errors.conflict("Pool balance insufficient");
    }

    if (input.isEmergency && pool.type !== "FAMILY") {
      throw Errors.conflict("Emergency override only available for FAMILY pools");
    }
    if (input.isEmergency && !pool.emergencyOverride) {
      throw Errors.conflict("Emergency override is disabled for this pool");
    }

    const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);

    const created = await tx.spendRequest.create({
      data: {
        poolId: pool.id,
        requesterId: input.requesterId,
        amount,
        title: input.title,
        description: input.description,
        category: input.category,
        receiptUrl: input.receiptUrl,
        isEmergency: input.isEmergency ?? false,
        status: input.isEmergency ? "APPROVED" : "PENDING",
        expiresAt,
        resolvedAt: input.isEmergency ? new Date() : null,
      },
    });

    const others = await tx.poolMember.findMany({
      where: { poolId: pool.id, isActive: true, NOT: { userId: input.requesterId } },
      select: { userId: true },
    });
    if (others.length > 0) {
      await tx.notification.createMany({
        data: others.map((m) => ({
          userId: m.userId,
          type: input.isEmergency ? "SPEND_REQUEST_APPROVED" : "SPEND_REQUEST_NEW",
          title: input.isEmergency ? "Emergency spend approved" : "Vote needed",
          body: `${input.title} — RM${amount.toFixed(2)}`,
          metadata: { poolId: pool.id, spendRequestId: created.id },
        })),
      });
    }

    return created;
  });
}

export async function castVote(input: {
  poolId: string;
  spendRequestId: string;
  voterId: string;
  decision: "APPROVE" | "REJECT" | "ABSTAIN";
  comment?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const sr = await tx.spendRequest.findUnique({ where: { id: input.spendRequestId } });
    if (!sr || sr.poolId !== input.poolId) throw Errors.notFound("Spend request");
    if (sr.status !== "PENDING") throw Errors.voteClosed();
    if (sr.expiresAt < new Date()) {
      await tx.spendRequest.update({
        where: { id: sr.id },
        data: { status: "EXPIRED", resolvedAt: new Date() },
      });
      throw Errors.voteClosed();
    }
    if (sr.requesterId === input.voterId) throw Errors.forbidden("Requester cannot vote on own request");

    const member = await tx.poolMember.findUnique({
      where: { poolId_userId: { poolId: sr.poolId, userId: input.voterId } },
    });
    if (!member || !member.isActive) throw Errors.forbidden("Not a member");
    if (member.role === "VIEWER") throw Errors.forbidden("Viewers cannot vote");

    const existing = await tx.vote.findUnique({
      where: { spendRequestId_voterId: { spendRequestId: sr.id, voterId: input.voterId } },
    });
    if (existing) throw Errors.alreadyVoted();

    const vote = await tx.vote.create({
      data: {
        spendRequestId: sr.id,
        voterId: input.voterId,
        decision: input.decision,
        comment: input.comment,
      },
    });

    const pool = await tx.pool.findUniqueOrThrow({ where: { id: sr.poolId } });
    const eligibleMembers = await tx.poolMember.count({
      where: {
        poolId: sr.poolId,
        isActive: true,
        role: { not: "VIEWER" },
        NOT: { userId: sr.requesterId },
      },
    });
    const allVotes = await tx.vote.findMany({
      where: { spendRequestId: sr.id },
      select: { voterId: true, decision: true },
    });

    const resolution = resolveVotingStatus(pool, eligibleMembers, allVotes);

    let updated = sr;
    if (resolution !== "PENDING") {
      updated = await tx.spendRequest.update({
        where: { id: sr.id },
        data: { status: resolution, resolvedAt: new Date() },
      });
      const noteType = resolution === "APPROVED" ? "SPEND_REQUEST_APPROVED" : "SPEND_REQUEST_REJECTED";
      await tx.notification.create({
        data: {
          userId: sr.requesterId,
          type: noteType,
          title: `Spend request ${resolution.toLowerCase()}`,
          body: `${sr.title} — RM${sr.amount.toFixed(2)}`,
          metadata: { poolId: sr.poolId, spendRequestId: sr.id },
        },
      });
    }

    return { vote, spendRequest: updated, resolution };
  });
}

export async function executeApprovedSpend(input: {
  poolId: string;
  spendRequestId: string;
  actorId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const sr = await tx.spendRequest.findUnique({ where: { id: input.spendRequestId } });
    if (!sr || sr.poolId !== input.poolId) throw Errors.notFound("Spend request");
    if (sr.status !== "APPROVED") throw Errors.conflict(`Cannot execute spend in ${sr.status} state`);
    if (sr.requesterId !== input.actorId) {
      const actor = await tx.poolMember.findUnique({
        where: { poolId_userId: { poolId: sr.poolId, userId: input.actorId } },
      });
      if (!actor || (actor.role !== "OWNER" && actor.role !== "ADMIN")) {
        throw Errors.forbidden("Only requester or pool admin can execute");
      }
    }

    const pool = await tx.pool.findUniqueOrThrow({ where: { id: sr.poolId } });
    if (pool.isFrozen) throw Errors.poolFrozen();
    if (pool.currentBalance.lessThan(sr.amount)) throw Errors.conflict("Pool balance insufficient at execution time");

    const requester = await tx.user.findUniqueOrThrow({ where: { id: sr.requesterId } });

    const poolBefore = pool.currentBalance;
    const poolAfter = poolBefore.minus(sr.amount);
    const userBefore = requester.mainBalance;
    const userAfter = userBefore.plus(sr.amount);

    await tx.pool.update({ where: { id: pool.id }, data: { currentBalance: poolAfter } });
    await tx.user.update({ where: { id: requester.id }, data: { mainBalance: userAfter } });

    await tx.transaction.create({
      data: {
        poolId: pool.id,
        userId: requester.id,
        type: "SPEND",
        direction: "OUT",
        amount: sr.amount,
        balanceBefore: poolBefore,
        balanceAfter: poolAfter,
        description: `Spend: ${sr.title}`,
        spendRequestId: sr.id,
      },
    });
    await tx.transaction.create({
      data: {
        userId: requester.id,
        type: "SPEND",
        direction: "IN",
        amount: sr.amount,
        balanceBefore: userBefore,
        balanceAfter: userAfter,
        description: `Pool payout: ${sr.title}`,
        spendRequestId: sr.id,
        metadata: { poolId: pool.id },
      },
    });

    const updated = await tx.spendRequest.update({
      where: { id: sr.id },
      data: { status: "EXECUTED" },
    });

    return { spendRequest: updated, poolBalance: poolAfter, userBalance: userAfter };
  });
}

export async function cancelSpendRequest(input: { poolId: string; spendRequestId: string; actorId: string }) {
  const sr = await prisma.spendRequest.findUnique({ where: { id: input.spendRequestId } });
  if (!sr || sr.poolId !== input.poolId) throw Errors.notFound("Spend request");
  if (sr.requesterId !== input.actorId) throw Errors.forbidden("Only requester can cancel");
  if (sr.status !== "PENDING") throw Errors.conflict(`Cannot cancel spend in ${sr.status} state`);
  return prisma.spendRequest.update({
    where: { id: sr.id },
    data: { status: "CANCELLED", resolvedAt: new Date() },
  });
}

/** Sweep job — should be called periodically to expire stale pending requests. */
export async function expireStaleRequests() {
  const now = new Date();
  const stale = await prisma.spendRequest.findMany({
    where: { status: "PENDING", expiresAt: { lt: now } },
    select: { id: true, requesterId: true, poolId: true, title: true },
  });
  if (stale.length === 0) return 0;
  await prisma.$transaction([
    prisma.spendRequest.updateMany({
      where: { id: { in: stale.map((s) => s.id) } },
      data: { status: "EXPIRED", resolvedAt: now },
    }),
    prisma.notification.createMany({
      data: stale.map((s) => ({
        userId: s.requesterId,
        type: "SPEND_REQUEST_EXPIRED" as const,
        title: "Spend request expired",
        body: s.title,
        metadata: { poolId: s.poolId, spendRequestId: s.id },
      })),
    }),
  ]);
  return stale.length;
}
