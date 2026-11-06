import { env } from "../config/env";
import { RedisKeys } from "@repo/contracts";
import { redisClient } from "../lib/redis";

const RELEASE_IF_OWNER_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export abstract class DeploymentLockService {
  static async acquire(userId: string, deploymentId: string): Promise<boolean> {
    const result = await redisClient.set(
      RedisKeys.userDeploymentLock(userId),
      deploymentId,
      "EX",
      env.DEPLOYMENT_LOCK_TTL_SECONDS,
      "NX",
    );

    return result === "OK";
  }

  static async holder(userId: string): Promise<string | null> {
    return redisClient.get(RedisKeys.userDeploymentLock(userId));
  }

  static async release(userId: string, deploymentId: string): Promise<boolean> {
    const released = await redisClient.eval(
      RELEASE_IF_OWNER_SCRIPT,
      1,
      RedisKeys.userDeploymentLock(userId),
      deploymentId,
    );

    return released === 1;
  }
}
