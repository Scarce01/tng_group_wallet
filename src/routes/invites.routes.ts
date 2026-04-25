import { Router } from "express";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import { Errors } from "../utils/errors.js";
import { createInviteSchema } from "../schemas/member.schema.js";
import { assertPoolAdmin } from "../services/pool.service.js";
import { publishToPool } from "../websocket/publisher.js";

// Routes nested under /pools/:poolId/invites
export const poolInviteRouter = Router({ mergeParams: true });
poolInviteRouter.use(requireAuth);

poolInviteRouter.post(
  "/",
  validateBody(createInviteSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolAdmin(poolId, req.userId!);
    const code = nanoid(10).toUpperCase();
    const expiresAt = new Date(Date.now() + req.body.expiresInHours * 60 * 60 * 1000);

    let receiverId: string | null = null;
    if (req.body.phone) {
      const user = await prisma.user.findUnique({ where: { phone: req.body.phone } });
      receiverId = user?.id ?? null;
    }

    const invite = await prisma.poolInvite.create({
      data: {
        poolId,
        senderId: req.userId!,
        receiverId,
        invitePhone: req.body.phone,
        inviteCode: code,
        expiresAt,
      },
    });
    if (receiverId) {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: "POOL_INVITE",
          title: "You have a pool invite",
          body: `Use code ${code} to join.`,
          metadata: { poolId, inviteCode: code },
        },
      });
    }
    res.status(201).json({ ...invite, shareUrl: `tng://invites/${code}` });
  })
);

poolInviteRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolAdmin(poolId, req.userId!);
    const invites = await prisma.poolInvite.findMany({
      where: { poolId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    res.json({ items: invites });
  })
);

// Top-level /invites/:code/accept|decline
export const inviteActionRouter = Router();
inviteActionRouter.use(requireAuth);

inviteActionRouter.post(
  "/:code/accept",
  asyncHandler(async (req, res) => {
    const code = req.params.code!.toUpperCase();
    const invite = await prisma.poolInvite.findUnique({ where: { inviteCode: code } });
    if (!invite) throw Errors.inviteInvalid();
    if (invite.status !== "PENDING") throw Errors.conflict(`Invite already ${invite.status.toLowerCase()}`);
    if (invite.expiresAt < new Date()) {
      await prisma.poolInvite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
      throw Errors.inviteExpired();
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.poolMember.findUnique({
        where: { poolId_userId: { poolId: invite.poolId, userId: req.userId! } },
      });
      const member = existing
        ? await tx.poolMember.update({
            where: { id: existing.id },
            data: { isActive: true, leftAt: null },
          })
        : await tx.poolMember.create({
            data: { poolId: invite.poolId, userId: req.userId!, role: "MEMBER" },
          });
      await tx.poolInvite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", receiverId: req.userId! },
      });
      return member;
    });
    publishToPool(invite.poolId, "member_joined", { userId: req.userId });
    res.json(result);
  })
);

inviteActionRouter.post(
  "/:code/decline",
  asyncHandler(async (req, res) => {
    const code = req.params.code!.toUpperCase();
    const invite = await prisma.poolInvite.findUnique({ where: { inviteCode: code } });
    if (!invite) throw Errors.inviteInvalid();
    if (invite.status !== "PENDING") throw Errors.conflict(`Invite already ${invite.status.toLowerCase()}`);
    const updated = await prisma.poolInvite.update({
      where: { id: invite.id },
      data: { status: "DECLINED", receiverId: req.userId! },
    });
    res.json(updated);
  })
);
