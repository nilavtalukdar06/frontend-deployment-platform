import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import {
  GITHUB_API_URL,
  githubFetch,
  githubUnavailableError,
} from "../lib/github";
import { logger } from "../lib/logger";

export interface GithubRepositoryRef {
  owner: string;
  name: string;
}

export interface GithubRepository {
  id: number;
  ref: GithubRepositoryRef;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  url: string;
  defaultBranch: string;
  pushedAt: string | null;
  canPush: boolean;
}

export interface GithubRepositoryPage {
  repositories: GithubRepository[];
  hasNextPage: boolean;
}

const REPOSITORIES_PER_PAGE = 30;

const repositorySchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  full_name: z.string().min(1),
  owner: z.object({ login: z.string().min(1) }),
  description: z.string().nullable(),
  private: z.boolean(),
  html_url: z.url(),
  default_branch: z.string().min(1),
  pushed_at: z.string().nullable(),
  archived: z.boolean(),
  disabled: z.boolean(),
  permissions: z.object({ push: z.boolean() }).optional(),
});

type RepositoryResponse = z.infer<typeof repositorySchema>;

export abstract class GithubService {
  static async listPushableRepositories(
    accessToken: string,
    page: number,
  ): Promise<GithubRepositoryPage> {
    const url = new URL(`${GITHUB_API_URL}/user/repos`);
    url.search = new URLSearchParams({
      affiliation: "owner,collaborator,organization_member",
      sort: "pushed",
      direction: "desc",
      per_page: String(REPOSITORIES_PER_PAGE),
      page: String(page),
    }).toString();

    const response = await githubFetch(url.toString(), accessToken);
    GithubService.assertOk(response, "github repository listing failed");

    const parsed = z.array(repositorySchema).safeParse(await response.json());

    if (!parsed.success) {
      logger.error({ err: parsed.error }, "unexpected github response shape");
      throw githubUnavailableError();
    }

    return {
      repositories: parsed.data
        .map(GithubService.toRepository)
        .filter(GithubService.isImportable),
      hasNextPage: /rel="next"/.test(response.headers.get("link") ?? ""),
    };
  }

  static async getRepository(
    accessToken: string,
    repositoryId: number,
  ): Promise<GithubRepository | undefined> {
    const response = await githubFetch(
      `${GITHUB_API_URL}/repositories/${repositoryId}`,
      accessToken,
    );

    if (
      response.status === StatusCodes.NOT_FOUND ||
      response.status === StatusCodes.FORBIDDEN
    ) {
      if (response.headers.get("x-ratelimit-remaining") !== "0") {
        return undefined;
      }
    }

    GithubService.assertOk(response, "github repository lookup failed");

    const parsed = repositorySchema.safeParse(await response.json());

    if (!parsed.success) {
      logger.error({ err: parsed.error }, "unexpected github response shape");
      throw githubUnavailableError();
    }

    const repository = GithubService.toRepository(parsed.data);

    return GithubService.isImportable(repository) ? repository : undefined;
  }

  private static toRepository(data: RepositoryResponse): GithubRepository & {
    archived: boolean;
    disabled: boolean;
  } {
    return {
      id: data.id,
      ref: { owner: data.owner.login, name: data.name },
      name: data.name,
      fullName: data.full_name,
      description: data.description,
      private: data.private,
      url: data.html_url,
      defaultBranch: data.default_branch,
      pushedAt: data.pushed_at,
      canPush: data.permissions?.push === true,
      archived: data.archived,
      disabled: data.disabled,
    };
  }

  private static isImportable(
    repository: GithubRepository & { archived: boolean; disabled: boolean },
  ): boolean {
    return repository.canPush && !repository.archived && !repository.disabled;
  }

  private static assertOk(response: Response, message: string): void {
    if (!response.ok) {
      logger.error(
        {
          status: response.status,
          rateLimitRemaining: response.headers.get("x-ratelimit-remaining"),
        },
        message,
      );
      throw githubUnavailableError();
    }
  }
}
