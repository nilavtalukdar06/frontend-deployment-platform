import "dotenv/config";
import { env } from "./config/env";
import { logger } from "./lib/logger";
import { closePostgres } from "./lib/postgres";
import { runDeploymentPipeline } from "./pipeline/deployment.pipeline";
import { DeploymentRepository } from "./repositories/deployment.repository";

let exiting = false;

const exit = async (code: number): Promise<never> => {
  if (!exiting) {
    exiting = true;
    await closePostgres();
    logger.flush();
  }
  process.exit(code);
};

const abort = async (deploymentId: string, reason: string): Promise<never> => {
  logger.error({ deploymentId, reason }, "deployment aborted");
  await DeploymentRepository.markFailed(deploymentId, reason).catch(
    (err: unknown) =>
      logger.error({ err }, "failed to mark deployment as failed"),
  );
  return exit(1);
};

const main = async (): Promise<never> => {
  const { DEPLOYMENT_ID: deploymentId, USER_ID: userId } = env;

  if (!deploymentId || !userId) {
    logger.fatal("DEPLOYMENT_ID and USER_ID are required");
    return exit(1);
  }

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

  try {
    const result = await runDeploymentPipeline({ deploymentId, userId });
    logger.info({ deploymentId, result }, "deployment pipeline finished");
    return exit(0);
  } catch {
    return exit(1);
  }
};

void main();
