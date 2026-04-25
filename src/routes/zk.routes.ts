import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async.js";
import { Errors } from "../utils/errors.js";
import { proveSchema, verifySchema } from "../schemas/zk.schema.js";
import { assertPoolMember } from "../services/pool.service.js";
import {
  generateProof,
  getMinContributionCents,
  recordVerification,
  verifyProof,
} from "../services/zk.service.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get(
  "/params",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const minContributionCents = await getMinContributionCents(poolId);
    res.json({
      poolId,
      minContributionCents,
      minContributionRM: (minContributionCents / 100).toFixed(2),
      backend: "stub",
    });
  })
);

router.post(
  "/prove",
  validateBody(proveSchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    try {
      const result = await generateProof({
        poolId,
        totalIncomeCents: req.body.totalIncomeCents,
      });
      res.json(result);
    } catch (e) {
      if (e instanceof Error && (e as Error & { code?: string }).code === "INCOME_BELOW_THRESHOLD") {
        res.status(400).json({
          error: {
            code: "INCOME_BELOW_THRESHOLD",
            message: "Your income does not meet the minimum contribution threshold.",
          },
        });
        return;
      }
      throw e;
    }
  })
);

router.post(
  "/verify",
  validateBody(verifySchema),
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const ok = verifyProof(req.body.proof, req.body.publicSignals);
    if (!ok) throw Errors.conflict("Proof verification failed");
    await recordVerification({
      poolId,
      userId: req.userId!,
      proof: req.body.proof,
      commitmentHash: req.body.commitmentHash,
    });
    res.json({ verified: true });
  })
);

router.get(
  "/status",
  asyncHandler(async (req, res) => {
    const poolId = req.params.poolId!;
    await assertPoolMember(poolId, req.userId!);
    const members = await prisma.poolMember.findMany({
      where: { poolId, isActive: true },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: "asc" },
    });
    res.json({
      poolId,
      members: members.map((m) => ({
        userId: m.user.id,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        zkVerified: m.zkVerified,
        zkVerifiedAt: m.zkVerifiedAt,
        // Intentionally NOT returned: zkCommitmentHash, zkProof, any income data
      })),
    });
  })
);

export default router;
