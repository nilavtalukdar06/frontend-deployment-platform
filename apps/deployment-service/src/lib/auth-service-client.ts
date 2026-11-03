import { z } from "zod";
import { env } from "../config/env";
import { DeploymentStep } from "../constants/deployment-step.enum";
import { DeploymentError } from "../utils/deployment-error";
import { logger } from "./logger";

const githubTokenResponseSchema = z.object({
  data: z.object({ accessToken: z.string().min(1) }),
});

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
      throw new DeploymentError(
        DeploymentStep.CLONE,
        "auth service could not be reached",
        { cause: err },
      );
    }

    if (response.status === 404) {
      throw new DeploymentError(
        DeploymentStep.CLONE,
        "github account is not connected for this user",
      );
    }

    const parsed = githubTokenResponseSchema.safeParse(
      response.ok ? await response.json() : undefined,
    );

    if (!parsed.success) {
      logger.error(
        { status: response.status },
        "auth service github token lookup failed",
      );
      throw new DeploymentError(
        DeploymentStep.CLONE,
        "failed to retrieve github access token",
      );
    }

    return parsed.data.data.accessToken;
  }
}
