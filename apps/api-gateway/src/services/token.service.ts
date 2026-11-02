import { jwtVerify, type JWTPayload } from "jose";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "../utils/api-error";

export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
  tokenId: string;
  expiresAt: number;
}

export abstract class TokenService {
  private static readonly accessSecret = new TextEncoder().encode(
    env.JWT_ACCESS_SECRET,
  );

  static async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    try {
      const { payload } = await jwtVerify(token, TokenService.accessSecret, {
        algorithms: ["HS256"],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      });

      return TokenService.toClaims(payload);
    } catch {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.INVALID_TOKEN,
        ErrorCode.INVALID_TOKEN,
      );
    }
  }

  private static toClaims(payload: JWTPayload): AccessTokenClaims {
    const { sub, jti, exp } = payload;
    const sessionId = payload["sid"];

    if (!sub || !jti || !exp || typeof sessionId !== "string") {
      throw new Error("malformed token claims");
    }

    if (payload["typ"] !== "access") {
      throw new Error("not an access token");
    }

    return { userId: sub, sessionId, tokenId: jti, expiresAt: exp };
  }
}
