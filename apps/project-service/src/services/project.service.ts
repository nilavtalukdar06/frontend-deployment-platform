import { randomInt } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import type { Project } from "../db/schema";
import { ErrorCode } from "../constants/error-code.enum";
import { SLUG_ADJECTIVES, SLUG_NOUNS } from "../constants/slug-words";
import { ErrorMessage } from "../constants/response-message.enum";
import {
  ProjectRepository,
  type ProjectChanges,
} from "../repositories/project.repository";
import { ApiError } from "../utils/api-error";
import { GithubService, type GithubRepositoryRef } from "./github.service";

export interface PublicProject {
  id: string;
  slug: string;
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

export interface CreateProjectInput {
  gitUrl: GithubRepositoryRef;
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
const MAX_SLUG_ATTEMPTS = 10;

export abstract class ProjectService {
  static toPublicProject(project: Project): PublicProject {
    return {
      id: project.id,
      slug: project.slug,
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

  static async create(
    userId: string,
    { gitUrl }: CreateProjectInput,
  ): Promise<PublicProject> {
    const repository = await GithubService.getPublicRepository(gitUrl);

    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
      const slug = ProjectService.generateSlug();

      try {
        const project = await ProjectRepository.create({
          userId,
          slug,
          name: repository.name,
          description: repository.description,
          repositoryUrl: repository.url,
          branch: repository.defaultBranch,
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

  private static projectNotFound(): ApiError {
    return new ApiError(
      StatusCodes.NOT_FOUND,
      ErrorMessage.PROJECT_NOT_FOUND,
      ErrorCode.NOT_FOUND,
    );
  }

  private static generateSlug(): string {
    const adjective = SLUG_ADJECTIVES[randomInt(SLUG_ADJECTIVES.length)];
    const noun = SLUG_NOUNS[randomInt(SLUG_NOUNS.length)];

    return `${adjective}-${noun}`;
  }

  private static mapWriteError(err: unknown): unknown {
    if (ProjectService.uniqueViolationConstraint(err) !== undefined) {
      return new ApiError(
        StatusCodes.CONFLICT,
        ErrorMessage.PROJECT_NAME_ALREADY_EXISTS,
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
