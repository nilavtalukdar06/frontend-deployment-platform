import { RedisKeys } from "../constants/redis-keys";
import { redisClient } from "../lib/redis";

export abstract class TokenRepository {
  static async isBlacklisted(tokenId: string): Promise<boolean> {
    const exists = await redisClient.exists(
      RedisKeys.blacklistedToken(tokenId),
    );
    return exists === 1;
  }

  static async sessionExists(sessionId: string): Promise<boolean> {
    const exists = await redisClient.exists(
      RedisKeys.refreshSession(sessionId),
    );
    return exists === 1;
  }
}
