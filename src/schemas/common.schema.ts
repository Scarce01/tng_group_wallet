import { z } from "zod";

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const moneySchema = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? v.toFixed(2) : v))
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), "Invalid money amount")
  .refine((v) => Number(v) > 0, "Amount must be greater than zero");

export type Pagination = z.infer<typeof paginationSchema>;
