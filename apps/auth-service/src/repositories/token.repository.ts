import { redisClient } from "../lib/redis";
import { RedisKeys } from "../constants/redis-keys";

const ROTATE_REFRESH_SCRIPT = `
local current = redis.call("GET", KEYS[1])
if not current then
  return 0
end
if current ~= ARGV[1] then
  return -1
end
redis.call("SET", KEYS[1], ARGV[2], "EX", tonumber(ARGV[3]))
return 1
`;

export enum RotationResult {
  ROTATED = "ROTATED",
  SESSION_NOT_FOUND = "SESSION_NOT_FOUND",
  HASH_MISMATCH = "HASH_MISMATCH",
}

export abstract class TokenRepository {
  static async saveRefreshTokenHash(
    sessionId: string,
    tokenHash: string,
    ttlSeconds: number,
  ): Promise<void> {
    await redisClient.set(
      RedisKeys.refreshSession(sessionId),
      tokenHash,
      "EX",
      ttlSeconds,
    );
  }

  static async rotateRefreshTokenHash(
    sessionId: string,
    expectedHash: string,
    nextHash: string,
    ttlSeconds: number,
  ): Promise<RotationResult> {
    const outcome = (await redisClient.eval(
      ROTATE_REFRESH_SCRIPT,
      1,
      RedisKeys.refreshSession(sessionId),
      expectedHash,
      nextHash,
      ttlSeconds,
    )) as number;

    if (outcome === 1) {
      return RotationResult.ROTATED;
    }

    return outcome === 0
      ? RotationResult.SESSION_NOT_FOUND
      : RotationResult.HASH_MISMATCH;
  }

  static async deleteSession(sessionId: string): Promise<void> {
    await redisClient.del(RedisKeys.refreshSession(sessionId));
  }

  static async blacklistToken(
    tokenId: string,
    ttlSeconds: number,
  ): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    await redisClient.set(
      RedisKeys.blacklistedToken(tokenId),
      "1",
      "EX",
      ttlSeconds,
    );
  }

  static async isBlacklisted(tokenId: string): Promise<boolean> {
    const exists = await redisClient.exists(
      RedisKeys.blacklistedToken(tokenId),
    );
    return exists === 1;
  }
}
