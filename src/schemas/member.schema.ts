import { z } from "zod";

export const addMemberSchema = z.object({
  phone: z.string().regex(/^\+60\d{8,11}$/, "Invalid Malaysian phone"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
  contributionWeight: z.number().positive().max(99).default(1.0),
});

export const updateMemberSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).optional(),
  contributionWeight: z.number().positive().max(99).optional(),
});

export const createInviteSchema = z.object({
  phone: z.string().regex(/^\+60\d{8,11}$/).optional(),
  expiresInHours: z.number().int().min(1).max(168).default(48),
});
