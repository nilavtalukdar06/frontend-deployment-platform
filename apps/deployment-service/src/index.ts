import "dotenv/config";
import { env } from "./config/env";
import { connectProducer, disconnectProducer } from "./lib/kafka";
import { logger } from "./lib/logger";
import { DeploymentLogCollector } from "./logging/deployment-log-collector";
import { closePostgres } from "./lib/postgres";
import { runDeploymentPipeline } from "./pipeline/deployment.pipeline";
import { DeploymentRepository } from "./repositories/deployment.repository";
import { DeploymentLockService } from "./services/deployment-lock.service";

let exiting = false;
let lockOwner: { userId: string; deploymentId: string } | undefined;
let collector: DeploymentLogCollector | undefined;

const logShutdownTimeoutMs = 10_000;

const exit = async (code: number): Promise<never> => {
  if (!exiting) {
    exiting = true;

    if (lockOwner) {
      await DeploymentLockService.release(
        lockOwner.userId,
        lockOwner.deploymentId,
      );
    }

    if (collector) {
      await collector.close(logShutdownTimeoutMs);
    }
    await disconnectProducer(logShutdownTimeoutMs);

    await closePostgres();
    logger.flush();
  }
  process.exit(code);
};

const abort = async (deploymentId: string, reason: string): Promise<never> => {
  logger.error({ deploymentId, reason }, "deployment aborted");
  collector?.status("failed", reason);
  await DeploymentRepository.markFailed(deploymentId, reason).catch(
    (err: unknown) =>
      logger.error({ err }, "failed to mark deployment as failed"),
  );
  return exit(1);
};

const main = async (): Promise<never> => {
  const {
    DEPLOYMENT_ID: deploymentId,
    USER_ID: userId,
    GITHUB_TOKEN_ENCRYPTED: encryptedGithubToken,
  } = env;

  if (!deploymentId || !userId || !encryptedGithubToken) {
    logger.fatal(
      "DEPLOYMENT_ID, USER_ID and GITHUB_TOKEN_ENCRYPTED are required",
    );
    return exit(1);
  }

  lockOwner = { userId, deploymentId };

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void abort(deploymentId, `deployment was stopped (${signal})`);
    });
  }

  process.once("unhandledRejection", (reason) => {
    logger.error({ err: reason }, "unhandled rejection");
    void abort(deploymentId, "unexpected error during deployment");
  });

  process.once("uncaughtException", (err) => {
    logger.error({ err }, "uncaught exception");
    void abort(deploymentId, "unexpected error during deployment");
  });

  const producer = await connectProducer().catch((err: unknown) => {
    logger.warn(
      { err },
      "kafka is unavailable, deployment logs will only be written locally",
    );
    return undefined;
  });

  collector = new DeploymentLogCollector({
    deploymentId,
    producer,
    logger: logger.child({ deploymentId }),
  });

  try {
    const result = await runDeploymentPipeline({
      deploymentId,
      userId,
      encryptedGithubToken,
      collector,
    });
    logger.info({ deploymentId, result }, "deployment pipeline finished");
    return exit(0);
  } catch {
    return exit(1);
  }
};

void main();
