import "dotenv/config";
import { env } from "./config/env";
import { clickhouseClient } from "./db/clickhouse";
import { disconnectConsumer } from "./lib/kafka";
import { logger } from "./lib/logger";
import { DeploymentLogConsumerService } from "./services/deployment-log-consumer.service";

let shuttingDown = false;

const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info(`received ${signal}, stopping log worker`);

  const forceExitTimer = setTimeout(() => {
    logger.error("log worker shutdown timed out, forcing exit");
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  await disconnectConsumer(env.SHUTDOWN_TIMEOUT_MS);
  await clickhouseClient.close().catch((err: unknown) => {
    logger.error({ err }, "clickhouse client close failed");
  });
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

DeploymentLogConsumerService.start().catch((err: unknown) => {
  logger.fatal({ err }, "log worker failed to start");
  void shutdown("startupFailure", 1);
});
