import { rm } from "node:fs/promises";
import path from "node:path";
import { env } from "../config/env";
import { DeploymentStep } from "../constants/deployment-step.enum";
import { logger as rootLogger } from "../lib/logger";
import type { DeploymentLogCollector } from "../logging/deployment-log-collector";
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

const failureMessageOf = (err: unknown): string =>
  err instanceof DeploymentError
    ? `[${err.step}] ${err.message}`
    : "unexpected error during deployment";

const advance = async (
  collector: DeploymentLogCollector,
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

  collector.status(status);
};

const runStep = async <T>(
  collector: DeploymentLogCollector,
  step: DeploymentStep,
  task: () => Promise<T>,
): Promise<T> => {
  collector.stepStarted(step);

  try {
    const result = await task();
    collector.stepCompleted(step);
    return result;
  } catch (err) {
    collector.stepFailed(
      step,
      err instanceof DeploymentError
        ? err.message
        : "unexpected error during deployment",
    );
    throw err;
  }
};

export const runDeploymentPipeline = async (params: {
  deploymentId: string;
  userId: string;
  encryptedGithubToken: string;
  collector: DeploymentLogCollector;
}): Promise<PipelineResult> => {
  const { deploymentId, userId, encryptedGithubToken, collector } = params;
  const logger = rootLogger.child({ deploymentId });
  const workspace = path.resolve(env.OUTPUT_DIR, deploymentId);

  try {
    const initialized = await runStep(
      collector,
      DeploymentStep.INITIALIZE,
      async () => {
        collector.log(
          "info",
          DeploymentStep.INITIALIZE,
          "preparing deployment",
        );

        const record = await DeploymentRepository.findWithProject(deploymentId);

        if (!record) {
          throw new DeploymentError(
            DeploymentStep.INITIALIZE,
            "deployment does not exist",
          );
        }

        const { deployment, project } = record;

        if (deployment.status !== "queued") {
          collector.log(
            "warn",
            DeploymentStep.INITIALIZE,
            `deployment is ${deployment.status}, skipping`,
          );
          collector.status(deployment.status);
          return undefined;
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
        collector.setContext({ projectId: project.id, secrets: [token] });

        const environmentVariables = await loadEnvironmentVariables(project.id);
        collector.setContext({
          projectId: project.id,
          secrets: [token, ...Object.values(environmentVariables)],
        });

        const variableCount = Object.keys(environmentVariables).length;
        logger.info(
          { keys: Object.keys(environmentVariables) },
          "environment variables loaded",
        );
        collector.log(
          "info",
          DeploymentStep.INITIALIZE,
          `loaded ${variableCount} environment variable${variableCount === 1 ? "" : "s"}`,
        );

        return {
          deployment,
          project,
          projectDir,
          outputDir,
          token,
          environmentVariables,
        };
      },
    );

    if (!initialized) {
      return "skipped";
    }

    const {
      deployment,
      project,
      projectDir,
      outputDir,
      token,
      environmentVariables,
    } = initialized;

    await advance(collector, deploymentId, "cloning", DeploymentStep.CLONE);
    const commitSha = await runStep(
      collector,
      DeploymentStep.CLONE,
      async () => {
        const target = deployment.commitSha
          ? `commit ${deployment.commitSha}`
          : `branch ${deployment.branch}`;
        collector.log(
          "info",
          DeploymentStep.CLONE,
          `cloning ${project.repositoryUrl} (${target})`,
        );

        const sha = await CloneService.clone({
          repositoryUrl: project.repositoryUrl,
          branch: deployment.branch,
          commitSha: deployment.commitSha,
          token,
          destination: workspace,
        });

        collector.log("info", DeploymentStep.CLONE, `checked out ${sha}`);
        return sha;
      },
    );

    await advance(
      collector,
      deploymentId,
      "installing",
      DeploymentStep.INSTALL,
      {
        commitSha,
      },
    );
    await runStep(collector, DeploymentStep.INSTALL, () =>
      BuildService.run({
        step: DeploymentStep.INSTALL,
        command: deployment.installCommand,
        cwd: projectDir,
        environmentVariables,
        collector,
      }),
    );

    await advance(collector, deploymentId, "building", DeploymentStep.BUILD);
    await runStep(collector, DeploymentStep.BUILD, () =>
      BuildService.run({
        step: DeploymentStep.BUILD,
        command: deployment.buildCommand,
        cwd: projectDir,
        environmentVariables,
        collector,
      }),
    );

    await advance(collector, deploymentId, "uploading", DeploymentStep.UPLOAD);
    await runStep(collector, DeploymentStep.UPLOAD, async () => {
      const uploaded = await UploadService.uploadDirectory({
        deploymentId,
        directory: outputDir,
        logger,
        collector,
      });
      logger.info(
        { files: uploaded, prefix: outputKeyPrefix(deploymentId) },
        "build output uploaded",
      );
    });

    await runStep(collector, DeploymentStep.FINALIZE, async () => {
      if (!(await DeploymentRepository.markReady(deploymentId))) {
        throw new DeploymentError(
          DeploymentStep.FINALIZE,
          "deployment was finalized by another process",
        );
      }
    });

    collector.status("ready");
    collector.log("info", DeploymentStep.FINALIZE, "deployment is ready");
    return "ready";
  } catch (err) {
    const message = failureMessageOf(err);

    logger.error({ err }, "deployment failed");
    collector.status("failed", message);
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
