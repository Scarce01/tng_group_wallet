/**
 * Live updates over WebSocket.
 *
 * Connects to the backend `/ws?token=<jwt>` channel, subscribes to the pools
 * the user belongs to, and invalidates the relevant React Query caches when
 * the backend pushes events (vote_cast, balance_updated, spend_request_*,
 * member_*).
 *
 * Reconnects with exponential backoff. Re-subscribes to all known pools after
 * a reconnect. Drops cleanly when the JWT becomes unavailable (logout).
 */

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { tokens } from "./client";

type WSEvent =
  | { event: "ready"; data: { userId: string } }
  | { event: "subscribed"; data: { poolId: string } }
  | { event: "unsubscribed"; data: { poolId: string } }
  | { event: "error"; data: { message: string } }
  | { event: "balance_updated"; data: { poolId?: string; balance?: string } }
  | { event: "vote_cast"; data: { spendRequestId: string; voterId: string; decision: string; status?: string } }
  | { event: "spend_request_created"; data: { spendRequest: { id: string; poolId: string } } }
  | { event: "spend_request_resolved"; data: { spendRequest: { id: string; poolId: string; status: string } } }
  | { event: "spend_request_cancelled"; data: { spendRequestId: string } }
  | { event: "member_added"; data: unknown }
  | { event: "member_updated"; data: unknown }
  | { event: "member_left"; data: unknown }
  | { event: "member_removed"; data: unknown }
  | { event: "member_joined"; data: unknown };

export function useRealtimeSync(poolIds: string[]) {
  const qc = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const desiredRef = useRef<string[]>(poolIds);
  // Keep desired list current so reconnect uses fresh pool ids
  desiredRef.current = poolIds;

  useEffect(() => {
    let stopped = false;
    let backoffMs = 1000;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    function syncSubscriptions(socket: WebSocket) {
      const desired = new Set(desiredRef.current);
      // Subscribe to new pools
      for (const id of desired) {
        if (!subscribedRef.current.has(id)) {
          socket.send(JSON.stringify({ action: "subscribe", poolId: id }));
        }
      }
      // Unsubscribe from removed pools
      for (const id of subscribedRef.current) {
        if (!desired.has(id)) {
          socket.send(JSON.stringify({ action: "unsubscribe", poolId: id }));
        }
      }
      subscribedRef.current = desired;
    }

    function connect() {
      const access = tokens.access;
      if (!access || stopped) return;

      // Use the same origin so Vite's WS proxy forwards to the backend in dev
      // and direct connection works in prod.
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${proto}//${window.location.host}/ws?token=${encodeURIComponent(access)}`;

      let socket: WebSocket;
      try {
        socket = new WebSocket(url);
      } catch {
        scheduleReconnect();
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        backoffMs = 1000;
        // (Re)subscribe to all desired pools
        subscribedRef.current = new Set();
        syncSubscriptions(socket);
      };

      socket.onmessage = (raw) => {
        let msg: WSEvent;
        try {
          msg = JSON.parse(raw.data);
        } catch {
          return;
        }
        handleEvent(msg);
      };

      socket.onclose = () => {
        socketRef.current = null;
        subscribedRef.current = new Set();
        scheduleReconnect();
      };

      socket.onerror = () => {
        // onclose will fire after onerror — let the close handler reconnect.
      };
    }

    function scheduleReconnect() {
      if (stopped) return;
      if (reconnectTimer) return;
      const delay = Math.min(backoffMs, 15_000);
      backoffMs = Math.min(backoffMs * 2, 15_000);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delay);
    }

    function handleEvent(msg: WSEvent) {
      switch (msg.event) {
        case "balance_updated": {
          const id = (msg.data as { poolId?: string }).poolId;
          if (id) {
            qc.invalidateQueries({ queryKey: ["pool", id] });
            qc.invalidateQueries({ queryKey: ["pool", id, "transactions"] });
            qc.invalidateQueries({ queryKey: ["pool", id, "contributions"] });
            qc.invalidateQueries({ queryKey: ["pool", id, "analytics"] });
          }
          qc.invalidateQueries({ queryKey: ["pools"] });
          qc.invalidateQueries({ queryKey: ["me", "transactions"] });
          break;
        }
        case "vote_cast": {
          // Refresh spend-requests for ALL subscribed pools — payload doesn't
          // carry poolId, but the channel is per-pool so we only get votes
          // for our subscriptions.
          for (const id of subscribedRef.current) {
            qc.invalidateQueries({ queryKey: ["pool", id, "spend-requests"] });
          }
          break;
        }
        case "spend_request_created":
        case "spend_request_resolved": {
          const poolId = msg.data.spendRequest?.poolId;
          if (poolId) {
            qc.invalidateQueries({ queryKey: ["pool", poolId, "spend-requests"] });
            qc.invalidateQueries({ queryKey: ["pool", poolId, "transactions"] });
            qc.invalidateQueries({ queryKey: ["pool", poolId, "analytics"] });
            qc.invalidateQueries({ queryKey: ["pool", poolId] });
          }
          qc.invalidateQueries({ queryKey: ["pools"] });
          qc.invalidateQueries({ queryKey: ["me", "transactions"] });
          break;
        }
        case "spend_request_cancelled": {
          for (const id of subscribedRef.current) {
            qc.invalidateQueries({ queryKey: ["pool", id, "spend-requests"] });
          }
          break;
        }
        case "member_added":
        case "member_updated":
        case "member_left":
        case "member_removed":
        case "member_joined": {
          for (const id of subscribedRef.current) {
            qc.invalidateQueries({ queryKey: ["pool", id, "members"] });
            qc.invalidateQueries({ queryKey: ["pool", id] });
          }
          qc.invalidateQueries({ queryKey: ["pools"] });
          break;
        }
        default:
          break;
      }
    }

    connect();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      const s = socketRef.current;
      socketRef.current = null;
      subscribedRef.current = new Set();
      if (s && (s.readyState === WebSocket.OPEN || s.readyState === WebSocket.CONNECTING)) {
        try {
          s.close();
        } catch {
          // ignore
        }
      }
    };
    // We intentionally start the socket once; pool changes are handled by the
    // second effect below using a ref so we don't tear down the connection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc]);

  // When the pool list changes, send subscribe/unsubscribe over the existing
  // open socket. If the socket isn't open yet, the next onopen will sync.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const desired = new Set(poolIds);
    for (const id of desired) {
      if (!subscribedRef.current.has(id)) {
        socket.send(JSON.stringify({ action: "subscribe", poolId: id }));
      }
    }
    for (const id of subscribedRef.current) {
      if (!desired.has(id)) {
        socket.send(JSON.stringify({ action: "unsubscribe", poolId: id }));
      }
    }
    subscribedRef.current = desired;
  }, [poolIds.join("|")]);
}
