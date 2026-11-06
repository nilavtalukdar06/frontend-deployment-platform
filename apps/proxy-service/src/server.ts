import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { disconnectProducer } from "./lib/kafka";
import { logger } from "./lib/logger";
import { closePostgres } from "./lib/postgres";
import { AnalyticsProducerService } from "./services/analytics-producer.service";

let server: Server;

export const startServer = (): Server => {
  const app = createApp();

  server = app.listen(env.PORT, () => {
    logger.info(
      `proxy-service listening on port ${env.PORT} for *.${env.ROOT_DOMAIN} [${env.NODE_ENV}]`,
    );
  });

  AnalyticsProducerService.warmUp().catch((err: unknown) => {
    logger.error({ err }, "analytics producer failed to connect");
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
    await disconnectProducer(env.SHUTDOWN_TIMEOUT_MS);
    await closePostgres();
    clearTimeout(forceExitTimer);
    process.exit(0);
  });
};
