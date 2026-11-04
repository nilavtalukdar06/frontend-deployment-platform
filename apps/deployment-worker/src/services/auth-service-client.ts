import { z } from "zod";
import { env } from "../config/env";
import { logger } from "../lib/logger";

const githubTokenResponseSchema = z.object({
  data: z.object({ accessToken: z.string().min(1) }),
});

const NOT_FOUND = 404;

export class GithubAuthRequiredError extends Error {
  constructor() {
    super("github authorization is missing or was revoked");
    this.name = "GithubAuthRequiredError";
  }
}

export class AuthServiceUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super("auth-service is unavailable", options);
    this.name = "AuthServiceUnavailableError";
  }
}

export abstract class AuthServiceClient {
  static async getGithubToken(userId: string): Promise<string> {
    let response: Response;

    try {
      response = await fetch(
        new URL(
          `/internal/users/${encodeURIComponent(userId)}/github-token`,
          env.AUTH_SERVICE_URL,
        ),
        {
          headers: { "x-internal-api-key": env.INTERNAL_API_KEY },
          signal: AbortSignal.timeout(env.AUTH_SERVICE_TIMEOUT_MS),
        },
      );
    } catch (err) {
      logger.error({ err }, "auth-service could not be reached");
      throw new AuthServiceUnavailableError({ cause: err });
    }

    if (response.status === NOT_FOUND) {
      await response.body?.cancel();
      throw new GithubAuthRequiredError();
    }

    const parsed = githubTokenResponseSchema.safeParse(
      response.ok ? await response.json() : undefined,
    );

    if (!parsed.success) {
      logger.error(
        { status: response.status },
        "auth-service github token lookup failed",
      );
      throw new AuthServiceUnavailableError();
    }

    return parsed.data.data.accessToken;
  }
}
