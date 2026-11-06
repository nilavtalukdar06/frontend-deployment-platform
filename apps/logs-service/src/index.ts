import "dotenv/config";
import type { Server } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { clickhouseClient } from "./db/clickhouse";
import { disconnectConsumer } from "./lib/kafka";
import { logger } from "./lib/logger";
import { closePostgres } from "./lib/postgres";
import { DeploymentLogConsumerService } from "./services/deployment-log-consumer.service";

let shuttingDown = false;

const closeServer = (server: Server): Promise<void> =>
  new Promise((resolve) => {
    server.close((err) => {
      if (err) {
        logger.error({ err }, "http server close failed");
      }
      resolve();
    });
    server.closeIdleConnections();
  });

const server = createApp().listen(env.PORT, () => {
  logger.info(`logs-service listening on port ${env.PORT} [${env.NODE_ENV}]`);

  DeploymentLogConsumerService.start().catch((err: unknown) => {
    logger.fatal({ err }, "deployment log consumer failed to start");
    void shutdown("startupFailure", 1);
  });
});

const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info(`received ${signal}, stopping logs service`);

  const forceExitTimer = setTimeout(() => {
    logger.error("logs service shutdown timed out, forcing exit");
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  await closeServer(server);
  await disconnectConsumer(env.SHUTDOWN_TIMEOUT_MS);
  await clickhouseClient.close().catch((err: unknown) => {
    logger.error({ err }, "clickhouse client close failed");
  });
  await closePostgres();
  clearTimeout(forceExitTimer);
  logger.flush();
  process.exit(exitCode);
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandled rejection");
  void shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaught exception");
  void shutdown("uncaughtException", 1);
});
