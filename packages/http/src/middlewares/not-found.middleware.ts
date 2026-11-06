import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../api-error";
import { HttpErrorCode, HttpErrorMessage } from "../http-error";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  next(
    new ApiError(
      StatusCodes.NOT_FOUND,
      HttpErrorMessage.NOT_FOUND,
      HttpErrorCode.NOT_FOUND,
      { path: req.originalUrl },
    ),
  );
};
