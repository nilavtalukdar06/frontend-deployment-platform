import { frameworkList } from "@vercel/frameworks";
import { detectFramework } from "@vercel/fs-detectors";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../constants/error-code.enum";
import { RedisKeys } from "../constants/redis-keys";
import { ErrorMessage } from "../constants/response-message.enum";
import { GithubFilesystem } from "../lib/github-filesystem";
import { logger } from "../lib/logger";
import { redisClient } from "../lib/redis";
import { ApiError } from "../utils/api-error";
import type { GithubRepository, GithubRepositoryRef } from "./github.service";

export interface FrameworkSource {
  repository: GithubRepositoryRef;
  branch: string;
  rootDirectory: string;
}

const VITE_SLUG = "vite";
const ROOT_DIRECTORY = ".";
const DETECTION_CACHE_TTL_SECONDS = 24 * 60 * 60;

export abstract class FrameworkService {
  static async assertVite(
    { repository, branch, rootDirectory }: FrameworkSource,
    accessToken: string,
  ): Promise<void> {
    const fs = new GithubFilesystem(
      repository,
      branch,
      accessToken,
      rootDirectory,
    );

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

  static async isViteRepository(
    repository: GithubRepository,
    accessToken: string,
  ): Promise<boolean> {
    if (!repository.pushedAt) {
      return false;
    }

    const cacheKey = RedisKeys.viteDetection(
      repository.id,
      repository.defaultBranch,
      repository.pushedAt,
    );
    const cached = await FrameworkService.readCache(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const fs = new GithubFilesystem(
      repository.ref,
      repository.defaultBranch,
      accessToken,
      ROOT_DIRECTORY,
    );
    const isVite =
      (await fs.exists()) && (await FrameworkService.detect(fs)) === VITE_SLUG;

    await FrameworkService.writeCache(cacheKey, isVite);

    return isVite;
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

  private static async readCache(key: string): Promise<boolean | undefined> {
    try {
      const value = await redisClient.get(key);
      return value === null ? undefined : value === "1";
    } catch (err) {
      logger.warn({ err }, "vite detection cache read failed");
      return undefined;
    }
  }

  private static async writeCache(key: string, isVite: boolean): Promise<void> {
    try {
      await redisClient.set(
        key,
        isVite ? "1" : "0",
        "EX",
        DETECTION_CACHE_TTL_SECONDS,
      );
    } catch (err) {
      logger.warn({ err }, "vite detection cache write failed");
    }
  }
}
