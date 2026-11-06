import { RedisKeys } from "@repo/contracts";
import { redisClient } from "../lib/redis";

export abstract class SessionRepository {
  static async isBlacklisted(tokenId: string): Promise<boolean> {
    return (
      (await redisClient.exists(RedisKeys.blacklistedToken(tokenId))) === 1
    );
  }

  static async sessionExists(sessionId: string): Promise<boolean> {
    return (
      (await redisClient.exists(RedisKeys.refreshSession(sessionId))) === 1
    );
  }
}
