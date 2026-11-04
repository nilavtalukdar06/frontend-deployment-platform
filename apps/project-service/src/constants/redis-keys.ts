export abstract class RedisKeys {
  static viteDetection(
    repositoryId: number,
    defaultBranch: string,
    pushedAt: string,
  ): string {
    return `project:vite:${repositoryId}:${defaultBranch}:${pushedAt}`;
  }

  static userDeploymentLock(userId: string): string {
    return `deployments:user:${userId}:active`;
  }

  static webhookDelivery(deliveryId: string): string {
    return `webhooks:delivery:${deliveryId}`;
  }
}
