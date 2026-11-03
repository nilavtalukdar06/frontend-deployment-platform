import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "../utils/api-error";
import { logger } from "./logger";

const githubTokenResponseSchema = z.object({
  data: z.object({ accessToken: z.string().min(1) }),
});

const unavailable = (): ApiError =>
  new ApiError(
    StatusCodes.SERVICE_UNAVAILABLE,
    ErrorMessage.SERVICE_UNAVAILABLE,
    ErrorCode.SERVICE_UNAVAILABLE,
  );

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
      throw unavailable();
    }

    if (response.status === StatusCodes.NOT_FOUND) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.GITHUB_AUTH_REQUIRED,
        ErrorCode.GITHUB_AUTH_REQUIRED,
      );
    }

    const parsed = githubTokenResponseSchema.safeParse(
      response.ok ? await response.json() : undefined,
    );

    if (!parsed.success) {
      logger.error(
        { status: response.status },
        "auth-service github token lookup failed",
      );
      throw unavailable();
    }

    return parsed.data.data.accessToken;
  }
}
