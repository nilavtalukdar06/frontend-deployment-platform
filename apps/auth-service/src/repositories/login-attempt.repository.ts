import { env } from "../config/env";
import { redisClient } from "../lib/redis";
import { RedisKeys } from "../constants/redis-keys";

const RECORD_FAILURE_SCRIPT = `
local attempts = redis.call("INCR", KEYS[1])
if attempts == 1 then
  redis.call("EXPIRE", KEYS[1], tonumber(ARGV[1]))
end
if attempts >= tonumber(ARGV[2]) then
  redis.call("SET", KEYS[2], "1", "EX", tonumber(ARGV[3]))
  redis.call("DEL", KEYS[1])
  return 1
end
return 0
`;

export abstract class LoginAttemptRepository {
  static async getLockTtlSeconds(emailHash: string): Promise<number> {
    const ttl = await redisClient.ttl(RedisKeys.loginLock(emailHash));
    return ttl > 0 ? ttl : 0;
  }

  static async recordFailure(emailHash: string): Promise<boolean> {
    const locked = (await redisClient.eval(
      RECORD_FAILURE_SCRIPT,
      2,
      RedisKeys.loginAttempts(emailHash),
      RedisKeys.loginLock(emailHash),
      env.LOGIN_ATTEMPT_WINDOW_SECONDS,
      env.LOGIN_MAX_ATTEMPTS,
      env.LOGIN_LOCK_SECONDS,
    )) as number;

    return locked === 1;
  }

  static async clear(emailHash: string): Promise<void> {
    await redisClient.del(
      RedisKeys.loginAttempts(emailHash),
      RedisKeys.loginLock(emailHash),
    );
  }
}
