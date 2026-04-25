import { z } from "zod";

const SPEND_CATEGORIES = [
  "ACCOMMODATION",
  "TRANSPORT",
  "FOOD",
  "ACTIVITIES",
  "SHOPPING",
  "TOLL",
  "PETROL",
  "OTHER_TRIP",
  "RENT",
  "UTILITIES",
  "GROCERIES",
  "EDUCATION",
  "MEDICAL",
  "INSURANCE",
  "CHILDCARE",
  "OTHER_FAMILY",
] as const;

export const createSpendRequestSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  title: z.string().trim().min(2).max(120),
  description: z.string().max(500).optional(),
  category: z.enum(SPEND_CATEGORIES),
  receiptUrl: z.string().url().optional(),
  isEmergency: z.boolean().default(false),
  expiresInHours: z.number().int().min(1).max(168).default(24),
});

export const voteSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT", "ABSTAIN"]),
  comment: z.string().max(300).optional(),
});

export const listSpendQuery = z.object({
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "EXPIRED", "CANCELLED", "EXECUTED"])
    .optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
