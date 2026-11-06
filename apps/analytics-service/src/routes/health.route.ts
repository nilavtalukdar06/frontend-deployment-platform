import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse, asyncHandler } from "@repo/http";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { checkClickhouseConnection } from "../db/clickhouse";
import { checkPostgresConnection } from "../lib/postgres";

export const healthRouter = Router();

healthRouter.get(
  "/health",
  asyncHandler(async (_req, res) => {
    const [postgresHealthy, clickhouseHealthy] = await Promise.all([
      checkPostgresConnection(),
      checkClickhouseConnection(),
    ]);

    const isHealthy = postgresHealthy && clickhouseHealthy;
    const statusCode = isHealthy
      ? StatusCodes.OK
      : StatusCodes.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(
      new ApiResponse(
        statusCode,
        isHealthy ? SuccessMessage.HEALTH_OK : ErrorMessage.SERVICE_UNAVAILABLE,
        {
          postgres: postgresHealthy ? "up" : "down",
          clickhouse: clickhouseHealthy ? "up" : "down",
          uptime: process.uptime(),
        },
      ),
    );
  }),
);
