import Redis from "ioredis";
import { env } from "../config/env";
import { logger } from "./logger";

const attachLogging = (client: Redis, role: string): Redis => {
  client.on("error", (err) => {
    logger.error({ err, role }, "redis connection error");
  });
  return client;
};

export const redisClient = attachLogging(
  new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3 }),
  "commands",
);

export const redisPublisher = attachLogging(
  redisClient.duplicate(),
  "publisher",
);

export const redisSubscriber = attachLogging(
  redisClient.duplicate({ maxRetriesPerRequest: null }),
  "subscriber",
);

export const checkRedisConnection = async (): Promise<boolean> => {
  try {
    return (await redisClient.ping()) === "PONG";
  } catch (err) {
    logger.error({ err }, "redis health check failed");
    return false;
  }
};

export const closeRedis = async (): Promise<void> => {
  await Promise.all([
    redisClient.quit(),
    redisPublisher.quit(),
    redisSubscriber.quit(),
  ]);
};
