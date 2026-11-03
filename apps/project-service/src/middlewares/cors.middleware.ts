import cors, { type CorsOptions } from "cors";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { StatusCodes } from "http-status-codes";

const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) =>
  origin.trim(),
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes("*") ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
      return;
    }

    callback(
      new ApiError(
        StatusCodes.FORBIDDEN,
        ErrorMessage.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        { origin },
      ),
    );
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86_400,
};

export const corsMiddleware = cors(corsOptions);
