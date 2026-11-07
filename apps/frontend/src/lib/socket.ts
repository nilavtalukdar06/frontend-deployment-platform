import { io, type Socket } from "socket.io-client";
import { env } from "@/config/env";
import { getAccessToken } from "@/lib/auth";
import { queryClient } from "@/lib/query-client";
import { sessionQueryOptions } from "@/lib/session";
import type { DeploymentLogMessage } from "@/features/logs/types";
import type { DeploymentStatus } from "@/features/deployments/types";

export type SubscribeAck =
  | { ok: true; data: { deploymentId: string; status: DeploymentStatus } }
  | { ok: false; code: string; message: string };

export type UnsubscribeAck =
  | { ok: true; data: { deploymentId: string } }
  | { ok: false; code: string; message: string };

interface ServerToClientEvents {
  "deployment:log": (message: DeploymentLogMessage) => void;
  "auth:expired": () => void;
}

interface ClientToServerEvents {
  "deployment:subscribe": (
    payload: { deploymentId: string },
    ack: (response: SubscribeAck) => void,
  ) => void;
  "deployment:unsubscribe": (
    payload: { deploymentId: string },
    ack: (response: UnsubscribeAck) => void,
  ) => void;
}

export type RealtimeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const AUTH_ERROR_CODES = new Set(["UNAUTHORIZED", "INVALID_TOKEN"]);
const MIN_REAUTH_INTERVAL_MS = 10_000;

let socket: RealtimeSocket | null = null;
let consumers = 0;
let lastReauthAt = 0;

const reconnectWithFreshToken = async (target: RealtimeSocket) => {
  const now = Date.now();

  if (now - lastReauthAt < MIN_REAUTH_INTERVAL_MS) {
    return;
  }

  lastReauthAt = now;

  try {
    const session = await queryClient.query({
      ...sessionQueryOptions,
      staleTime: 0,
    });

    if (session && consumers > 0 && !target.connected) {
      target.connect();
    }
  } catch {
    return;
  }
};

const readErrorCode = (error: Error): string | undefined => {
  const data = (error as Error & { data?: { code?: unknown } }).data;

  return typeof data?.code === "string" ? data.code : undefined;
};

const createSocket = (): RealtimeSocket => {
  const instance: RealtimeSocket = io(env.VITE_API_URL, {
    transports: ["websocket"],
    autoConnect: false,
    auth: (callback) => callback({ token: getAccessToken() ?? "" }),
  });

  instance.on("connect_error", (error) => {
    const code = readErrorCode(error);

    if (code && AUTH_ERROR_CODES.has(code)) {
      void reconnectWithFreshToken(instance);
    }
  });

  instance.on("auth:expired", () => {
    void reconnectWithFreshToken(instance);
  });

  return instance;
};

export const acquireSocket = (): RealtimeSocket => {
  socket ??= createSocket();
  consumers += 1;

  if (!socket.connected && !socket.active) {
    socket.connect();
  }

  return socket;
};

export const releaseSocket = (): void => {
  consumers = Math.max(0, consumers - 1);

  if (consumers === 0 && socket) {
    socket.disconnect();
  }
};
