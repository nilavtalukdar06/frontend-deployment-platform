import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "../utils/api-error";
import { logger } from "./logger";

export const GITHUB_API_URL = "https://api.github.com";
export const GITHUB_JSON = "application/vnd.github+json";
export const GITHUB_RAW = "application/vnd.github.raw+json";

export const githubUnavailableError = (): ApiError =>
  new ApiError(
    StatusCodes.SERVICE_UNAVAILABLE,
    ErrorMessage.GITHUB_UNAVAILABLE,
    ErrorCode.SERVICE_UNAVAILABLE,
  );

export const githubFetch = async (
  url: string,
  accessToken: string,
  accept: string = GITHUB_JSON,
): Promise<Response> => {
  let response: Response;

  try {
    response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(env.GITHUB_API_TIMEOUT_MS),
      headers: {
        Accept: accept,
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "react-deployment-platform-project-service",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (err) {
    logger.error({ err }, "github request could not be completed");
    throw githubUnavailableError();
  }

  if (response.status === StatusCodes.UNAUTHORIZED) {
    await response.body?.cancel();
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      ErrorMessage.GITHUB_AUTH_REQUIRED,
      ErrorCode.GITHUB_AUTH_REQUIRED,
    );
  }

  return response;
};
