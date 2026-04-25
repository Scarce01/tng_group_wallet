import "dotenv/config";
import { PrismaClient, PoolType, MemberRole, SpendCategory, SpendStatus, VoteDecision, TransactionType, TransactionDirection } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TNG Pool Engine demo data...");

  await prisma.$transaction([
    prisma.vote.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.spendRequest.deleteMany(),
    prisma.contribution.deleteMany(),
    prisma.poolInvite.deleteMany(),
    prisma.poolMember.deleteMany(),
    prisma.pool.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const pinHash = await bcrypt.hash("123456", 10);

  const ahmad = await prisma.user.create({
    data: {
      phone: "+60112345001",
      email: "ahmad@example.com",
      fullName: "Ahmad bin Ibrahim",
      displayName: "Ahmad",
      pinHash,
      mainBalance: "5000.00",
      kycStatus: "VERIFIED",
    },
  });

  const siti = await prisma.user.create({
    data: {
      phone: "+60112345002",
      email: "siti@example.com",
      fullName: "Siti Nurhaliza Wong",
      displayName: "Siti",
      pinHash,
      mainBalance: "3200.00",
      kycStatus: "VERIFIED",
    },
  });

  const raj = await prisma.user.create({
    data: {
      phone: "+60112345003",
      email: "raj@example.com",
      fullName: "Raj Kumar",
      displayName: "Raj",
      pinHash,
      mainBalance: "1800.00",
      kycStatus: "VERIFIED",
    },
  });

  const mei = await prisma.user.create({
    data: {
      phone: "+60112345004",
      email: "mei@example.com",
      fullName: "Mei Lin Tan",
      displayName: "Mei",
      pinHash,
      mainBalance: "2400.00",
      kycStatus: "VERIFIED",
    },
  });

  // Trip pool
  const langkawi = await prisma.pool.create({
    data: {
      type: PoolType.TRIP,
      name: "Langkawi Trip 2026",
      description: "5D4N island getaway",
      targetAmount: "5000.00",
      currentBalance: "4200.00",
      createdById: ahmad.id,
      members: {
        create: [
          { userId: ahmad.id, role: MemberRole.OWNER },
          { userId: siti.id, role: MemberRole.MEMBER },
          { userId: raj.id, role: MemberRole.MEMBER },
          { userId: mei.id, role: MemberRole.MEMBER },
        ],
      },
    },
  });

  const contribs = [
    { userId: ahmad.id, amount: "1100.00" },
    { userId: siti.id, amount: "1100.00" },
    { userId: raj.id, amount: "1000.00" },
    { userId: mei.id, amount: "1000.00" },
  ];
  for (const c of contribs) {
    const contribution = await prisma.contribution.create({
      data: {
        poolId: langkawi.id,
        userId: c.userId,
        amount: c.amount,
      },
    });
    await prisma.transaction.create({
      data: {
        poolId: langkawi.id,
        userId: c.userId,
        type: TransactionType.CONTRIBUTION,
        direction: TransactionDirection.IN,
        amount: c.amount,
        balanceBefore: "0.00",
        balanceAfter: c.amount,
        description: `Contribution to ${langkawi.name}`,
        contributionId: contribution.id,
      },
    });
  }

  // Pending spend request with partial votes
  const spend = await prisma.spendRequest.create({
    data: {
      poolId: langkawi.id,
      requesterId: ahmad.id,
      amount: "800.00",
      title: "Hotel deposit",
      description: "Bayview Hotel — 2 rooms, 4 nights",
      category: SpendCategory.ACCOMMODATION,
      status: SpendStatus.PENDING,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });
  await prisma.vote.create({
    data: { spendRequestId: spend.id, voterId: siti.id, decision: VoteDecision.APPROVE },
  });
  await prisma.vote.create({
    data: { spendRequestId: spend.id, voterId: raj.id, decision: VoteDecision.APPROVE },
  });

  // Family pool — Ahmad pre-verified, Siti unverified so the demo has both states
  const family = await prisma.pool.create({
    data: {
      type: PoolType.FAMILY,
      name: "Keluarga Ahmad",
      description: "Household budget pool",
      currentBalance: "1850.00",
      targetAmount: "2000.00",
      emergencyOverride: true,
      createdById: ahmad.id,
      members: {
        create: [
          {
            userId: ahmad.id,
            role: MemberRole.OWNER,
            zkVerified: true,
            zkVerifiedAt: new Date(),
            zkCommitmentHash: "0x" + "ab".repeat(32),
            zkProof: { protocol: "groth16-stub", seeded: true },
          },
          { userId: siti.id, role: MemberRole.ADMIN },
        ],
      },
    },
  });

  const fam1 = await prisma.contribution.create({
    data: { poolId: family.id, userId: ahmad.id, amount: "1200.00" },
  });
  await prisma.transaction.create({
    data: {
      poolId: family.id,
      userId: ahmad.id,
      type: TransactionType.CONTRIBUTION,
      direction: TransactionDirection.IN,
      amount: "1200.00",
      balanceBefore: "0.00",
      balanceAfter: "1200.00",
      description: `Contribution to ${family.name}`,
      contributionId: fam1.id,
    },
  });
  const fam2 = await prisma.contribution.create({
    data: { poolId: family.id, userId: siti.id, amount: "650.00" },
  });
  await prisma.transaction.create({
    data: {
      poolId: family.id,
      userId: siti.id,
      type: TransactionType.CONTRIBUTION,
      direction: TransactionDirection.IN,
      amount: "650.00",
      balanceBefore: "1200.00",
      balanceAfter: "1850.00",
      description: `Contribution to ${family.name}`,
      contributionId: fam2.id,
    },
  });

  console.log("Seed complete.");
  console.log("  Demo users (PIN = 123456):");
  console.log("    +60112345001  Ahmad   (owner of both pools)");
  console.log("    +60112345002  Siti");
  console.log("    +60112345003  Raj");
  console.log("    +60112345004  Mei");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
