import {
  deploymentQueue,
  type DeploymentJobData,
} from "../lib/deployment-queue";
import { logger } from "../lib/logger";
import { DeploymentRepository } from "../repositories/deployment.repository";

const ENQUEUE_FAILURE_MESSAGE =
  "[initialize] the deployment could not be queued";

export abstract class DeploymentQueueService {
  static async enqueue(job: DeploymentJobData): Promise<boolean> {
    try {
      await deploymentQueue.add("deploy", job, { jobId: job.deploymentId });
      logger.info(job, "deployment queued");
      return true;
    } catch (err) {
      logger.error({ err, ...job }, "deployment could not be queued");

      await DeploymentRepository.markQueuedAsFailed(
        job.deploymentId,
        ENQUEUE_FAILURE_MESSAGE,
      ).catch((markErr: unknown) =>
        logger.error(
          { err: markErr, deploymentId: job.deploymentId },
          "failed to mark deployment as failed",
        ),
      );

      return false;
    }
  }

  static async remove(deploymentId: string): Promise<void> {
    try {
      await deploymentQueue.remove(deploymentId);
    } catch (err) {
      logger.warn(
        { err, deploymentId },
        "queued deployment job could not be removed",
      );
    }
  }
}
