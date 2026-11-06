import Redis, { type RedisOptions } from "ioredis";
import type { Logger } from "pino";

export interface CreateRedisOptions {
  url: string;
  logger: Logger;
  options?: RedisOptions;
}

export const createRedis = ({ url, logger, options }: CreateRedisOptions) => {
  const redisClient = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    ...options,
  });

  redisClient.on("connect", () => {
    logger.info("redis connected");
  });

  redisClient.on("error", (err) => {
    logger.error({ err }, "redis connection error");
  });

  const checkRedisConnection = async (): Promise<boolean> => {
    try {
      const pong = await redisClient.ping();
      return pong === "PONG";
    } catch (err) {
      logger.error({ err }, "redis health check failed");
      return false;
    }
  };

  return { redisClient, checkRedisConnection };
};
