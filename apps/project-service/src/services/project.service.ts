import { randomBytes, randomInt } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import type { Deployment, Project } from "../db/schema";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import {
  commandUsesPackageManager,
  type PackageManager,
  PACKAGE_MANAGER_PRESETS,
} from "../constants/package-manager";
import {
  commandUsesRuntime,
  defaultBuildCommand,
  defaultRuntimeFor,
  type Runtime,
} from "../constants/runtime";
import { SLUG_ADJECTIVES, SLUG_NOUNS } from "../constants/slug-words";
import { ErrorMessage } from "../constants/response-message.enum";
import {
  ProjectRepository,
  type ProjectChanges,
} from "../repositories/project.repository";
import { DeploymentRepository } from "../repositories/deployment.repository";
import { ApiError } from "../utils/api-error";
import { FrameworkService } from "./framework.service";
import { AuthServiceClient } from "../lib/auth-service-client";
import { mapWithConcurrency } from "../utils/map-with-concurrency";
import { SecretCipher } from "../utils/secret-cipher";
import { logger } from "../lib/logger";
import { DeploymentLockService } from "./deployment-lock.service";
import { DeploymentQueueService } from "./deployment-queue.service";
import { DeploymentRunnerService } from "./deployment-runner.service";
import { DeploymentStorageService } from "./deployment-storage.service";
import {
  GithubService,
  type GithubRepository,
  type GithubRepositoryRef,
} from "./github.service";

