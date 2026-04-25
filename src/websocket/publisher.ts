import { pubsub } from "../lib/pubsub.js";
import { logger } from "../lib/logger.js";

export const POOL_CHANNEL = (poolId: string) => `pool:${poolId}`;
export const USER_CHANNEL = (userId: string) => `user:${userId}`;

export function publishToPool(poolId: string, event: string, data: unknown): void {
  const payload = JSON.stringify({ event, data, ts: Date.now() });
  pubsub.publish(POOL_CHANNEL(poolId), payload).catch((err: Error) => {
    logger.warn("publishToPool failed", { err: err.message, poolId, event });
  });
}

export function publishToUser(userId: string, event: string, data: unknown): void {
  const payload = JSON.stringify({ event, data, ts: Date.now() });
  pubsub.publish(USER_CHANNEL(userId), payload).catch((err: Error) => {
    logger.warn("publishToUser failed", { err: err.message, userId, event });
  });
}
