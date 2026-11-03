import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(8080),

    ROOT_DOMAIN: z
      .string()
      .min(1)
      .transform((value) => value.toLowerCase().replace(/^\.+|\.+$/g, ""))
      .default("localhost"),

    DATABASE_URL: z.string().url(),

    AWS_REGION: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1).optional(),
    AWS_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    S3_BUCKET_NAME: z.string().min(1),

    DEPLOYMENT_CACHE_TTL_MS: z.coerce
      .number()
      .int()
      .nonnegative()
      .default(15_000),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
