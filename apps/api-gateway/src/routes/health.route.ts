import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { authService } from "../config/services";
import { checkRedisConnection } from "../lib/redis";
import { checkServiceHealth } from "../lib/service-health";
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
    const [redisHealthy, authServiceHealthy] = await Promise.all([
      checkRedisConnection(),
      checkServiceHealth(authService),
    ]);

    const isHealthy = redisHealthy && authServiceHealthy;
    const statusCode = isHealthy
      ? StatusCodes.OK
      : StatusCodes.SERVICE_UNAVAILABLE;

    const response = new ApiResponse(
      statusCode,
      isHealthy ? SuccessMessage.HEALTH_OK : ErrorMessage.SERVICE_UNAVAILABLE,
      {
        gateway: "up",
        redis: redisHealthy ? "up" : "down",
        authService: authServiceHealthy ? "up" : "down",
        uptime: process.uptime(),
      },
    );

    res.status(statusCode).json(response);
  }),
);
