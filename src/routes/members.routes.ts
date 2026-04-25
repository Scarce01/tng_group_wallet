import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import { Errors } from "../utils/errors.js";
import { addMemberSchema, updateMemberSchema } from "../schemas/member.schema.js";
import { assertPoolAdmin, assertPoolMember } from "../services/pool.service.js";
import { publishToPool } from "../websocket/publisher.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);

    const members = await prisma.poolMember.findMany({
      where: { poolId, isActive: true },
      include: { user: { select: { id: true, displayName: true, avatarUrl: true, phone: true } } },
      orderBy: { joinedAt: "asc" },
    });

    const totals = await prisma.contribution.groupBy({
      by: ["userId"],
      where: { poolId, status: "COMPLETED" },
      _sum: { amount: true },
    });
    const totalsByUser = new Map(totals.map((t) => [t.userId, t._sum.amount]));

    res.json({
      items: members.map((m) => ({
        ...m,
        contributedTotal: totalsByUser.get(m.userId) ?? "0.00",
      })),
    });
  })
);

router.post(
  "/",
  validateBody(addMemberSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolAdmin(poolId, req.userId!);
    const target = await prisma.user.findUnique({ where: { phone: req.body.phone } });
    if (!target) throw Errors.notFound("User with this phone");

    const existing = await prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId: target.id } },
    });
    if (existing && existing.isActive) throw Errors.conflict("User is already a member");

    const member = existing
      ? await prisma.poolMember.update({
          where: { id: existing.id },
          data: { isActive: true, leftAt: null, role: req.body.role, contributionWeight: req.body.contributionWeight },
        })
      : await prisma.poolMember.create({
          data: {
            poolId,
            userId: target.id,
            role: req.body.role,
            contributionWeight: req.body.contributionWeight,
          },
        });

    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "MEMBER_JOINED",
        title: "Added to a pool",
        body: `You were added to a pool.`,
        metadata: { poolId },
      },
    });
    publishToPool(poolId, "member_added", { member });
    res.status(201).json(member);
  })
);

router.patch(
  "/:userId",
  validateBody(updateMemberSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolAdmin(poolId, req.userId!);
    const updated = await prisma.poolMember.update({
      where: { poolId_userId: { poolId, userId: req.params.userId! } },
      data: req.body,
    });
    publishToPool(poolId, "member_updated", { member: updated });
    res.json(updated);
  })
);

router.post(
  "/:userId/leave",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    if (req.params.userId !== req.userId) throw Errors.forbidden("Cannot leave on behalf of another user");
    const member = await prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId: req.userId! } },
    });
    if (!member || !member.isActive) throw Errors.notFound("Membership");
    if (member.role === "OWNER") throw Errors.conflict("Owner cannot leave the pool; transfer ownership first");
    const updated = await prisma.poolMember.update({
      where: { id: member.id },
      data: { isActive: false, leftAt: new Date() },
    });
    publishToPool(poolId, "member_left", { userId: req.userId });
    res.json(updated);
  })
);

router.delete(
  "/:userId",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolAdmin(poolId, req.userId!);
    const target = await prisma.poolMember.findUnique({
      where: { poolId_userId: { poolId, userId: req.params.userId! } },
    });
    if (!target) throw Errors.notFound("Membership");
    if (target.role === "OWNER") throw Errors.conflict("Cannot remove the owner");
    await prisma.poolMember.update({
      where: { id: target.id },
      data: { isActive: false, leftAt: new Date() },
    });
    publishToPool(poolId, "member_removed", { userId: req.params.userId });
    res.status(204).end();
  })
);

export default router;
