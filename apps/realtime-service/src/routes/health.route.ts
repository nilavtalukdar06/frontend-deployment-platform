import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { checkPostgresConnection } from "../lib/postgres";
import { checkRedisConnection } from "../lib/redis";
import { ApiResponse } from "@repo/http";

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const [postgresHealthy, redisHealthy] = await Promise.all([
    checkPostgresConnection(),
    checkRedisConnection(),
  ]);

  const isHealthy = postgresHealthy && redisHealthy;
  const statusCode = isHealthy
    ? StatusCodes.OK
    : StatusCodes.SERVICE_UNAVAILABLE;

  res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      isHealthy ? "Service is healthy" : "Service is temporarily unavailable",
      {
        postgres: postgresHealthy ? "up" : "down",
        redis: redisHealthy ? "up" : "down",
        uptime: process.uptime(),
      },
    ),
  );
});
