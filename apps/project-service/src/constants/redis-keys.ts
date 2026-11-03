export abstract class RedisKeys {
  static viteDetection(
    repositoryId: number,
    defaultBranch: string,
    pushedAt: string,
  ): string {
    return `project:vite:${repositoryId}:${defaultBranch}:${pushedAt}`;
  }
}
