import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "../utils/api-error";
import { logger } from "./logger";

export const GITHUB_API_URL = "https://api.github.com";
export const GITHUB_RAW_URL = "https://raw.githubusercontent.com";

export const githubUnavailableError = (): ApiError =>
  new ApiError(
    StatusCodes.SERVICE_UNAVAILABLE,
    ErrorMessage.GITHUB_UNAVAILABLE,
    ErrorCode.SERVICE_UNAVAILABLE,
  );

export const githubFetch = async (url: string): Promise<Response> => {
  try {
    return await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(env.GITHUB_API_TIMEOUT_MS),
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "react-deployment-platform-project-service",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
  } catch (err) {
    logger.error({ err }, "github request could not be completed");
    throw githubUnavailableError();
  }
};
