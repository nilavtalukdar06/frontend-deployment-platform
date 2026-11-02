import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "../utils/api-error";

export const payloadTooLargeError = (): ApiError =>
  new ApiError(
    StatusCodes.REQUEST_TOO_LONG,
    ErrorMessage.PAYLOAD_TOO_LARGE,
    ErrorCode.PAYLOAD_TOO_LARGE,
    { maxBytes: env.MAX_REQUEST_BODY_BYTES },
  );

export const bodyLimit = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const contentLength = Number(req.headers["content-length"]);

  if (
    Number.isFinite(contentLength) &&
    contentLength > env.MAX_REQUEST_BODY_BYTES
  ) {
    next(payloadTooLargeError());
    return;
  }

  next();
};
