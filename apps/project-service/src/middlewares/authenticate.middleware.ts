import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "@repo/http";

export interface AuthenticatedUser {
  id: string;
}

const USER_ID_HEADER = "x-user-id";

const userIdSchema = z.uuid();

export abstract class AuthenticateMiddleware {
  static handle(req: Request, _res: Response, next: NextFunction): void {
    const parsed = userIdSchema.safeParse(req.headers[USER_ID_HEADER]);

    if (!parsed.success) {
      next(
        new ApiError(
          StatusCodes.UNAUTHORIZED,
          ErrorMessage.UNAUTHORIZED,
          ErrorCode.UNAUTHORIZED,
        ),
      );
      return;
    }

    req.user = { id: parsed.data };
    next();
  }
}
