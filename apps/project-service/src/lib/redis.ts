import { createRedis } from "@repo/redis";
import { env } from "../config/env";
import { logger } from "./logger";

export const { redisClient, checkRedisConnection } = createRedis({
  url: env.REDIS_URL,
  logger,
});
