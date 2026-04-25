import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional().or(z.literal("")),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGINS: z.string().default("*"),
  WS_PATH: z.string().default("/ws"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// CORS origin resolver. Accepts:
//   * a literal "*" wildcard (credentials still work because we reflect the Origin)
//   * a comma-separated allowlist
//   * any http://localhost:<port> in development, so Flutter dev (ports vary) just works
const allowlist = env.CORS_ORIGINS === "*"
  ? null
  : env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean);

export const corsOrigins = (
  origin: string | undefined,
  cb: (err: Error | null, allow?: boolean) => void,
): void => {
  // Native mobile / curl / same-origin — no Origin header, always allow.
  if (!origin) return cb(null, true);
  if (allowlist === null) return cb(null, true);
  if (allowlist.includes(origin)) return cb(null, true);
  // Dev ergonomics: accept any localhost / 127.0.0.1 port in non-prod.
  if (env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    return cb(null, true);
  }
  cb(null, false);
};
