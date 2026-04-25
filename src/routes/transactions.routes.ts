import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { assertPoolMember } from "../services/pool.service.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get(
  "/transactions",
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const { cursor, limit } = (req as unknown as { validatedQuery: { cursor?: string; limit: number } }).validatedQuery;
    const items = await prisma.transaction.findMany({
      where: { poolId },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });
    const nextCursor = items.length > limit ? items.pop()!.id : null;
    res.json({ items, nextCursor });
  })
);

router.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);

    const [pool, contribTotal, spendTotal, contribByUser, spendByCategory, spendByUser] = await Promise.all([
      prisma.pool.findUnique({
        where: { id: poolId },
        select: { name: true, currentBalance: true, targetAmount: true, type: true },
      }),
      prisma.contribution.aggregate({
        where: { poolId, status: "COMPLETED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.spendRequest.aggregate({
        where: { poolId, status: "EXECUTED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.contribution.groupBy({
        by: ["userId"],
        where: { poolId, status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.spendRequest.groupBy({
        by: ["category"],
        where: { poolId, status: "EXECUTED" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.spendRequest.groupBy({
        by: ["requesterId"],
        where: { poolId, status: "EXECUTED" },
        _sum: { amount: true },
      }),
    ]);

    const userIds = Array.from(
      new Set([...contribByUser.map((c) => c.userId), ...spendByUser.map((s) => s.requesterId)])
    );
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const contribByUserMap = new Map(contribByUser.map((c) => [c.userId, c._sum.amount]));
    const spendByUserMap = new Map(spendByUser.map((s) => [s.requesterId, s._sum.amount]));

    const perMember = userIds.map((id) => {
      const contrib = Number(contribByUserMap.get(id) ?? 0);
      const spent = Number(spendByUserMap.get(id) ?? 0);
      return {
        user: userMap.get(id),
        contributed: contrib.toFixed(2),
        spent: spent.toFixed(2),
        net: (contrib - spent).toFixed(2),
      };
    });

    res.json({
      pool,
      totals: {
        contributedTotal: contribTotal._sum.amount ?? "0.00",
        contributionCount: contribTotal._count._all,
        spentTotal: spendTotal._sum.amount ?? "0.00",
        spendCount: spendTotal._count._all,
      },
      perMember,
      spendByCategory: spendByCategory.map((s) => ({
        category: s.category,
        total: s._sum.amount ?? "0.00",
        count: s._count._all,
      })),
      flow: {
        contributors: contribByUser.map((c) => ({
          user: userMap.get(c.userId),
          amount: c._sum.amount ?? "0.00",
        })),
        categories: spendByCategory.map((s) => ({
          category: s.category,
          amount: s._sum.amount ?? "0.00",
        })),
      },
    });
  })
);

export default router;
