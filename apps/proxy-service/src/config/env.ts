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

    KAFKA_BROKERS: commaSeparatedList.pipe(z.array(z.string()).min(1)),
    KAFKA_USERNAME: z.string().min(1),
    KAFKA_PASSWORD: z.string().min(1),
    KAFKA_SASL_MECHANISM: z
      .enum(["scram-sha-256", "scram-sha-512", "plain"])
      .default("scram-sha-256"),
    KAFKA_CA_CERT_PATH: z.string().min(1).default("ca.pem"),
    KAFKA_CLIENT_ID: z.string().min(1).default("proxy-service"),
    KAFKA_ANALYTICS_TOPIC: z.string().min(1).default("analytics"),
    KAFKA_CONSUMER_GROUP_ID: z
      .string()
      .min(1)
      .default("proxy-service-analytics"),
    KAFKA_CONSUMER_FROM_BEGINNING: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),

    CLICKHOUSE_URL: z.url(),
    CLICKHOUSE_USERNAME: z.string().min(1),
    CLICKHOUSE_PASSWORD: z.string().min(1),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
