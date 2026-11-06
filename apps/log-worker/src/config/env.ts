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

    KAFKA_BROKERS: commaSeparatedList.pipe(z.array(z.string()).min(1)),
    KAFKA_USERNAME: z.string().min(1),
    KAFKA_PASSWORD: z.string().min(1),
    KAFKA_SASL_MECHANISM: z
      .enum(["scram-sha-256", "scram-sha-512", "plain"])
      .default("scram-sha-256"),
    KAFKA_CA_CERT_PATH: z.string().min(1).default("ca.pem"),
    KAFKA_CLIENT_ID: z.string().min(1).default("log-worker"),
    KAFKA_DEPLOYMENT_LOGS_TOPIC: z.string().min(1),
    KAFKA_CONSUMER_GROUP_ID: z.string().min(1).default("log-worker"),
    KAFKA_CONSUMER_FROM_BEGINNING: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),
    CLICKHOUSE_URL: z.url(),
    CLICKHOUSE_USERNAME: z.string().min(1),
    CLICKHOUSE_PASSWORD: z.string().min(1),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
