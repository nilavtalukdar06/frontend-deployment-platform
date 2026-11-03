import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { logger } from "../lib/logger";
import { ApiError } from "../utils/api-error";

export interface GithubRepositoryRef {
  owner: string;
  name: string;
}

export interface PublicRepository {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  defaultBranch: string;
}

const GITHUB_API_URL = "https://api.github.com";

const repositoryResponseSchema = z.object({
  name: z.string().min(1),
  full_name: z.string().min(1),
  description: z.string().nullable(),
  html_url: z.url(),
  default_branch: z.string().min(1),
  private: z.boolean(),
});

export abstract class GithubService {
  static async getPublicRepository({
    owner,
    name,
  }: GithubRepositoryRef): Promise<PublicRepository> {
    const response = await GithubService.fetchRepository(owner, name);

    if (
      response.status === StatusCodes.NOT_FOUND ||
      response.status === StatusCodes.MOVED_PERMANENTLY
    ) {
      throw GithubService.invalidRepository();
    }

    if (!response.ok) {
      logger.error(
        {
          status: response.status,
          rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
        },
        "github repository lookup failed",
      );
      throw GithubService.unavailable();
    }

    const parsed = repositoryResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      logger.error({ err: parsed.error }, "unexpected github response shape");
      throw GithubService.unavailable();
    }

    if (parsed.data.private) {
      throw GithubService.invalidRepository();
    }

    return {
      name: parsed.data.name,
      fullName: parsed.data.full_name,
      description: parsed.data.description,
      url: parsed.data.html_url,
      defaultBranch: parsed.data.default_branch,
    };
  }

  private static async fetchRepository(
    owner: string,
    name: string,
  ): Promise<Response> {
    try {
      return await fetch(
        `${GITHUB_API_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
        {
          redirect: "manual",
          signal: AbortSignal.timeout(env.GITHUB_API_TIMEOUT_MS),
          headers: {
            Accept: "application/vnd.github+json",
            "User-Agent": "react-deployment-platform-project-service",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        },
      );
    } catch (err) {
      logger.error({ err }, "github repository lookup could not be completed");
      throw GithubService.unavailable();
    }
  }

  private static invalidRepository(): ApiError {
    return new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      ErrorMessage.INVALID_REPOSITORY,
      ErrorCode.INVALID_REPOSITORY,
    );
  }

  private static unavailable(): ApiError {
    return new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      ErrorMessage.GITHUB_UNAVAILABLE,
      ErrorCode.SERVICE_UNAVAILABLE,
    );
  }
}
