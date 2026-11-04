import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

const commaSeparatedList = z.string().transform((value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0),
);

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

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
    ECS_TASK_DEFINITION: z.string().min(1),
    ECS_CONTAINER_NAME: z.string().min(1).default("deployment-service"),
    ECS_SUBNET_IDS: commaSeparatedList.pipe(z.array(z.string()).min(1)),
    ECS_SECURITY_GROUP_IDS: commaSeparatedList.default([]),
    ECS_ASSIGN_PUBLIC_IP: z.enum(["ENABLED", "DISABLED"]).default("ENABLED"),

    DEPLOYMENT_WORKER_CONCURRENCY: z.coerce
      .number()
      .int()
      .positive()
      .default(1),
    DEPLOYMENT_LOCK_TTL_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 60),
    DEPLOYMENT_LOCK_RETRY_DELAY_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10_000),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
