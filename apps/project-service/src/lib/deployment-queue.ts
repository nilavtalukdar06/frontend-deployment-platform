import { Queue } from "bullmq";
import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

export const DEPLOYMENT_QUEUE_NAME = "deployments";

export interface DeploymentJobData {
  deploymentId: string;
  userId: string;
}

const DEPLOYMENT_JOB_ATTEMPTS = 3;

const createBullConnection = (): Redis => {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  connection.on("error", (err) => {
    logger.error({ err }, "deployment queue redis connection error");
  });

  return connection;
};

const queueConnection = createBullConnection();

export const deploymentQueue = new Queue<DeploymentJobData>(
  DEPLOYMENT_QUEUE_NAME,
  {
    connection: queueConnection,
    defaultJobOptions: {
      attempts: DEPLOYMENT_JOB_ATTEMPTS,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: { count: 1_000 },
      removeOnFail: { count: 5_000 },
    },
  },
);

export const closeDeploymentQueue = async (): Promise<void> => {
  await deploymentQueue.close();
  await queueConnection.quit();
};
