export abstract class RedisKeys {
  static userDeploymentLock(userId: string): string {
    return `deployments:user:${userId}:active`;
  }
}
