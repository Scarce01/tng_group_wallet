import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { Errors } from "../utils/errors.js";

/**
 * Slice (b): no real circom/snarkjs yet. The functions here speak the same
 * shape the full ZK module will produce, so the UI + DB don't need to change
 * when we swap in the real prover/verifier in slice (c).
 *
 * Thresholds and proof shape match the patch's
 * `contribution_eligibility.circom` interface so the API contract is stable.
 */

const STUB_DEFAULT_MIN_RM = 500;

export interface MockProof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: "groth16-stub";
  curve: "bn128";
}

export async function getMinContributionCents(poolId: string): Promise<number> {
  const pool = await prisma.pool.findUnique({
    where: { id: poolId },
    select: { type: true, targetAmount: true },
  });
  if (!pool) throw Errors.notFound("Pool");
  if (pool.type !== "FAMILY") {
    throw Errors.conflict("ZK eligibility only applies to FAMILY pools");
  }

  const memberCount = await prisma.poolMember.count({
    where: { poolId, isActive: true },
  });
  if (pool.targetAmount && memberCount > 0) {
    return Math.floor((Number(pool.targetAmount) / memberCount) * 100);
  }
  return STUB_DEFAULT_MIN_RM * 100;
}

/**
 * Stub prover. The real version would run snarkjs.groth16.fullProve.
 * For now: validate the threshold and emit a placeholder proof object.
 */
export async function generateProof(input: {
  poolId: string;
  totalIncomeCents: number;
}): Promise<{ proof: MockProof; publicSignals: string[]; commitmentHash: string }> {
  const minContributionCents = await getMinContributionCents(input.poolId);
  if (input.totalIncomeCents < minContributionCents) {
    throw new (class extends Error {
      readonly code = "INCOME_BELOW_THRESHOLD" as const;
    })("Income does not meet the minimum contribution threshold");
  }

  // commitmentHash = stand-in for Poseidon(totalIncome, salt)
  const salt = crypto.randomBytes(32).toString("hex");
  const commitmentHash =
    "0x" +
    crypto
      .createHash("sha256")
      .update(`${input.totalIncomeCents}:${salt}`)
      .digest("hex");

  const proof: MockProof = {
    pi_a: [randomFE(), randomFE(), "1"],
    pi_b: [
      [randomFE(), randomFE()],
      [randomFE(), randomFE()],
      ["1", "0"],
    ],
    pi_c: [randomFE(), randomFE(), "1"],
    protocol: "groth16-stub",
    curve: "bn128",
  };
  const publicSignals = [String(minContributionCents), commitmentHash];
  return { proof, publicSignals, commitmentHash };
}

/**
 * Stub verifier. Real version: snarkjs.groth16.verify(vkey, signals, proof).
 * Accepts any well-formed stub proof.
 */
export function verifyProof(
  proof: unknown,
  publicSignals: unknown
): boolean {
  if (typeof proof !== "object" || proof === null) return false;
  const p = proof as Partial<MockProof>;
  if (!Array.isArray(p.pi_a) || p.pi_a.length !== 3) return false;
  if (!Array.isArray(p.pi_b) || p.pi_b.length !== 3) return false;
  if (!Array.isArray(p.pi_c) || p.pi_c.length !== 3) return false;
  if (!Array.isArray(publicSignals) || publicSignals.length < 2) return false;
  return true;
}

export async function recordVerification(input: {
  poolId: string;
  userId: string;
  proof: unknown;
  commitmentHash: string;
}) {
  const member = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId: input.poolId, userId: input.userId } },
  });
  if (!member || !member.isActive) throw Errors.forbidden("Not a member of this pool");
  return prisma.poolMember.update({
    where: { id: member.id },
    data: {
      zkCommitmentHash: input.commitmentHash,
      zkProof: input.proof as Prisma.InputJsonValue,
      zkVerified: true,
      zkVerifiedAt: new Date(),
    },
  });
}

function randomFE(): string {
  // Random ~254-bit field element (decimal string), placeholder only.
  return BigInt("0x" + crypto.randomBytes(31).toString("hex")).toString();
}
