export abstract class RedisKeys {
  static blacklistedToken(tokenId: string): string {
    return `auth:blacklist:${tokenId}`;
  }
}
