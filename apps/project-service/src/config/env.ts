import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4001),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),

    AUTH_SERVICE_URL: z.string().url().default("http://localhost:4000"),
    AUTH_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(3_000),
    INTERNAL_API_KEY: z.string().min(32),

    ENV_ENCRYPTION_KEY: z
      .string()
      .refine((value) => Buffer.from(value, "base64").length === 32, {
        message: "must be 32 bytes encoded as base64",
      }),

    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),

    ECS_CLUSTER: z.string().min(1),

    S3_BUCKET_NAME: z.string().min(1),

    SITES_BASE_URL: z
      .string()
      .url()
      .refine((value) => new URL(value).pathname === "/", {
        message: "must be an origin without a path",
      })
      .default("http://localhost:8080"),

    GITHUB_API_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),

    PUBLIC_API_URL: z
      .string()
      .url()
      .refine((value) => new URL(value).pathname === "/", {
        message: "must be an origin without a path",
      })
      .default("http://localhost:3000"),
    WEBHOOK_MAX_BODY_BYTES: z.coerce
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
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    READ_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1200),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
