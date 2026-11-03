import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import {
  GITHUB_API_URL,
  githubFetch,
  githubUnavailableError,
} from "../lib/github";
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

const repositoryResponseSchema = z.object({
  name: z.string().min(1),
  full_name: z.string().min(1),
  description: z.string().nullable(),
  html_url: z.url(),
  default_branch: z.string().min(1),
  private: z.boolean(),
});

export abstract class GithubService {
  static toRepositoryRef(repositoryUrl: string): GithubRepositoryRef {
    const [owner = "", name = ""] = new URL(repositoryUrl).pathname
      .split("/")
      .filter(Boolean);

    return { owner, name };
  }

  static async getPublicRepository({
    owner,
    name,
  }: GithubRepositoryRef): Promise<PublicRepository> {
    const response = await githubFetch(
      `${GITHUB_API_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    );

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
      throw githubUnavailableError();
    }

    const parsed = repositoryResponseSchema.safeParse(await response.json());

    if (!parsed.success) {
      logger.error({ err: parsed.error }, "unexpected github response shape");
      throw githubUnavailableError();
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

  private static invalidRepository(): ApiError {
    return new ApiError(
      StatusCodes.UNPROCESSABLE_ENTITY,
      ErrorMessage.INVALID_REPOSITORY,
      ErrorCode.INVALID_REPOSITORY,
    );
  }
}
