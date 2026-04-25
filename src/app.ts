import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { corsOrigins } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import poolRoutes from "./routes/pools.routes.js";
import membersRoutes from "./routes/members.routes.js";
import { poolInviteRouter, inviteActionRouter } from "./routes/invites.routes.js";
import contributionsRoutes from "./routes/contributions.routes.js";
import spendRoutes from "./routes/spend.routes.js";
import poolTxRoutes from "./routes/transactions.routes.js";
import zkRoutes from "./routes/zk.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // Loosen helmet for the demo SPA (inline scripts) — fine for dev/hackathon
  app.use((_req, res, next) => {
    res.removeHeader("Content-Security-Policy");
    next();
  });

  // Static SPA at /. Serve the React/Vite build from web/dist if present,
  // otherwise fall back to the legacy vanilla prototype in public/.
  const webDist = path.resolve(process.cwd(), "web", "dist");
  const publicDir = path.resolve(process.cwd(), "public");
  app.use(express.static(webDist));
  app.use(express.static(publicDir));

  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/users", userRoutes);
  app.use("/api/v1/pools", poolRoutes);
  app.use("/api/v1/pools/:poolId/members", membersRoutes);
  app.use("/api/v1/pools/:poolId/invites", poolInviteRouter);
  app.use("/api/v1/invites", inviteActionRouter);
  app.use("/api/v1/pools/:poolId/contributions", contributionsRoutes);
  app.use("/api/v1/pools/:poolId/spend-requests", spendRoutes);
  app.use("/api/v1/pools/:poolId/zk", zkRoutes);
  app.use("/api/v1/pools/:poolId", poolTxRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
