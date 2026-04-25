-- AlterTable
ALTER TABLE "PoolMember" ADD COLUMN     "zkCommitmentHash" TEXT,
ADD COLUMN     "zkProof" JSONB,
ADD COLUMN     "zkVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zkVerifiedAt" TIMESTAMP(3);
