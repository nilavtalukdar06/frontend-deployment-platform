import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
});

redisClient.on("error", (err) => {
  logger.error({ err }, "redis connection error");
});

export const createBullConnection = (): Redis => {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  connection.on("error", (err) => {
    logger.error({ err }, "deployment queue redis connection error");
  });

  return connection;
};
