import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { logger } from "../lib/logger";
import { ApiError } from "../utils/api-error";

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const apiError =
    err instanceof ApiError
      ? err
      : new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          ErrorMessage.INTERNAL_SERVER_ERROR,
          ErrorCode.INTERNAL_SERVER_ERROR,
          undefined,
          false,
        );

  const logPayload = {
    err,
    requestId: req.id,
    statusCode: apiError.statusCode,
    errorCode: apiError.errorCode,
  };

  const log = req.log ?? logger;

  if (apiError.isOperational) {
    log.warn(logPayload, apiError.message);
  } else {
    log.error(logPayload, apiError.message);
  }

  res.status(apiError.statusCode).json({
    success: false,
    statusCode: apiError.statusCode,
    errorCode: apiError.errorCode,
    message: apiError.message,
    details: apiError.details,
    ...(env.NODE_ENV === "development" && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });
};
