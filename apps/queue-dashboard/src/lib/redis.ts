import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

export const createBullConnection = (): Redis => {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

  connection.on("error", (err) => {
    logger.error({ err }, "queue dashboard redis connection error");
  });

  return connection;
};

export const redisClient = createBullConnection();

export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    const reply = await redisClient.ping();
    return reply === "PONG";
  } catch (err) {
    logger.error({ err }, "redis health check failed");
    return false;
  }
};
