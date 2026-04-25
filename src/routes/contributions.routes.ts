import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import {
  createContributionSchema,
  listContributionsQuery,
} from "../schemas/contribution.schema.js";
import { assertPoolMember } from "../services/pool.service.js";
import { makeContribution } from "../services/contribution.service.js";
import { publishToPool } from "../websocket/publisher.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.post(
  "/",
  validateBody(createContributionSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const result = await makeContribution({
      poolId,
      userId: req.userId!,
      amount: req.body.amount,
      description: req.body.description,
      receiptUrl: req.body.receiptUrl,
    });
    publishToPool(poolId, "balance_updated", {
      poolBalance: result.poolBalance.toFixed(2),
      reason: "contribution",
      contributionId: result.contribution.id,
      userId: req.userId,
    });
    res.status(201).json(result);
  })
);

router.get(
  "/",
  validateQuery(listContributionsQuery),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const q = (req as unknown as { validatedQuery: { userId?: string; cursor?: string; limit: number } }).validatedQuery;
    const items = await prisma.contribution.findMany({
      where: { poolId, ...(q.userId ? { userId: q.userId } : {}) },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });
    const nextCursor = items.length > q.limit ? items.pop()!.id : null;
    res.json({ items, nextCursor });
  })
);

router.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const totals = await prisma.contribution.groupBy({
      by: ["userId"],
      where: { poolId, status: "COMPLETED" },
      _sum: { amount: true },
      _count: { _all: true },
    });
    const users = await prisma.user.findMany({
      where: { id: { in: totals.map((t) => t.userId) } },
      select: { id: true, displayName: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));
    res.json({
      items: totals.map((t) => ({
        user: userMap.get(t.userId),
        total: t._sum.amount ?? "0.00",
        count: t._count._all,
      })),
    });
  })
);

export default router;
