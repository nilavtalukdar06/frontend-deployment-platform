import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";

export const ErrorMessage = {
  NOT_FOUND: "The requested resource could not be found",
  INTERNAL_SERVER_ERROR: "Something went wrong, please try again later",
} as const;

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    statusCode: StatusCodes.NOT_FOUND,
    message: ErrorMessage.NOT_FOUND,
  });
};

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  _next,
) => {
  req.log.error({ err }, "unhandled request error");

  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    message: ErrorMessage.INTERNAL_SERVER_ERROR,
  });
};
