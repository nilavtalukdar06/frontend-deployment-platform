import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { redisClient } from "./lib/redis";

let server: Server;

export const startServer = (): Server => {
  const app = createApp();

  server = app.listen(env.PORT, () => {
    logger.info(`api-gateway listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "unhandled rejection");
    shutdown("unhandledRejection");
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "uncaught exception");
    shutdown("uncaughtException");
  });

  return server;
};

const shutdown = (signal: string): void => {
  logger.info(`received ${signal}, starting graceful shutdown`);

  const forceExitTimer = setTimeout(() => {
    logger.error("graceful shutdown timed out, forcing exit");
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  server?.close(async () => {
    logger.info("http server closed");

    try {
      await redisClient.quit();
      logger.info("redis connection closed");
      clearTimeout(forceExitTimer);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "error while closing connections");
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  });
};
