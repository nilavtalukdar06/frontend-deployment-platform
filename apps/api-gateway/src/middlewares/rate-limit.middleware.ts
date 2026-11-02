import { rateLimit } from "express-rate-limit";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) => {
    next(
      new ApiError(
        StatusCodes.TOO_MANY_REQUESTS,
        ErrorMessage.TOO_MANY_REQUESTS,
        ErrorCode.TOO_MANY_REQUESTS,
      ),
    );
  },
});
