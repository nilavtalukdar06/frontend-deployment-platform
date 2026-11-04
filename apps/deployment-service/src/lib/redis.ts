import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

export const createRedisClient = (): Redis => {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5_000,
    lazyConnect: true,
  });

  client.on("error", (err) => {
    logger.error({ err }, "redis connection error");
  });

  return client;
};
