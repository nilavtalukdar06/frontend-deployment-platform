import cors, { type CorsOptions } from "cors";
import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../api-error";
import { HttpErrorCode, HttpErrorMessage } from "../http-error";

export const createCorsMiddleware = (corsOrigin: string): RequestHandler => {
  const allowedOrigins = corsOrigin.split(",").map((origin) => origin.trim());

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
          HttpErrorMessage.FORBIDDEN,
          HttpErrorCode.FORBIDDEN,
          { origin },
        ),
      );
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86_400,
  };

  return cors(corsOptions);
};
