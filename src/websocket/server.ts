import type { IncomingMessage } from "node:http";
import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { URL } from "node:url";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { pubsub } from "../lib/pubsub.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { POOL_CHANNEL, USER_CHANNEL } from "./publisher.js";

interface Client {
  socket: WebSocket;
  userId: string;
  pools: Set<string>;
  isAlive: boolean;
}

const clients = new Set<Client>();
const subscribedChannels = new Set<string>();

function dispatch(channel: string, message: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch {
    return;
  }
  if (channel.startsWith("pool:")) {
    const poolId = channel.slice("pool:".length);
    for (const c of clients) {
      if (c.pools.has(poolId) && c.socket.readyState === WebSocket.OPEN) {
        c.socket.send(JSON.stringify(parsed));
      }
    }
  } else if (channel.startsWith("user:")) {
    const userId = channel.slice("user:".length);
    for (const c of clients) {
      if (c.userId === userId && c.socket.readyState === WebSocket.OPEN) {
        c.socket.send(JSON.stringify(parsed));
      }
    }
  }
}

async function ensureSubscribed(channel: string) {
  if (subscribedChannels.has(channel)) return;
  subscribedChannels.add(channel);
  await pubsub.subscribe(channel);
}

function authenticate(req: IncomingMessage): { userId: string; phone: string } | null {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const token =
      url.searchParams.get("token") ??
      req.headers["authorization"]?.toString().replace(/^Bearer\s+/i, "");
    if (!token) return null;
    const payload = verifyAccessToken(token);
    return { userId: payload.sub, phone: payload.phone };
  } catch {
    return null;
  }
}

export function attachWebSocketServer(http: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  pubsub.onMessage(dispatch);

  http.on("upgrade", (req, socket, head) => {
    if (!req.url?.startsWith(env.WS_PATH)) {
      socket.destroy();
      return;
    }
    const auth = authenticate(req);
    if (!auth) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, auth);
    });
  });

  wss.on("connection", async (socket: WebSocket, _req: IncomingMessage, auth: { userId: string; phone: string }) => {
    const client: Client = { socket, userId: auth.userId, pools: new Set(), isAlive: true };
    clients.add(client);
    logger.info("ws client connected", { userId: auth.userId });

    await ensureSubscribed(USER_CHANNEL(auth.userId));

    socket.send(JSON.stringify({ event: "ready", data: { userId: auth.userId } }));

    socket.on("pong", () => {
      client.isAlive = true;
    });

    socket.on("message", async (raw) => {
      let msg: { action?: string; poolId?: string };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ event: "error", data: { message: "Invalid JSON" } }));
        return;
      }
      if (msg.action === "subscribe" && msg.poolId) {
        const member = await prisma.poolMember.findUnique({
          where: { poolId_userId: { poolId: msg.poolId, userId: auth.userId } },
        });
        if (!member || !member.isActive) {
          socket.send(JSON.stringify({ event: "error", data: { message: "Not a member of pool" } }));
          return;
        }
        client.pools.add(msg.poolId);
        await ensureSubscribed(POOL_CHANNEL(msg.poolId));
        socket.send(JSON.stringify({ event: "subscribed", data: { poolId: msg.poolId } }));
      } else if (msg.action === "unsubscribe" && msg.poolId) {
        client.pools.delete(msg.poolId);
        socket.send(JSON.stringify({ event: "unsubscribed", data: { poolId: msg.poolId } }));
      }
    });

    socket.on("close", () => {
      clients.delete(client);
      logger.info("ws client disconnected", { userId: auth.userId });
    });

    socket.on("error", (err) => {
      logger.warn("ws error", { userId: auth.userId, err: err.message });
    });
  });

  // Heartbeat — terminate dead connections every 30s
  const heartbeat = setInterval(() => {
    for (const c of clients) {
      if (!c.isAlive) {
        c.socket.terminate();
        clients.delete(c);
        continue;
      }
      c.isAlive = false;
      try {
        c.socket.ping();
      } catch {
        // ignore
      }
    }
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  return wss;
}
