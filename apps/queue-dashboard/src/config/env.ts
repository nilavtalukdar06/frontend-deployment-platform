import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().positive().default(4002),

    REDIS_URL: z.string().url(),

    DASHBOARD_USERNAME: z.string().min(1),
    DASHBOARD_PASSWORD: z.string().min(8),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
      .default("info"),

    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