export interface PublicProject {
  id: string;
  slug: string;
  url: string;
  githubRepositoryId: number;
  private: boolean;
  name: string;
  description: string | null;
  repositoryUrl: string;
  branch: string;
  framework: Project["framework"];
  rootDirectory: string;
  packageManager: Project["packageManager"];
  runtime: Project["runtime"];
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  autoDeploy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicDeployment {
  id: string;
  projectId: string;
  status: Deployment["status"];
  trigger: Deployment["trigger"];
  branch: string;
  commitSha: string | null;
  framework: Project["framework"];
  rootDirectory: string;
  packageManager: Project["packageManager"];
  runtime: Project["runtime"];
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  errorMessage: string | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentVariableInput {
  key: string;
  value: string;
}

export interface CreateProjectInput {
  repositoryId: number;
  packageManager: PackageManager;
  runtime?: Runtime;
  installCommand?: string;
  buildCommand?: string;
  environmentVariables?: EnvironmentVariableInput[];
}

export interface ImportableRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  defaultBranch: string;
  url: string;
  pushedAt: string | null;
  imported: boolean;
}

export interface ImportableRepositoryPage {
  items: ImportableRepository[];
  page: number;
  hasNextPage: boolean;
}

export interface ProjectList {
  items: PublicProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DeploymentList {
  items: PublicDeployment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const POSTGRES_UNIQUE_VIOLATION = "23505";
const SLUG_UNIQUE_INDEX = "projects_slug_unique_idx";
const REPOSITORY_UNIQUE_INDEX =
  "projects_user_id_github_repository_id_active_unique_idx";
const DETECTION_CONCURRENCY = 6;
const MAX_SLUG_ATTEMPTS = 10;
const PURGE_CONCURRENCY = 8;
const DEFAULT_ROOT_DIRECTORY = ".";
const SITES_BASE_URL = new URL(env.SITES_BASE_URL);

const WEBHOOK_SECRET_BYTES = 32;

const siteUrlFor = (slug: string): string =>
  `${SITES_BASE_URL.protocol}//${slug}.${SITES_BASE_URL.host}`;

const webhookUrlFor = (projectId: string): string =>
  new URL(
    `/webhooks/github/projects/${projectId}`,
    env.PUBLIC_API_URL,
  ).toString();

export abstract class ProjectService {
  static toPublicProject(project: Project): PublicProject {
    return {
      id: project.id,
      slug: project.slug,
      url: siteUrlFor(project.slug),
      githubRepositoryId: project.githubRepositoryId,
      private: project.private,
      name: project.name,
      description: project.description,
      repositoryUrl: project.repositoryUrl,
      branch: project.branch,
      framework: project.framework,
      rootDirectory: project.rootDirectory,
      packageManager: project.packageManager,
      runtime: project.runtime,
      installCommand: project.installCommand,
      buildCommand: project.buildCommand,
      outputDirectory: project.outputDirectory,
      autoDeploy: project.githubWebhookId !== null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  static toPublicDeployment(deployment: Deployment): PublicDeployment {
    return {
      id: deployment.id,
      projectId: deployment.projectId,
      status: deployment.status,
      trigger: deployment.trigger,
      branch: deployment.branch,
      commitSha: deployment.commitSha,
      framework: deployment.framework,
      rootDirectory: deployment.rootDirectory,
      packageManager: deployment.packageManager,
      runtime: deployment.runtime,
      installCommand: deployment.installCommand,
      buildCommand: deployment.buildCommand,
      outputDirectory: deployment.outputDirectory,
      errorMessage: deployment.errorMessage,
      startedAt: deployment.startedAt,
      finishedAt: deployment.finishedAt,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    };
  }

  static async listImportableRepositories(
    userId: string,
    page: number,
  ): Promise<ImportableRepositoryPage> {
    const accessToken = await AuthServiceClient.getGithubToken(userId);
    const { repositories, hasNextPage } =
      await GithubService.listPushableRepositories(accessToken, page);

    const viteFlags = await mapWithConcurrency(
      repositories,
      DETECTION_CONCURRENCY,
      (repository) =>
        FrameworkService.isViteRepository(repository, accessToken),
    );
    const viteRepositories = repositories.filter(
      (_repository, index) => viteFlags[index],
    );
    const importedIds = new Set(
      await ProjectRepository.findImportedRepositoryIds(
        userId,
        viteRepositories.map((repository) => repository.id),
      ),
    );

    return {
      items: viteRepositories.map((repository) => ({
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        description: repository.description,
        private: repository.private,
        defaultBranch: repository.defaultBranch,
        url: repository.url,
        pushedAt: repository.pushedAt,
        imported: importedIds.has(repository.id),
      })),
      page,
      hasNextPage,
    };
  }

  static async create(
    userId: string,
    {
      repositoryId,
      packageManager,
      runtime,
      installCommand,
      buildCommand,
      environmentVariables = [],
    }: CreateProjectInput,
  ): Promise<PublicProject> {
    const resolvedRuntime = runtime ?? defaultRuntimeFor(packageManager);
    const resolvedInstallCommand =
      installCommand ?? PACKAGE_MANAGER_PRESETS[packageManager].install;
    const resolvedBuildCommand =
      buildCommand ?? defaultBuildCommand(packageManager, resolvedRuntime);
    const accessToken = await AuthServiceClient.getGithubToken(userId);
    const repository = await ProjectService.requireRepository(
      accessToken,
      repositoryId,
    );

    await FrameworkService.assertVite(
      {
        repository: repository.ref,
        branch: repository.defaultBranch,
        rootDirectory: DEFAULT_ROOT_DIRECTORY,
      },
      accessToken,
    );

    const encryptedEnvironmentVariables = environmentVariables.map(
      ({ key, value }) => ({ key, value: SecretCipher.encrypt(value) }),
    );

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = ProjectService.generateSlug();

      try {
        const { project, deployment } = await ProjectRepository.create(
          {
            userId,
            slug,
            githubRepositoryId: repository.id,
            private: repository.private,
            name: repository.name,
            description: repository.description,
            repositoryUrl: repository.url,
            branch: repository.defaultBranch,
            framework: "vite",
            rootDirectory: DEFAULT_ROOT_DIRECTORY,
            packageManager,
            runtime: resolvedRuntime,
            installCommand: resolvedInstallCommand,
            buildCommand: resolvedBuildCommand,
          },
          encryptedEnvironmentVariables,
        );

        const withWebhook = await ProjectService.installWebhookSafely(
          project,
          accessToken,
          repository.ref,
        );

        await DeploymentQueueService.enqueue({
          deploymentId: deployment.id,
          userId,
        });

        return ProjectService.toPublicProject(withWebhook);
      } catch (err) {
        if (
          ProjectService.uniqueViolationConstraint(err) === SLUG_UNIQUE_INDEX
        ) {
          continue;
        }

        throw ProjectService.mapWriteError(err);
      }
    }

    throw new ApiError(
      StatusCodes.CONFLICT,
      ErrorMessage.CONFLICT,
      ErrorCode.CONFLICT,
    );
  }

  static async list(
    userId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<ProjectList> {
    const { items, total } = await ProjectRepository.listByUser(
      userId,
      limit,
      (page - 1) * limit,
      search,
    );

    return {
      items: items.map(ProjectService.toPublicProject),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async get(userId: string, id: string): Promise<PublicProject> {
    const project = await ProjectRepository.findById(id, userId);

    if (!project) {
      throw ProjectService.projectNotFound();
    }

    return ProjectService.toPublicProject(project);
  }

  static async update(
    userId: string,
    id: string,
    changes: ProjectChanges,
  ): Promise<PublicProject> {
    const touchesLocation =
      changes.branch !== undefined || changes.rootDirectory !== undefined;
    const touchesBuild =
      changes.packageManager !== undefined ||
      changes.runtime !== undefined ||
      changes.installCommand !== undefined ||
      changes.buildCommand !== undefined;

    let current: Project | undefined;

    if (touchesLocation || touchesBuild) {
      current = await ProjectRepository.findById(id, userId);

      if (!current) {
        throw ProjectService.projectNotFound();
      }
    }

    if (touchesLocation && current) {
      const accessToken = await AuthServiceClient.getGithubToken(userId);
      const repository = await ProjectService.requireRepository(
        accessToken,
        current.githubRepositoryId,
      );

      await FrameworkService.assertVite(
        {
          repository: repository.ref,
          branch: changes.branch ?? current.branch,
          rootDirectory: changes.rootDirectory ?? current.rootDirectory,
        },
        accessToken,
      );
    }

    const nextChanges = current
      ? ProjectService.resolveBuildSettingsChanges(changes, current)
      : changes;

    try {
      const project = await ProjectRepository.update(id, userId, nextChanges);

      if (!project) {
        throw ProjectService.projectNotFound();
      }

      return ProjectService.toPublicProject(project);
    } catch (err) {
      throw ProjectService.mapWriteError(err);
    }
  }

  static async remove(userId: string, id: string): Promise<void> {
    const deleted = await ProjectRepository.deleteWithCleanup(
      id,
      userId,
      (deployments) => ProjectService.purgeDeployments(deployments),
    );

    if (!deleted) {
      throw ProjectService.projectNotFound();
    }

    await Promise.all(
      deleted.deployments
        .filter((deployment) => DeploymentRepository.isActive(deployment))
        .map((deployment) =>
          DeploymentLockService.release(userId, deployment.id).catch(
            (err: unknown) =>
              logger.error(
                { err, deploymentId: deployment.id },
                "failed to release user deployment lock",
              ),
          ),
        ),
    );

    if (deleted.project.githubWebhookId !== null) {
      await ProjectService.removeWebhookSafely(
        deleted.project,
        deleted.project.githubWebhookId,
      );
    }
  }

  static async redeploy(userId: string, id: string): Promise<PublicDeployment> {
    const project = await ProjectService.requireOwnedProject(userId, id);

    await AuthServiceClient.getGithubToken(userId);

    const deployment = await DeploymentRepository.createForProject(project, {
      trigger: "manual",
    });

    if (!deployment) {
      throw ProjectService.projectNotFound();
    }

    await DeploymentQueueService.enqueue({
      deploymentId: deployment.id,
      userId,
    });

    return ProjectService.toPublicDeployment(deployment);
  }

  static async enableAutoDeploy(
    userId: string,
    id: string,
  ): Promise<PublicProject> {
    const project = await ProjectService.requireOwnedProject(userId, id);
    const accessToken = await AuthServiceClient.getGithubToken(userId);
    const repository = await ProjectService.requireRepository(
      accessToken,
      project.githubRepositoryId,
    );

    const updated = await ProjectService.installWebhook(
      project,
      accessToken,
      repository.ref,
    );

    if (!updated) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        ErrorMessage.WEBHOOK_PERMISSION_DENIED,
        ErrorCode.WEBHOOK_PERMISSION_DENIED,
      );
    }

    return ProjectService.toPublicProject(updated);
  }

  static async listDeployments(
    userId: string,
    id: string,
    page: number,
    limit: number,
  ): Promise<DeploymentList> {
    await ProjectService.requireOwnedProject(userId, id);

    const { items, total } = await DeploymentRepository.listByProject(
      id,
      limit,
      (page - 1) * limit,
    );

    return {
      items: items.map(ProjectService.toPublicDeployment),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getDeployment(
    userId: string,
    id: string,
    deploymentId: string,
  ): Promise<PublicDeployment> {
    await ProjectService.requireOwnedProject(userId, id);

    const deployment = await DeploymentRepository.findByIdForProject(
      deploymentId,
      id,
    );

    if (!deployment) {
      throw ProjectService.deploymentNotFound();
    }

    return ProjectService.toPublicDeployment(deployment);
  }

  static async cancelDeployment(
    userId: string,
    id: string,
    deploymentId: string,
  ): Promise<PublicDeployment> {
    await ProjectService.requireOwnedProject(userId, id);

    const existing = await DeploymentRepository.findByIdForProject(
      deploymentId,
      id,
    );

    if (!existing) {
      throw ProjectService.deploymentNotFound();
    }

    const canceled = await DeploymentRepository.markCanceled(deploymentId, id);

    if (!canceled) {
      throw new ApiError(
        StatusCodes.CONFLICT,
        ErrorMessage.DEPLOYMENT_NOT_CANCELABLE,
        ErrorCode.DEPLOYMENT_NOT_CANCELABLE,
      );
    }

    await Promise.all([
      DeploymentQueueService.remove(deploymentId),
      DeploymentRunnerService.stop(deploymentId),
    ]);
    await DeploymentLockService.release(userId, deploymentId).catch(
      (err: unknown) =>
        logger.error(
          { err, deploymentId },
          "failed to release user deployment lock",
        ),
    );

    return ProjectService.toPublicDeployment(canceled);
  }

  static projectNotFound(): ApiError {
    return new ApiError(
      StatusCodes.NOT_FOUND,
      ErrorMessage.PROJECT_NOT_FOUND,
      ErrorCode.NOT_FOUND,
    );
  }

  static deploymentNotFound(): ApiError {
    return new ApiError(
      StatusCodes.NOT_FOUND,
      ErrorMessage.DEPLOYMENT_NOT_FOUND,
      ErrorCode.NOT_FOUND,
    );
  }

  /**
   * Enforces a project's build settings on update: the install command must run
   * with its package manager and the build command must run on its runtime.
   * Rejects a command that does not, and resets a command to the appropriate
   * default when the caller switches package manager or runtime without
   * supplying a replacement command.
   */
  private static resolveBuildSettingsChanges(
    changes: ProjectChanges,
    current: Project,
  ): ProjectChanges {
    const next: ProjectChanges = { ...changes };
    const packageManager = changes.packageManager ?? current.packageManager;
    const runtime = changes.runtime ?? current.runtime;
    const switchingPackageManager =
      changes.packageManager !== undefined &&
      changes.packageManager !== current.packageManager;
    const switchingRuntime =
      changes.runtime !== undefined && changes.runtime !== current.runtime;

    if (changes.installCommand !== undefined) {
      if (!commandUsesPackageManager(changes.installCommand, packageManager)) {
        throw ProjectService.packageManagerCommandMismatch(packageManager);
      }
    } else if (switchingPackageManager) {
      next.installCommand = PACKAGE_MANAGER_PRESETS[packageManager].install;
    }

    if (changes.buildCommand !== undefined) {
      if (!commandUsesRuntime(changes.buildCommand, runtime)) {
        throw ProjectService.runtimeCommandMismatch(runtime);
      }
    } else if (switchingPackageManager || switchingRuntime) {
      next.buildCommand = defaultBuildCommand(packageManager, runtime);
    }

    return next;
  }

  private static packageManagerCommandMismatch(
    packageManager: PackageManager,
  ): ApiError {
    return new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      ErrorMessage.PACKAGE_MANAGER_COMMAND_MISMATCH,
      ErrorCode.PACKAGE_MANAGER_COMMAND_MISMATCH,
      { packageManager },
    );
  }

  private static runtimeCommandMismatch(runtime: Runtime): ApiError {
    return new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      ErrorMessage.RUNTIME_COMMAND_MISMATCH,
      ErrorCode.RUNTIME_COMMAND_MISMATCH,
      { runtime },
    );
  }

  private static async purgeDeployments(
    deployments: Deployment[],
  ): Promise<void> {
    const active = deployments.filter((deployment) =>
      DeploymentRepository.isActive(deployment),
    );

    await Promise.all(
      active.map((deployment) => DeploymentQueueService.remove(deployment.id)),
    );
    await mapWithConcurrency(active, PURGE_CONCURRENCY, (deployment) =>
      DeploymentRunnerService.stopAndWait(deployment.id),
    );
    await mapWithConcurrency(deployments, PURGE_CONCURRENCY, (deployment) =>
      DeploymentStorageService.deleteOutputs(deployment.id),
    );
  }

  private static async installWebhook(
    project: Project,
    accessToken: string,
    ref: GithubRepositoryRef,
  ): Promise<Project | undefined> {
    if (project.githubWebhookId !== null) {
      await GithubService.deleteWebhook(
        accessToken,
        ref,
        project.githubWebhookId,
      );
    }

    const secret = randomBytes(WEBHOOK_SECRET_BYTES).toString("hex");
    const hookId = await GithubService.createPushWebhook(accessToken, ref, {
      url: webhookUrlFor(project.id),
      secret,
    });

    if (hookId === undefined) {
      await ProjectRepository.setWebhook(project.id, null);
      return undefined;
    }

    const updated = await ProjectRepository.setWebhook(project.id, {
      githubWebhookId: hookId,
      githubWebhookSecret: SecretCipher.encrypt(secret),
    });

    if (!updated) {
      throw ProjectService.projectNotFound();
    }

    return updated;
  }

  private static async installWebhookSafely(
    project: Project,
    accessToken: string,
    ref: GithubRepositoryRef,
  ): Promise<Project> {
    try {
      const updated = await ProjectService.installWebhook(
        project,
        accessToken,
        ref,
      );

      if (!updated) {
        logger.warn(
          { projectId: project.id },
          "webhook not installed, user lacks admin access to the repository",
        );
      }

      return updated ?? project;
    } catch (err) {
      logger.error({ err, projectId: project.id }, "webhook install failed");
      return project;
    }
  }

  private static async removeWebhookSafely(
    project: Project,
    hookId: number,
  ): Promise<void> {
    try {
      const accessToken = await AuthServiceClient.getGithubToken(
        project.userId,
      );
      const repository = await GithubService.getRepository(
        accessToken,
        project.githubRepositoryId,
      );

      if (repository) {
        await GithubService.deleteWebhook(accessToken, repository.ref, hookId);
      }
    } catch (err) {
      logger.warn({ err, projectId: project.id }, "webhook removal failed");
    }
  }

  private static async requireOwnedProject(
    userId: string,
    id: string,
  ): Promise<Project> {
    const project = await ProjectRepository.findById(id, userId);

    if (!project) {
      throw ProjectService.projectNotFound();
    }

    return project;
  }

  private static async requireRepository(
    accessToken: string,
    repositoryId: number,
  ): Promise<GithubRepository> {
    const repository = await GithubService.getRepository(
      accessToken,
      repositoryId,
    );

    if (!repository) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        ErrorMessage.INVALID_REPOSITORY,
        ErrorCode.INVALID_REPOSITORY,
      );
    }

    return repository;
  }

  private static generateSlug(): string {
    const adjective = SLUG_ADJECTIVES[randomInt(SLUG_ADJECTIVES.length)];
    const noun = SLUG_NOUNS[randomInt(SLUG_NOUNS.length)];

    return `${adjective}-${noun}`;
  }

  private static mapWriteError(err: unknown): unknown {
    const constraint = ProjectService.uniqueViolationConstraint(err);

    if (constraint === REPOSITORY_UNIQUE_INDEX) {
      return new ApiError(
        StatusCodes.CONFLICT,
        ErrorMessage.REPOSITORY_ALREADY_IMPORTED,
        ErrorCode.REPOSITORY_ALREADY_IMPORTED,
      );
    }

    if (constraint !== undefined) {
      return new ApiError(
        StatusCodes.CONFLICT,
        ErrorMessage.CONFLICT,
        ErrorCode.CONFLICT,
      );
    }

    return err;
  }

  private static uniqueViolationConstraint(err: unknown): string | undefined {
    let current: unknown = err;

    for (let depth = 0; depth < 3 && current; depth += 1) {
      if (
        typeof current === "object" &&
        "code" in current &&
        current.code === POSTGRES_UNIQUE_VIOLATION
      ) {
        return "constraint" in current && typeof current.constraint === "string"
          ? current.constraint
          : "";
      }

      current =
        typeof current === "object" && "cause" in current
          ? current.cause
          : undefined;
    }

    return undefined;
  }
}
