import { z } from "zod";

export const createContributionSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a positive decimal with up to 2 dp")
    .refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  description: z.string().max(200).optional(),
  receiptUrl: z.string().url().optional(),
});

export const listContributionsQuery = z.object({
  userId: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
