import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import { Errors } from "../utils/errors.js";
import {
  createPoolSchema,
  listPoolsQuery,
  updatePoolSchema,
} from "../schemas/pool.schema.js";
import { assertPoolAdmin, assertPoolMember } from "../services/pool.service.js";

const router = Router();
router.use(requireAuth);

router.post(
  "/",
  validateBody(createPoolSchema),
  asyncHandler(async (req, res) => {
    const userId = req.userId!;
    const data = req.body;
    const pool = await prisma.pool.create({
      data: {
        type: data.type,
        name: data.name,
        description: data.description,
        coverImageUrl: data.coverImageUrl,
        targetAmount: data.targetAmount,
        spendLimit: data.spendLimit,
        approvalMode: data.approvalMode,
        approvalThreshold: data.approvalThreshold,
        emergencyOverride: data.type === "FAMILY" ? data.emergencyOverride : false,
        startDate: data.startDate ?? new Date(),
        endDate: data.endDate,
        createdById: userId,
        members: { create: [{ userId, role: "OWNER" }] },
      },
      include: { members: true },
    });
    res.status(201).json(pool);
  })
);

router.get(
  "/",
  validateQuery(listPoolsQuery),
  asyncHandler(async (req, res) => {
    const q = (req as unknown as { validatedQuery: { type?: "TRIP" | "FAMILY"; status?: string } }).validatedQuery;
    const pools = await prisma.pool.findMany({
      where: {
        members: { some: { userId: req.userId!, isActive: true } },
        ...(q.type ? { type: q.type } : {}),
        ...(q.status ? { status: q.status as never } : {}),
        isArchived: false,
      },
      include: {
        members: {
          where: { isActive: true },
          include: { user: { select: { id: true, displayName: true, avatarUrl: true } } },
        },
        _count: { select: { spendRequests: { where: { status: "PENDING" } } } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ items: pools });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { pool } = await assertPoolMember(req.params.id!, req.userId!);
    const detail = await prisma.pool.findUnique({
      where: { id: pool.id },
      include: {
        members: {
          where: { isActive: true },
          include: { user: { select: { id: true, displayName: true, avatarUrl: true, phone: true } } },
        },
        _count: { select: { spendRequests: { where: { status: "PENDING" } }, contributions: true } },
      },
    });
    res.json(detail);
  })
);

router.patch(
  "/:id",
  validateBody(updatePoolSchema),
  asyncHandler(async (req, res) => {
    await assertPoolAdmin(req.params.id!, req.userId!);
    const updated = await prisma.pool.update({
      where: { id: req.params.id! },
      data: req.body,
    });
    res.json(updated);
  })
);

router.post(
  "/:id/archive",
  asyncHandler(async (req, res) => {
    await assertPoolAdmin(req.params.id!, req.userId!);
    const updated = await prisma.pool.update({
      where: { id: req.params.id! },
      data: { isArchived: true, status: "ARCHIVED" },
    });
    res.json(updated);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await assertPoolAdmin(req.params.id!, req.userId!);
    const pool = await prisma.pool.findUnique({ where: { id: req.params.id! } });
    if (!pool) throw Errors.notFound("Pool");
    if (pool.status !== "DRAFT") throw Errors.conflict("Only DRAFT pools can be deleted");
    await prisma.pool.delete({ where: { id: pool.id } });
    res.status(204).end();
  })
);

export default router;
