export abstract class RedisKeys {
  static refreshSession(sessionId: string): string {
    return `auth:refresh:${sessionId}`;
  }

  static blacklistedToken(tokenId: string): string {
    return `auth:blacklist:${tokenId}`;
  }
}
