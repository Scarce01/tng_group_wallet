import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+60\d{8,11}$/, "Phone must be a Malaysian number starting with +60");

const pinSchema = z.string().regex(/^\d{6}$/, "PIN must be 6 digits");

export const registerSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
  fullName: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(1).max(60).optional(),
  email: z.string().email().max(200).optional(),
});

export const loginSchema = z.object({
  phone: phoneSchema,
  pin: pinSchema,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
