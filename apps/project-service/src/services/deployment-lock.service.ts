import { RedisKeys } from "../constants/redis-keys";
import { redisClient } from "../lib/redis";

const RELEASE_IF_OWNER_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export abstract class DeploymentLockService {
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
