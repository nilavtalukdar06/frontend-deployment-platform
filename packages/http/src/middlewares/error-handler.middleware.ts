import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import type {} from "pino-http";
import { ApiError } from "../api-error";
import { HttpErrorCode, HttpErrorMessage } from "../http-error";

export interface ErrorHandlerOptions {
  logger: Logger;
  exposeStack: boolean;
}

export const createGlobalErrorHandler =
  ({ logger, exposeStack }: ErrorHandlerOptions): ErrorRequestHandler =>
  (err: unknown, req, res, _next) => {
    const apiError =
      err instanceof ApiError
        ? err
        : new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            HttpErrorMessage.INTERNAL_SERVER_ERROR,
            HttpErrorCode.INTERNAL_SERVER_ERROR,
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
      ...(exposeStack && err instanceof Error ? { stack: err.stack } : {}),
    });
  };
