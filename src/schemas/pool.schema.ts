import { z } from "zod";

export const createPoolSchema = z
  .object({
    type: z.enum(["TRIP", "FAMILY"]),
    name: z.string().trim().min(2).max(120),
    description: z.string().max(500).optional(),
    coverImageUrl: z.string().url().optional(),
    targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    spendLimit: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
    approvalMode: z.enum(["MAJORITY", "UNANIMOUS", "THRESHOLD", "ADMIN_ONLY"]).default("MAJORITY"),
    approvalThreshold: z.number().int().min(1).max(100).default(51),
    emergencyOverride: z.boolean().default(false),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .refine(
    (v) => v.type === "TRIP" ? !!v.endDate : true,
    { message: "Trip pools require endDate", path: ["endDate"] }
  );

export const updatePoolSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  coverImageUrl: z.string().url().optional(),
  targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  spendLimit: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  approvalMode: z.enum(["MAJORITY", "UNANIMOUS", "THRESHOLD", "ADMIN_ONLY"]).optional(),
  approvalThreshold: z.number().int().min(1).max(100).optional(),
  emergencyOverride: z.boolean().optional(),
  endDate: z.coerce.date().optional(),
});

export const listPoolsQuery = z.object({
  type: z.enum(["TRIP", "FAMILY"]).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "SETTLED", "ARCHIVED"]).optional(),
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type UpdatePoolInput = z.infer<typeof updatePoolSchema>;
