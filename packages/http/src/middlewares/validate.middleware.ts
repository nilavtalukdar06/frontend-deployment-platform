import type { NextFunction, Request, RequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z, ZodError, type ZodType } from "zod";
import { ApiError } from "../api-error";
import { HttpErrorCode, HttpErrorMessage } from "../http-error";

export interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

export const validate =
  (schemas: ValidationSchemas): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as Request["query"];
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            HttpErrorMessage.VALIDATION_ERROR,
            HttpErrorCode.VALIDATION_ERROR,
            z.treeifyError(err),
          ),
        );
        return;
      }

      next(err);
    }
  };
