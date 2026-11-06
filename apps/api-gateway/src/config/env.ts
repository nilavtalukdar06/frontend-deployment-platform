import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(3000),

    AUTH_SERVICE_URL: z.string().url().default("http://localhost:4000"),
    PROJECT_SERVICE_URL: z.string().url().default("http://localhost:4001"),
    REALTIME_SERVICE_URL: z.string().url().default("http://localhost:4003"),
    ANALYTICS_SERVICE_URL: z.string().url().default("http://localhost:4004"),
    LOGS_SERVICE_URL: z.string().url().default("http://localhost:4005"),

    REDIS_URL: z.string().url(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default("auth-service"),
    JWT_AUDIENCE: z.string().min(1).default("react-deployment-platform"),

    PROXY_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
    HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().default(3_000),

    MAX_REQUEST_BODY_BYTES: z.coerce.number().int().positive().default(65_536),
    MAX_WEBHOOK_BODY_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(5 * 1024 * 1024),

    CORS_ORIGIN: z.string().default("*"),

    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
    CREDENTIAL_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    CREDENTIAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
    WEBHOOK_RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 1000),
    WEBHOOK_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(600),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
