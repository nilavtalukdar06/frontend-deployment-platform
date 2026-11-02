export abstract class RedisKeys {
  static refreshSession(sessionId: string): string {
    return `auth:refresh:${sessionId}`;
  }

  static blacklistedToken(tokenId: string): string {
    return `auth:blacklist:${tokenId}`;
  }

  static loginAttempts(emailHash: string): string {
    return `auth:login-attempts:${emailHash}`;
  }

  static loginLock(emailHash: string): string {
    return `auth:login-lock:${emailHash}`;
  }
}
