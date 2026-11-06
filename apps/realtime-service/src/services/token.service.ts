import { jwtVerify } from "jose";
import { env } from "../config/env";
import { SessionRepository } from "../repositories/session.repository";

export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
  tokenId: string;
  expiresAt: number;
}

export class InvalidTokenError extends Error {}

export abstract class TokenService {
  private static readonly accessSecret = new TextEncoder().encode(
    env.JWT_ACCESS_SECRET,
  );

  static async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    let claims: AccessTokenClaims;

    try {
      const { payload } = await jwtVerify(token, TokenService.accessSecret, {
        algorithms: ["HS256"],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      });
      const { sub, jti, exp } = payload;
      const sessionId = payload["sid"];

      if (
        !sub ||
        !jti ||
        !exp ||
        typeof sessionId !== "string" ||
        payload["typ"] !== "access"
      ) {
        throw new Error("malformed token claims");
      }

      claims = { userId: sub, sessionId, tokenId: jti, expiresAt: exp };
    } catch {
      throw new InvalidTokenError("invalid access token");
    }

    const [blacklisted, sessionActive] = await Promise.all([
      SessionRepository.isBlacklisted(claims.tokenId),
      SessionRepository.sessionExists(claims.sessionId),
    ]);

    if (blacklisted || !sessionActive) {
      throw new InvalidTokenError("token revoked");
    }

    return claims;
  }
}
