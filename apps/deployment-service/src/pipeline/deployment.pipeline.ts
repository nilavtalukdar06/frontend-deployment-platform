import { rm } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env";
import { DeploymentStep } from "../constants/deployment-step.enum";
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
import { SecretCipher } from "../utils/secret-cipher";

export type PipelineResult = "ready" | "skipped";

const loadEnvironmentVariables = async (
  projectId: string,
): Promise<Record<string, string>> => {
  const rows = await DeploymentRepository.findEnvironmentVariables(projectId);

  try {
    return Object.fromEntries(
      rows.map(({ key, value }) => [key, SecretCipher.decrypt(value)]),
    );
  } catch (err) {
    throw new DeploymentError(
      DeploymentStep.INITIALIZE,
      "environment variables could not be decrypted",
      { cause: err },
    );
  }
};

const decryptGithubToken = (encryptedGithubToken: string): string => {
  try {
    return SecretCipher.decrypt(encryptedGithubToken);
  } catch (err) {
    throw new DeploymentError(
      DeploymentStep.INITIALIZE,
      "github access token could not be decrypted",
      { cause: err },
    );
  }
};

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
  encryptedGithubToken: string;
}): Promise<PipelineResult> => {
  const { deploymentId, userId, encryptedGithubToken } = params;
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

    const token = decryptGithubToken(encryptedGithubToken);
    const environmentVariables = await loadEnvironmentVariables(project.id);
    logger.info(
      { keys: Object.keys(environmentVariables) },
      "environment variables loaded",
    );

    logger.info({ step: DeploymentStep.CLONE }, "cloning repository");
    await advance(deploymentId, "cloning", DeploymentStep.CLONE);
    const commitSha = await CloneService.clone({
      repositoryUrl: project.repositoryUrl,
      branch: deployment.branch,
      commitSha: deployment.commitSha,
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
      environmentVariables,
      logger,
    });

    await advance(deploymentId, "building", DeploymentStep.BUILD);
    logger.info({ step: DeploymentStep.BUILD }, "building project");
    await BuildService.run({
      step: DeploymentStep.BUILD,
      command: deployment.buildCommand,
      cwd: projectDir,
      environmentVariables,
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
