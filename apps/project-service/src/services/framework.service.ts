import { frameworkList } from "@vercel/frameworks";
import { detectFramework } from "@vercel/fs-detectors";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { GithubFilesystem } from "../lib/github-filesystem";
import { logger } from "../lib/logger";
import { ApiError } from "../utils/api-error";
import type { GithubRepositoryRef } from "./github.service";

export interface FrameworkSource {
  repository: GithubRepositoryRef;
  branch: string;
  rootDirectory: string;
}

const VITE_SLUG = "vite";

export abstract class FrameworkService {
  static async assertVite({
    repository,
    branch,
    rootDirectory,
  }: FrameworkSource): Promise<void> {
    const fs = new GithubFilesystem(repository, branch, rootDirectory);

    if (!(await fs.exists())) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        ErrorMessage.SOURCE_NOT_FOUND,
        ErrorCode.INVALID_REPOSITORY,
        { branch, rootDirectory },
      );
    }

    const detectedFramework = await FrameworkService.detect(fs);

    if (detectedFramework !== VITE_SLUG) {
      throw new ApiError(
        StatusCodes.UNPROCESSABLE_ENTITY,
        ErrorMessage.UNSUPPORTED_FRAMEWORK,
        ErrorCode.UNSUPPORTED_FRAMEWORK,
        { detectedFramework },
      );
    }
  }

  private static async detect(fs: GithubFilesystem): Promise<string | null> {
    try {
      return await detectFramework({ fs, frameworkList });
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }

      logger.warn({ err }, "framework detection failed");
      return null;
    }
  }
}
