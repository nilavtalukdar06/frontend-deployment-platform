export abstract class RedisKeys {
  static refreshSession(sessionId: string): string {
    return `auth:refresh:${sessionId}`;
  }

  static blacklistedToken(tokenId: string): string {
    return `auth:blacklist:${tokenId}`;
  }

  static oauthState(state: string): string {
    return `auth:oauth-state:${state}`;
  }

  static userDeploymentLock(userId: string): string {
    return `deployments:user:${userId}:active`;
  }

  static viteDetection(
    repositoryId: number,
    defaultBranch: string,
    pushedAt: string,
  ): string {
    return `project:vite:${repositoryId}:${defaultBranch}:${pushedAt}`;
  }

  static webhookDelivery(deliveryId: string): string {
    return `webhooks:delivery:${deliveryId}`;
  }
}
