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
    PORT: z.coerce.number().int().positive().default(4003),

    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),

    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1).default("auth-service"),
    JWT_AUDIENCE: z.string().min(1).default("react-deployment-platform"),

    KAFKA_BROKERS: commaSeparatedList.pipe(z.array(z.string()).min(1)),
    KAFKA_USERNAME: z.string().min(1),
    KAFKA_PASSWORD: z.string().min(1),
    KAFKA_SASL_MECHANISM: z
      .enum(["scram-sha-256", "scram-sha-512", "plain"])
      .default("scram-sha-256"),
    KAFKA_CA_CERT_PATH: z.string().min(1).default("ca.pem"),
    KAFKA_CLIENT_ID: z.string().min(1).default("realtime-service"),
    KAFKA_DEPLOYMENT_LOGS_TOPIC: z.string().min(1),
    KAFKA_CONSUMER_GROUP_ID: z.string().min(1).default("realtime-service"),
    KAFKA_CONSUMER_FROM_BEGINNING: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),

    CORS_ORIGIN: z.string().default("*"),
    SOCKET_MAX_SUBSCRIPTIONS_PER_CLIENT: z.coerce
      .number()
      .int()
      .positive()
      .default(10),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
