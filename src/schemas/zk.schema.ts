import { z } from "zod";

export const proveSchema = z.object({
  totalIncomeCents: z
    .number()
    .int()
    .positive()
    .max(1_000_000_000, "Income value out of bounds"),
});

export const verifySchema = z.object({
  proof: z.record(z.unknown()),
  publicSignals: z.array(z.string()).min(1),
  commitmentHash: z.string().min(8),
});

export type ProveInput = z.infer<typeof proveSchema>;
export type VerifyInput = z.infer<typeof verifySchema>;
