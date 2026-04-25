import http from "node:http";
import { createApp } from "./app.js";
import { attachWebSocketServer } from "./websocket/server.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";
import { pubsub } from "./lib/pubsub.js";
import { expireStaleRequests } from "./services/spend.service.js";

const app = createApp();
const server = http.createServer(app);
attachWebSocketServer(server);

const expiryTimer = setInterval(() => {
  expireStaleRequests().catch((err: Error) => logger.warn("expiry sweep failed", { err: err.message }));
}, 60_000);

server.listen(env.PORT, () => {
  logger.info("TNG Pool Engine listening", { port: env.PORT, env: env.NODE_ENV, ws: env.WS_PATH });
});

async function shutdown(signal: string) {
  logger.info("shutting down", { signal });
  clearInterval(expiryTimer);
  server.close();
  await Promise.allSettled([prisma.$disconnect(), pubsub.close()]);
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason) => {
  logger.error("unhandledRejection", { reason: reason instanceof Error ? reason.message : String(reason) });
});
