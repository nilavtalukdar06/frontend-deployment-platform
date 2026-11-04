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

    DEPLOYMENT_ID: z.string().uuid().optional(),
    USER_ID: z.string().uuid().optional(),
    GITHUB_TOKEN_ENCRYPTED: z.string().min(1).optional(),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),

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

    KAFKA_BROKERS: commaSeparatedList.pipe(z.array(z.string()).min(1)),
    KAFKA_USERNAME: z.string().min(1),
    KAFKA_PASSWORD: z.string().min(1),
    KAFKA_SASL_MECHANISM: z
      .enum(["scram-sha-256", "scram-sha-512", "plain"])
      .default("scram-sha-256"),
    KAFKA_CA_CERT_PATH: z.string().min(1).default("ca.pem"),
    KAFKA_CLIENT_ID: z.string().min(1).default("deployment-service"),
    KAFKA_DEPLOYMENT_LOGS_TOPIC: z.string().min(1),

    DEPLOYMENT_LOG_BATCH_SIZE: z.coerce.number().int().positive().default(500),
    DEPLOYMENT_LOG_FLUSH_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(250),
    DEPLOYMENT_LOG_BUFFER_LIMIT: z.coerce
      .number()
      .int()
      .positive()
      .default(20_000),
    DEPLOYMENT_LOG_MAX_LINE_BYTES: z.coerce
      .number()
      .int()
      .positive()
      .default(8192),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
