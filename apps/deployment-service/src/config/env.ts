import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    DEPLOYMENT_ID: z.string().uuid().optional(),
    USER_ID: z.string().uuid().optional(),

    DATABASE_URL: z.string().url(),

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
    S3_BUCKET_NAME: z.string().min(1),

    OUTPUT_DIR: z.string().min(1).default("output"),
    BUILD_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000),
    UPLOAD_CONCURRENCY: z.coerce.number().int().positive().default(8),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
