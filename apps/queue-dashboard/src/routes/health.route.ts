import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { checkRedisConnection } from "../lib/redis";

export const HealthMessage = {
  HEALTH_OK: "Service is healthy",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable",
} as const;

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const redisHealthy = await checkRedisConnection();
  const statusCode = redisHealthy
    ? StatusCodes.OK
    : StatusCodes.SERVICE_UNAVAILABLE;

  res.status(statusCode).json({
    success: redisHealthy,
    statusCode,
    message: redisHealthy
      ? HealthMessage.HEALTH_OK
      : HealthMessage.SERVICE_UNAVAILABLE,
    data: {
      redis: redisHealthy ? "up" : "down",
      uptime: process.uptime(),
    },
  });
});
