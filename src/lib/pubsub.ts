import { EventEmitter } from "node:events";
import Redis from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

export interface PubSub {
  publish(channel: string, payload: string): Promise<void>;
  subscribe(channel: string): Promise<void>;
  onMessage(handler: (channel: string, payload: string) => void): void;
  close(): Promise<void>;
  readonly kind: "redis" | "in-process";
}

// --------------------- In-process (no Redis) ---------------------
class InProcessPubSub implements PubSub {
  readonly kind = "in-process" as const;
  private readonly bus = new EventEmitter();
  private readonly subscribed = new Set<string>();
  private handler: ((channel: string, payload: string) => void) | null = null;

  constructor() {
    this.bus.setMaxListeners(1000);
  }

  async publish(channel: string, payload: string): Promise<void> {
    // Even if no one subscribed yet, we still emit — listeners added later won't
    // see past events, which matches the Redis pub/sub semantic.
    this.bus.emit("msg", channel, payload);
  }

  async subscribe(channel: string): Promise<void> {
    this.subscribed.add(channel);
  }

  onMessage(handler: (channel: string, payload: string) => void): void {
    this.handler = handler;
    this.bus.on("msg", (channel: string, payload: string) => {
      if (this.subscribed.has(channel)) handler(channel, payload);
    });
  }

  async close(): Promise<void> {
    this.bus.removeAllListeners();
    this.subscribed.clear();
    this.handler = null;
  }
}

// --------------------- Redis-backed ---------------------
function describeRedisErr(err: unknown): string {
  if (!err) return "unknown";
  if (err instanceof Error) {
    const code = (err as Error & { code?: string }).code;
    return code ? `${code}: ${err.message}` : err.message || err.name;
  }
  return String(err);
}

class RedisPubSub implements PubSub {
  readonly kind = "redis" as const;
  private readonly pub: Redis;
  private readonly sub: Redis;
  private lastErr = "";

  constructor(url: string) {
    this.pub = new Redis(url, { maxRetriesPerRequest: 3 });
    this.sub = new Redis(url, { maxRetriesPerRequest: 3 });
    for (const [name, conn] of [
      ["pub", this.pub],
      ["sub", this.sub],
    ] as const) {
      conn.on("error", (err) => {
        const msg = describeRedisErr(err);
        if (msg !== this.lastErr) {
          this.lastErr = msg;
          logger.error(`redis ${name} error`, { err: msg });
        }
      });
      conn.on("connect", () => {
        this.lastErr = "";
        logger.info(`redis ${name} connected`);
      });
    }
  }

  async publish(channel: string, payload: string): Promise<void> {
    await this.pub.publish(channel, payload);
  }

  async subscribe(channel: string): Promise<void> {
    await this.sub.subscribe(channel);
  }

  onMessage(handler: (channel: string, payload: string) => void): void {
    this.sub.on("message", handler);
  }

  async close(): Promise<void> {
    await Promise.allSettled([this.pub.quit(), this.sub.quit()]);
  }
}

// --------------------- Factory ---------------------
function createPubSub(): PubSub {
  if (env.REDIS_URL && env.REDIS_URL.trim()) {
    logger.info("pubsub: using Redis", { url: safeUrl(env.REDIS_URL) });
    return new RedisPubSub(env.REDIS_URL);
  }
  logger.info("pubsub: using in-process EventEmitter (no REDIS_URL set)");
  return new InProcessPubSub();
}

function safeUrl(u: string): string {
  try {
    const parsed = new URL(u);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return "<invalid>";
  }
}

export const pubsub: PubSub = createPubSub();
