import { rm } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env";
import { DeploymentStep } from "../constants/deployment-step.enum";
import { AuthServiceClient } from "../lib/auth-service-client";
import { logger as rootLogger } from "../lib/logger";
import {
  DeploymentRepository,
  type DeploymentStatus,
} from "../repositories/deployment.repository";
import { BuildService } from "../services/build.service";
import { CloneService } from "../services/clone.service";
import { UploadService, outputKeyPrefix } from "../services/upload.service";
import { DeploymentError } from "../utils/deployment-error";
import { resolveInside } from "../utils/resolve-inside";

export type PipelineResult = "ready" | "skipped";

const advance = async (
  deploymentId: string,
  status: DeploymentStatus,
  step: DeploymentStep,
  changes?: Parameters<typeof DeploymentRepository.transition>[2],
): Promise<void> => {
  const applied = await DeploymentRepository.transition(
    deploymentId,
    status,
    changes,
  );

  if (!applied) {
    throw new DeploymentError(
      step,
      "deployment was finalized by another process",
    );
  }
};

export const runDeploymentPipeline = async (params: {
  deploymentId: string;
  userId: string;
}): Promise<PipelineResult> => {
  const { deploymentId, userId } = params;
  const logger = rootLogger.child({ deploymentId });
  const workspace = path.resolve(env.OUTPUT_DIR, deploymentId);

  try {
    const record = await DeploymentRepository.findWithProject(deploymentId);

    if (!record) {
      throw new DeploymentError(
        DeploymentStep.INITIALIZE,
        "deployment does not exist",
      );
    }

    const { deployment, project } = record;

    if (deployment.status !== "queued") {
      logger.warn(
        { status: deployment.status },
        "deployment is not queued, skipping",
      );
      return "skipped";
    }

    if (project.userId !== userId) {
      throw new DeploymentError(
        DeploymentStep.INITIALIZE,
        "deployment does not belong to this user",
      );
    }

    if (project.deletedAt) {
      throw new DeploymentError(
        DeploymentStep.INITIALIZE,
        "project has been deleted",
      );
    }

    const projectDir = resolveInside(workspace, deployment.rootDirectory);
    const outputDir = projectDir
      ? resolveInside(projectDir, deployment.outputDirectory)
      : undefined;

    if (!projectDir || !outputDir) {
      throw new DeploymentError(
        DeploymentStep.INITIALIZE,
        "root or output directory points outside the repository",
      );
    }

    logger.info({ step: DeploymentStep.CLONE }, "cloning repository");
    await advance(deploymentId, "cloning", DeploymentStep.CLONE);
    const token = await AuthServiceClient.getGithubToken(userId);
    const commitSha = await CloneService.clone({
      repositoryUrl: project.repositoryUrl,
      branch: deployment.branch,
      token,
      destination: workspace,
    });
    logger.info({ commitSha }, "repository cloned");

    await advance(deploymentId, "installing", DeploymentStep.INSTALL, {
      commitSha,
    });
    logger.info({ step: DeploymentStep.INSTALL }, "installing dependencies");
    await BuildService.run({
      step: DeploymentStep.INSTALL,
      command: deployment.installCommand,
      cwd: projectDir,
      logger,
    });

    await advance(deploymentId, "building", DeploymentStep.BUILD);
    logger.info({ step: DeploymentStep.BUILD }, "building project");
    await BuildService.run({
      step: DeploymentStep.BUILD,
      command: deployment.buildCommand,
      cwd: projectDir,
      logger,
    });

    await advance(deploymentId, "uploading", DeploymentStep.UPLOAD);
    logger.info({ step: DeploymentStep.UPLOAD }, "uploading build output");
    const uploaded = await UploadService.uploadDirectory({
      deploymentId,
      directory: outputDir,
      logger,
    });
    logger.info(
      { files: uploaded, prefix: outputKeyPrefix(deploymentId) },
      "build output uploaded",
    );

    if (!(await DeploymentRepository.markReady(deploymentId))) {
      throw new DeploymentError(
        DeploymentStep.FINALIZE,
        "deployment was finalized by another process",
      );
    }

    logger.info("deployment is ready");
    return "ready";
  } catch (err) {
    const message =
      err instanceof DeploymentError
        ? `[${err.step}] ${err.message}`
        : "unexpected error during deployment";

    logger.error({ err }, "deployment failed");
    await DeploymentRepository.markFailed(deploymentId, message).catch(
      (markErr: unknown) =>
        logger.error({ err: markErr }, "failed to mark deployment as failed"),
    );
    throw err;
  } finally {
    await rm(workspace, { recursive: true, force: true }).catch(
      (rmErr: unknown) =>
        logger.warn({ err: rmErr }, "failed to clean up workspace"),
    );
  }
};
