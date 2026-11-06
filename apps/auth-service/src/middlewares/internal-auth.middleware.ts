import { createHash, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "@repo/http";

const INTERNAL_API_KEY_HEADER = "x-internal-api-key";

const digest = (value: string): Buffer =>
  createHash("sha256").update(value).digest();

const expectedDigest = digest(env.INTERNAL_API_KEY);

export const internalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const presented = req.headers[INTERNAL_API_KEY_HEADER];

  if (
    typeof presented !== "string" ||
    !timingSafeEqual(digest(presented), expectedDigest)
  ) {
    next(
      new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      ),
    );
    return;
  }

  next();
};
