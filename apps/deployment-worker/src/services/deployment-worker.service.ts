import { DelayedError, type Job } from "bullmq";
import { env } from "../config/env";
import {
  DEPLOYMENT_JOB_ATTEMPTS,
  type DeploymentJobData,
} from "../constants/queue";
import { logger } from "../lib/logger";
import { DeploymentRepository } from "../repositories/deployment.repository";
import {
  AuthServiceClient,
  GithubAuthRequiredError,
} from "./auth-service-client";
import { DeploymentLockService } from "./deployment-lock.service";
import { DeploymentRunnerService } from "./deployment-runner.service";

export type DeploymentJobResult = "started" | "skipped" | "failed";

const GITHUB_AUTH_FAILURE_MESSAGE =
  "[initialize] github authorization is missing or was revoked";
const QUEUE_FAILURE_MESSAGE =
  "[initialize] the deployment could not be started after several attempts";

export abstract class DeploymentWorkerService {
  static async process(
    job: Job<DeploymentJobData>,
    token?: string,
  ): Promise<DeploymentJobResult> {
    const { deploymentId, userId } = job.data;
    const log = logger.child({ deploymentId, userId, jobId: job.id });
    const deployment = await DeploymentRepository.findById(deploymentId);

    if (!deployment || deployment.status !== "queued") {
      log.info(
        { status: deployment?.status },
        "deployment is no longer queued, skipping",
      );
      return "skipped";
    }

    if (!(await DeploymentWorkerService.acquireLock(userId, deploymentId))) {
      log.debug("another deployment is running for this user, delaying");
      await job.moveToDelayed(
        Date.now() + env.DEPLOYMENT_LOCK_RETRY_DELAY_MS,
        token,
      );
      throw new DelayedError();
    }

    let githubToken: string;

    try {
      githubToken = await AuthServiceClient.getGithubToken(userId);
    } catch (err) {
      await DeploymentLockService.release(userId, deploymentId);

      if (err instanceof GithubAuthRequiredError) {
        await DeploymentRepository.markQueuedAsFailed(
          deploymentId,
          GITHUB_AUTH_FAILURE_MESSAGE,
        );
        return "failed";
      }

      throw err;
    }

    const started = await DeploymentRunnerService.start({
      deploymentId,
      userId,
      githubToken,
    });

    if (!started) {
      await DeploymentLockService.release(userId, deploymentId);
      return "failed";
    }

    return "started";
  }

  static async handleFailure(
    job: Job<DeploymentJobData> | undefined,
    err: Error,
  ): Promise<void> {
    if (!job) {
      logger.error({ err }, "deployment job failed");
      return;
    }

    const { deploymentId, userId } = job.data;
    const attempts = job.opts.attempts ?? DEPLOYMENT_JOB_ATTEMPTS;

    logger.error(
      { err, deploymentId, attemptsMade: job.attemptsMade, attempts },
      "deployment job failed",
    );

    if (job.attemptsMade < attempts) {
      return;
    }

    await Promise.all([
      DeploymentRepository.markQueuedAsFailed(
        deploymentId,
        QUEUE_FAILURE_MESSAGE,
      ),
      DeploymentLockService.release(userId, deploymentId),
    ]).catch((markErr: unknown) =>
      logger.error(
        { err: markErr, deploymentId },
        "failed to finalize a deployment whose job failed",
      ),
    );
  }

  private static async acquireLock(
    userId: string,
    deploymentId: string,
  ): Promise<boolean> {
    if (await DeploymentLockService.acquire(userId, deploymentId)) {
      return true;
    }

    const holderId = await DeploymentLockService.holder(userId);

    if (holderId === deploymentId) {
      return true;
    }

    if (holderId) {
      const holder = await DeploymentRepository.findById(holderId);

      if (holder && DeploymentRepository.isActive(holder)) {
        return false;
      }

      logger.warn(
        { userId, staleDeploymentId: holderId, status: holder?.status },
        "releasing stale user deployment lock",
      );
      await DeploymentLockService.release(userId, holderId);
    }

    return DeploymentLockService.acquire(userId, deploymentId);
  }
}
