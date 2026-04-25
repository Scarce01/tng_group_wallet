import { prisma } from "../lib/prisma.js";
import { Errors } from "../utils/errors.js";
import type { Pool, PoolMember } from "@prisma/client";

export async function assertPoolMember(
  poolId: string,
  userId: string
): Promise<{ pool: Pool; member: PoolMember }> {
  const pool = await prisma.pool.findUnique({ where: { id: poolId } });
  if (!pool) throw Errors.notFound("Pool");
  const member = await prisma.poolMember.findUnique({
    where: { poolId_userId: { poolId, userId } },
  });
  if (!member || !member.isActive) throw Errors.forbidden("Not a member of this pool");
  return { pool, member };
}

export async function assertPoolAdmin(poolId: string, userId: string) {
  const { pool, member } = await assertPoolMember(poolId, userId);
  if (member.role !== "OWNER" && member.role !== "ADMIN") {
    throw Errors.forbidden("Owner or admin role required");
  }
  return { pool, member };
}

export function ensureActivePool(pool: Pool) {
  if (pool.isFrozen) throw Errors.poolFrozen();
  if (pool.status !== "ACTIVE" && pool.status !== "DRAFT") throw Errors.poolNotActive();
}
