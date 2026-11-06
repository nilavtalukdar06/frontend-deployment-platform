import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app";
import { env } from "./config/env";
import { disconnectConsumer } from "./lib/kafka";
import { logger } from "./lib/logger";
import { pgPool } from "./lib/postgres";
import { closeRedis } from "./lib/redis";
import { DeploymentLogStreamService } from "./services/deployment-log-stream.service";
import { createSocketServer } from "./socket/socket-server";

const httpServer = createServer(createApp());
const io = createSocketServer(httpServer);

let shuttingDown = false;

const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info(`received ${signal}, stopping realtime service`);

  const forceExitTimer = setTimeout(() => {
    logger.error("realtime service shutdown timed out, forcing exit");
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  try {
    console.log("T consumer");
    await disconnectConsumer(env.SHUTDOWN_TIMEOUT_MS);
    console.log("T io");
    await io.close();
    console.log("T redis/pg");
    await Promise.all([closeRedis(), pgPool.end()]);
    console.log("T done");
  } catch (err) {
    logger.error({ err }, "error while stopping realtime service");
    exitCode = 1;
  }

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

httpServer.listen(env.PORT, () => {
  logger.info(
    `realtime-service listening on port ${env.PORT} [${env.NODE_ENV}]`,
  );

  DeploymentLogStreamService.start(io).catch((err: unknown) => {
    logger.fatal({ err }, "failed to start the deployment log stream");
    void shutdown("startupFailure", 1);
  });
});
