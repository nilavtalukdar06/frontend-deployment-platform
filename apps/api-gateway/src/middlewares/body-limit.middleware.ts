import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { isWebhookRoute } from "../config/webhook-routes";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "@repo/http";

export const payloadTooLargeError = (
  maxBytes: number = env.MAX_REQUEST_BODY_BYTES,
): ApiError =>
  new ApiError(
    StatusCodes.REQUEST_TOO_LONG,
    ErrorMessage.PAYLOAD_TOO_LARGE,
    ErrorCode.PAYLOAD_TOO_LARGE,
    { maxBytes },
  );

export const createBodyLimit =
  (maxBytes: number) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = Number(req.headers["content-length"]);

    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      next(payloadTooLargeError(maxBytes));
      return;
    }

    next();
  };

const defaultBodyLimit = createBodyLimit(env.MAX_REQUEST_BODY_BYTES);

export const bodyLimit = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (isWebhookRoute(req)) {
    next();
    return;
  }

  defaultBodyLimit(req, res, next);
};
