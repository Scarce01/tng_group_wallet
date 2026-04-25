import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { Errors } from "../utils/errors.js";
import { ensureActivePool } from "./pool.service.js";

/**
 * Atomically:
 *  1. Deducts amount from user's main wallet
 *  2. Adds amount to pool's currentBalance
 *  3. Records a Contribution row
 *  4. Records a Transaction (OUT for user)
 *  5. Records a Transaction (IN for pool, attributed to user)
 *  6. Notifies pool members
 *
 * All in a single Prisma transaction so balances cannot drift.
 */
export async function makeContribution(input: {
  poolId: string;
  userId: string;
  amount: string;
  description?: string;
  receiptUrl?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const pool = await tx.pool.findUnique({ where: { id: input.poolId } });
    if (!pool) throw Errors.notFound("Pool");
    ensureActivePool(pool);

    const member = await tx.poolMember.findUnique({
      where: { poolId_userId: { poolId: input.poolId, userId: input.userId } },
    });
    if (!member || !member.isActive) throw Errors.forbidden("Not a member of this pool");

    const user = await tx.user.findUnique({ where: { id: input.userId } });
    if (!user) throw Errors.notFound("User");

    const amount = new Prisma.Decimal(input.amount);
    if (user.mainBalance.lessThan(amount)) throw Errors.insufficientBalance();

    const userBefore = user.mainBalance;
    const userAfter = userBefore.minus(amount);
    const poolBefore = pool.currentBalance;
    const poolAfter = poolBefore.plus(amount);

    await tx.user.update({ where: { id: user.id }, data: { mainBalance: userAfter } });
    await tx.pool.update({ where: { id: pool.id }, data: { currentBalance: poolAfter } });

    const contribution = await tx.contribution.create({
      data: {
        poolId: pool.id,
        userId: user.id,
        amount,
        description: input.description,
        receiptUrl: input.receiptUrl,
        status: "COMPLETED",
      },
    });

    await tx.transaction.create({
      data: {
        userId: user.id,
        type: "CONTRIBUTION",
        direction: "OUT",
        amount,
        balanceBefore: userBefore,
        balanceAfter: userAfter,
        description: `Contribution to ${pool.name}`,
        contributionId: contribution.id,
        metadata: { poolId: pool.id },
      },
    });

    await tx.transaction.create({
      data: {
        poolId: pool.id,
        userId: user.id,
        type: "CONTRIBUTION",
        direction: "IN",
        amount,
        balanceBefore: poolBefore,
        balanceAfter: poolAfter,
        description: `Contribution from ${user.displayName}`,
        contributionId: contribution.id,
      },
    });

    const otherMembers = await tx.poolMember.findMany({
      where: { poolId: pool.id, isActive: true, NOT: { userId: user.id } },
      select: { userId: true },
    });
    if (otherMembers.length > 0) {
      await tx.notification.createMany({
        data: otherMembers.map((m) => ({
          userId: m.userId,
          type: "CONTRIBUTION_RECEIVED" as const,
          title: "Contribution received",
          body: `${user.displayName} contributed RM${amount.toFixed(2)} to ${pool.name}.`,
          metadata: { poolId: pool.id, contributionId: contribution.id, amount: amount.toFixed(2) },
        })),
      });
    }

    return { contribution, poolBalance: poolAfter, userBalance: userAfter };
  });
}
