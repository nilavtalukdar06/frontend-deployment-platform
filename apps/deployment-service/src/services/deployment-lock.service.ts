import { RedisKeys } from "../constants/redis-keys";
import { logger } from "../lib/logger";
import { createRedisClient } from "../lib/redis";

const RELEASE_IF_OWNER_SCRIPT = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
end
return 0
`;

export abstract class DeploymentLockService {
  static async release(userId: string, deploymentId: string): Promise<void> {
    const client = createRedisClient();

    try {
      await client.connect();
      const released = await client.eval(
        RELEASE_IF_OWNER_SCRIPT,
        1,
        RedisKeys.userDeploymentLock(userId),
        deploymentId,
      );
      logger.info(
        { deploymentId, released: released === 1 },
        "user deployment lock release attempted",
      );
    } catch (err) {
      logger.error({ err, deploymentId }, "failed to release deployment lock");
    } finally {
      client.disconnect();
    }
  }
}
