import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { Errors } from "../utils/errors.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const REFRESH_TTL_DAYS = 7;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function register(input: {
  phone: string;
  pin: string;
  fullName: string;
  displayName?: string;
  email?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { phone: input.phone } });
  if (existing) throw Errors.conflict("Phone number already registered");

  const pinHash = await bcrypt.hash(input.pin, 10);
  const user = await prisma.user.create({
    data: {
      phone: input.phone,
      pinHash,
      fullName: input.fullName,
      displayName: input.displayName ?? input.fullName.split(" ")[0] ?? input.fullName,
      email: input.email,
    },
    select: publicUserSelect,
  });
  return issueTokens(user);
}

export async function login(phone: string, pin: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user || !user.isActive) throw Errors.unauthenticated("Invalid phone or PIN");
  const ok = await bcrypt.compare(pin, user.pinHash);
  if (!ok) throw Errors.unauthenticated("Invalid phone or PIN");
  const publicUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: publicUserSelect,
  });
  return issueTokens(publicUser);
}

export async function refresh(refreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Errors.unauthenticated("Invalid refresh token");
  }
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw Errors.unauthenticated("Refresh token expired or revoked");
  }
  // Rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: publicUserSelect });
  if (!user) throw Errors.unauthenticated("User not found");
  return issueTokens(user);
}

export async function logout(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

async function issueTokens(user: { id: string; phone: string }) {
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken({ sub: user.id, phone: user.phone });
  const refreshToken = signRefreshToken({ sub: user.id, jti });
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return { user, accessToken, refreshToken };
}

export const publicUserSelect = {
  id: true,
  phone: true,
  email: true,
  fullName: true,
  displayName: true,
  avatarUrl: true,
  kycStatus: true,
  preferredLang: true,
  mainBalance: true,
  createdAt: true,
} as const;
