import "dotenv/config";
import { Worker } from "bullmq";
import { env } from "./config/env";
import { DEPLOYMENT_QUEUE_NAME, type DeploymentJobData } from "@repo/contracts";
import { logger } from "./lib/logger";
import { pgPool } from "./lib/postgres";
import { createBullConnection, redisClient } from "./lib/redis";
import {
  DeploymentWorkerService,
  type DeploymentJobResult,
} from "./services/deployment-worker.service";

const workerConnection = createBullConnection();

const worker = new Worker<DeploymentJobData, DeploymentJobResult>(
  DEPLOYMENT_QUEUE_NAME,
  (job, token) => DeploymentWorkerService.process(job, token),
  {
    connection: workerConnection,
    concurrency: env.DEPLOYMENT_WORKER_CONCURRENCY,
  },
);

worker.on("ready", () => {
  logger.info(
    { concurrency: env.DEPLOYMENT_WORKER_CONCURRENCY },
    "deployment-worker ready",
  );
});

worker.on("completed", (job, result) => {
  logger.info(
    { deploymentId: job.data.deploymentId, result },
    "deployment job completed",
  );
});

worker.on("failed", (job, err) => {
  void DeploymentWorkerService.handleFailure(job, err);
});

worker.on("error", (err) => {
  logger.error({ err }, "deployment worker error");
});

let shuttingDown = false;

const shutdown = async (signal: string): Promise<void> => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info(`received ${signal}, stopping deployment worker`);

  const forceExitTimer = setTimeout(() => {
    logger.error("deployment worker shutdown timed out, forcing exit");
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);

  try {
    await worker.close();
    await Promise.all([
      workerConnection.quit(),
      pgPool.end(),
      redisClient.quit(),
    ]);
    logger.info("deployment worker stopped");
    clearTimeout(forceExitTimer);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "error while stopping deployment worker");
    clearTimeout(forceExitTimer);
    process.exit(1);
  }
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandled rejection");
  void shutdown("unhandledRejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaught exception");
  void shutdown("uncaughtException");
});
