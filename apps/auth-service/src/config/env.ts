import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4000),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),

    CORS_ORIGIN: z.string().default("*"),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default("auth-service"),
    JWT_AUDIENCE: z.string().min(1).default("react-deployment-platform"),
    ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
    REFRESH_TOKEN_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(7 * 24 * 60 * 60),

    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOGIN_ATTEMPT_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(900),
    LOGIN_LOCK_SECONDS: z.coerce.number().int().positive().default(900),

    RATE_LIMIT_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
  createFinalSchema: (shape) =>
    z
      .object(shape)
      .refine((value) => value.JWT_ACCESS_SECRET !== value.JWT_REFRESH_SECRET, {
        message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ",
        path: ["JWT_REFRESH_SECRET"],
      }),
});

export type Env = typeof env;
