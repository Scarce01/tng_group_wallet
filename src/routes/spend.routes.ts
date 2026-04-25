import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import {
  createSpendRequestSchema,
  listSpendQuery,
  voteSchema,
} from "../schemas/spend.schema.js";
import { assertPoolMember } from "../services/pool.service.js";
import {
  cancelSpendRequest,
  castVote,
  createSpendRequest,
  executeApprovedSpend,
} from "../services/spend.service.js";
import { publishToPool, publishToUser } from "../websocket/publisher.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.post(
  "/",
  validateBody(createSpendRequestSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const sr = await createSpendRequest({
      poolId,
      requesterId: req.userId!,
      ...req.body,
    });
    publishToPool(poolId, "spend_request_created", { spendRequest: sr });
    res.status(201).json(sr);
  })
);

router.get(
  "/",
  validateQuery(listSpendQuery),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const q = (req as unknown as { validatedQuery: { status?: string; cursor?: string; limit: number } }).validatedQuery;
    const items = await prisma.spendRequest.findMany({
      where: { poolId, ...(q.status ? { status: q.status as never } : {}) },
      include: {
        requester: { select: { id: true, displayName: true, avatarUrl: true } },
        votes: { select: { decision: true, voterId: true } },
      },
      take: q.limit + 1,
      ...(q.cursor ? { cursor: { id: q.cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });
    const nextCursor = items.length > q.limit ? items.pop()!.id : null;
    res.json({ items, nextCursor });
  })
);

router.get(
  "/:sid",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const sr = await prisma.spendRequest.findFirst({
      where: { id: req.params.sid!, poolId },
      include: {
        requester: { select: { id: true, displayName: true, avatarUrl: true } },
        votes: {
          include: { voter: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
      },
    });
    if (!sr) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Spend request not found" } });
    res.json(sr);
  })
);

router.post(
  "/:sid/vote",
  validateBody(voteSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const result = await castVote({
      poolId,
      spendRequestId: req.params.sid!,
      voterId: req.userId!,
      decision: req.body.decision,
      comment: req.body.comment,
    });
    publishToPool(poolId, "vote_cast", {
      spendRequestId: result.spendRequest.id,
      voterId: req.userId,
      decision: req.body.decision,
      resolution: result.resolution,
      status: result.spendRequest.status,
    });
    if (result.resolution !== "PENDING") {
      publishToUser(result.spendRequest.requesterId, "spend_request_resolved", {
        spendRequestId: result.spendRequest.id,
        status: result.spendRequest.status,
      });
    }
    res.json(result);
  })
);

router.post(
  "/:sid/cancel",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const updated = await cancelSpendRequest({
      poolId,
      spendRequestId: req.params.sid!,
      actorId: req.userId!,
    });
    publishToPool(poolId, "spend_request_cancelled", { spendRequestId: updated.id });
    res.json(updated);
  })
);

router.post(
  "/:sid/execute",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const result = await executeApprovedSpend({
      poolId,
      spendRequestId: req.params.sid!,
      actorId: req.userId!,
    });
    publishToPool(poolId, "balance_updated", {
      poolBalance: result.poolBalance.toFixed(2),
      reason: "spend_executed",
      spendRequestId: result.spendRequest.id,
    });
    res.json(result);
  })
);

export default router;
