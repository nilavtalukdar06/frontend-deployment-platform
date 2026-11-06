import type { Server as HttpServer } from "node:http";
import { createAdapter } from "@socket.io/redis-adapter";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env";
import { ServerEvent } from "../constants/socket-events";
import { logger as rootLogger } from "../lib/logger";
import { redisPublisher, redisSubscriber } from "../lib/redis";
import { InvalidTokenError, TokenService } from "../services/token.service";
import { registerSubscriptionHandlers } from "./subscription.handler";

const logger = rootLogger.child({ component: "socket-server" });

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
  origin.trim(),
);

const rejection = (code: string, message: string): Error =>
  Object.assign(new Error(message), { data: { code } });

const authenticate = async (
  socket: Socket,
  next: (err?: Error) => void,
): Promise<void> => {
  const token: unknown = socket.handshake.auth["token"];

  if (typeof token !== "string" || token.length === 0) {
    next(rejection("UNAUTHORIZED", "An access token is required"));
    return;
  }

  try {
    const claims = await TokenService.verifyAccessToken(token);
    socket.data["user"] = claims;
    next();
  } catch (err) {
    if (err instanceof InvalidTokenError) {
      next(
        rejection("INVALID_TOKEN", "The access token is invalid or expired"),
      );
      return;
    }

    logger.error({ err }, "token verification failed unexpectedly");
    next(rejection("SERVICE_UNAVAILABLE", "Authentication is unavailable"));
  }
};

const disconnectWhenTokenExpires = (socket: Socket): void => {
  const expiresAt = (socket.data["user"] as { expiresAt: number }).expiresAt;
  const timer = setTimeout(
    () => {
      socket.emit(ServerEvent.AUTH_EXPIRED);
      socket.disconnect(true);
    },
    Math.max(expiresAt * 1000 - Date.now(), 0),
  );

  socket.once("disconnect", () => clearTimeout(timer));
};

export const createSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    serveClient: false,
    maxHttpBufferSize: 10_000,
    cors: {
      origin: allowedOrigins.includes("*") ? true : allowedOrigins,
      credentials: true,
    },
    adapter: createAdapter(redisPublisher, redisSubscriber),
  });

  io.use((socket, next) => void authenticate(socket, next));

  io.on("connection", (socket) => {
    disconnectWhenTokenExpires(socket);
    registerSubscriptionHandlers(socket);

    logger.debug({ socketId: socket.id }, "client connected");
    socket.on("disconnect", (reason) => {
      logger.debug({ socketId: socket.id, reason }, "client disconnected");
    });
  });

  return io;
};
