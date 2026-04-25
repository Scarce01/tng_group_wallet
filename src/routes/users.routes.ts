import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import { Errors } from "../utils/errors.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { publicUserSelect } from "../services/auth.service.js";

const router = Router();
router.use(requireAuth);

const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  displayName: z.string().trim().min(1).max(60).optional(),
  email: z.string().email().max(200).optional(),
  avatarUrl: z.string().url().optional(),
  preferredLang: z.enum(["EN", "MS", "ZH"]).optional(),
});

const topupSchema = z.object({
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === "number" ? v.toFixed(2) : v))
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, "Invalid amount"),
});

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: publicUserSelect,
    });
    if (!user) throw Errors.notFound("User");
    res.json(user);
  })
);

router.patch(
  "/me",
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: req.body,
      select: publicUserSelect,
    });
    res.json(user);
  })
);

router.get(
  "/me/balance",
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { mainBalance: true },
    });
    if (!user) throw Errors.notFound("User");
    res.json({ balance: user.mainBalance, currency: "MYR" });
  })
);

// Demo helper: top up the main wallet so contributions work in dev/demo.
// In production this would be done by the TNG eWallet integration, not exposed.
router.post(
  "/me/topup",
  validateBody(topupSchema),
  asyncHandler(async (req, res) => {
    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.userId! } });
      if (!user) throw Errors.notFound("User");
      const before = user.mainBalance;
      const after = (Number(before) + Number(req.body.amount)).toFixed(2);
      const next = await tx.user.update({
        where: { id: user.id },
        data: { mainBalance: after },
        select: { mainBalance: true },
      });
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "TOPUP",
          direction: "IN",
          amount: req.body.amount,
          balanceBefore: before,
          balanceAfter: after,
          description: "Wallet top-up (demo)",
        },
      });
      return next;
    });
    res.json({ balance: updated.mainBalance, currency: "MYR" });
  })
);

router.get(
  "/me/notifications",
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { cursor, limit } = (req as unknown as { validatedQuery: { cursor?: string; limit: number } }).validatedQuery;
    const items = await prisma.notification.findMany({
      where: { userId: req.userId! },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });
    const nextCursor = items.length > limit ? items.pop()!.id : null;
    res.json({ items, nextCursor });
  })
);

router.patch(
  "/me/notifications/:id",
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { id: req.params.id!, userId: req.userId! },
      data: { isRead: true },
    });
    if (result.count === 0) throw Errors.notFound("Notification");
    res.status(204).end();
  })
);

router.get(
  "/me/transactions",
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { cursor, limit } = (req as unknown as { validatedQuery: { cursor?: string; limit: number } }).validatedQuery;
    const items = await prisma.transaction.findMany({
      where: { userId: req.userId! },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
    });
    const nextCursor = items.length > limit ? items.pop()!.id : null;
    res.json({ items, nextCursor });
  })
);

export default router;
