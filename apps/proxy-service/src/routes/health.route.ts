import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { checkPostgresConnection } from "../lib/postgres";

export const HealthMessage = {
  HEALTH_OK: "Service is healthy",
  SERVICE_UNAVAILABLE: "Service is temporarily unavailable",
} as const;

export const healthRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  const postgresHealthy = await checkPostgresConnection();
  const statusCode = postgresHealthy
    ? StatusCodes.OK
    : StatusCodes.SERVICE_UNAVAILABLE;

  res.status(statusCode).json({
    success: postgresHealthy,
    statusCode,
    message: postgresHealthy
      ? HealthMessage.HEALTH_OK
      : HealthMessage.SERVICE_UNAVAILABLE,
    data: {
      postgres: postgresHealthy ? "up" : "down",
      uptime: process.uptime(),
    },
  });
});
