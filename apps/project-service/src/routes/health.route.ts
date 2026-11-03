import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { checkPostgresConnection } from "../lib/postgres";
import { checkRedisConnection } from "../lib/redis";
import { ApiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler";
import {
  SuccessMessage,
  ErrorMessage,
} from "../constants/response-message.enum";

export const healthRouter = Router();

healthRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const [postgresHealthy, redisHealthy] = await Promise.all([
      checkPostgresConnection(),
      checkRedisConnection(),
    ]);

    const isHealthy = postgresHealthy && redisHealthy;
    const statusCode = isHealthy
      ? StatusCodes.OK
      : StatusCodes.SERVICE_UNAVAILABLE;

    const response = new ApiResponse(
      statusCode,
      isHealthy ? SuccessMessage.HEALTH_OK : ErrorMessage.SERVICE_UNAVAILABLE,
      {
        postgres: postgresHealthy ? "up" : "down",
        redis: redisHealthy ? "up" : "down",
        uptime: process.uptime(),
      },
    );

    res.status(statusCode).json(response);
  }),
);
