import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "../utils/api-error";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(
    new ApiError(
      StatusCodes.NOT_FOUND,
      ErrorMessage.NOT_FOUND,
      ErrorCode.NOT_FOUND,
      { path: req.originalUrl },
    ),
  );
};
