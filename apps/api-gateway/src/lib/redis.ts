import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  commandTimeout: 2_000,
  lazyConnect: false,
});

redisClient.on("connect", () => {
  logger.info("redis connected");
});

redisClient.on("error", (err) => {
  logger.error({ err }, "redis connection error");
});

export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    const pong = await redisClient.ping();
    return pong === "PONG";
  } catch (err) {
    logger.error({ err }, "redis health check failed");
    return false;
  }
};
