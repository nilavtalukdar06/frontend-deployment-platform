import { randomInt } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import type { Project } from "../db/schema";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { SLUG_ADJECTIVES, SLUG_NOUNS } from "../constants/slug-words";
import { ErrorMessage } from "../constants/response-message.enum";
import {
  ProjectRepository,
  type ProjectChanges,
} from "../repositories/project.repository";
import { ApiError } from "../utils/api-error";
import { FrameworkService } from "./framework.service";
import { AuthServiceClient } from "../lib/auth-service-client";
import { mapWithConcurrency } from "../utils/map-with-concurrency";
import { SecretCipher } from "../utils/secret-cipher";
import { DeploymentRunnerService } from "./deployment-runner.service";
import { GithubService, type GithubRepository } from "./github.service";

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
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnvironmentVariableInput {
  key: string;
  value: string;
}

export interface CreateProjectInput {
  repositoryId: number;
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

const POSTGRES_UNIQUE_VIOLATION = "23505";
const SLUG_UNIQUE_INDEX = "projects_slug_unique_idx";
const REPOSITORY_UNIQUE_INDEX =
  "projects_user_id_github_repository_id_active_unique_idx";
const DETECTION_CONCURRENCY = 6;
const MAX_SLUG_ATTEMPTS = 10;
const DEFAULT_ROOT_DIRECTORY = ".";
const SITES_BASE_URL = new URL(env.SITES_BASE_URL);

const siteUrlFor = (slug: string): string =>
  `${SITES_BASE_URL.protocol}//${slug}.${SITES_BASE_URL.host}`;

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
      installCommand: project.installCommand,
      buildCommand: project.buildCommand,
      outputDirectory: project.outputDirectory,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
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
      installCommand,
      buildCommand,
      environmentVariables = [],
    }: CreateProjectInput,
  ): Promise<PublicProject> {
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
            installCommand,
            buildCommand,
          },
          encryptedEnvironmentVariables,
        );

        await DeploymentRunnerService.start({
          deploymentId: deployment.id,
          userId,
          githubToken: accessToken,
        });

        return ProjectService.toPublicProject(project);
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
  ): Promise<ProjectList> {
    const { items, total } = await ProjectRepository.listByUser(
      userId,
      limit,
      (page - 1) * limit,
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
    if (changes.branch !== undefined || changes.rootDirectory !== undefined) {
      const current = await ProjectRepository.findById(id, userId);

      if (!current) {
        throw ProjectService.projectNotFound();
      }

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

    try {
      const project = await ProjectRepository.update(id, userId, changes);

      if (!project) {
        throw ProjectService.projectNotFound();
      }

      return ProjectService.toPublicProject(project);
    } catch (err) {
      throw ProjectService.mapWriteError(err);
    }
  }

  static async remove(userId: string, id: string): Promise<void> {
    const deleted = await ProjectRepository.softDelete(id, userId);

    if (!deleted) {
      throw ProjectService.projectNotFound();
    }
  }

  static projectNotFound(): ApiError {
    return new ApiError(
      StatusCodes.NOT_FOUND,
      ErrorMessage.PROJECT_NOT_FOUND,
      ErrorCode.NOT_FOUND,
    );
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
