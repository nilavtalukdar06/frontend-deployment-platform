import { createHash, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { ApiError } from "@repo/http";

export type TokenType = "access" | "refresh";

export interface TokenClaims {
  userId: string;
  sessionId: string;
  tokenId: string;
  type: TokenType;
  expiresAt: number;
}

export interface IssuedToken {
  token: string;
  tokenId: string;
  expiresAt: number;
  expiresInSeconds: number;
}

export abstract class TokenService {
  private static readonly encoder = new TextEncoder();

  private static secretFor(type: TokenType): Uint8Array {
    return TokenService.encoder.encode(
      type === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET,
    );
  }

  private static ttlFor(type: TokenType): number {
    return type === "access"
      ? env.ACCESS_TOKEN_TTL_SECONDS
      : env.REFRESH_TOKEN_TTL_SECONDS;
  }

  static async issue(
    type: TokenType,
    userId: string,
    sessionId: string,
  ): Promise<IssuedToken> {
    const tokenId = randomUUID();
    const expiresInSeconds = TokenService.ttlFor(type);
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + expiresInSeconds;

    const token = await new SignJWT({ sid: sessionId, typ: type })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(userId)
      .setJti(tokenId)
      .setIssuer(env.JWT_ISSUER)
      .setAudience(env.JWT_AUDIENCE)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .sign(TokenService.secretFor(type));

    return { token, tokenId, expiresAt, expiresInSeconds };
  }

  static async verify(type: TokenType, token: string): Promise<TokenClaims> {
    try {
      const { payload } = await jwtVerify(token, TokenService.secretFor(type), {
        algorithms: ["HS256"],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      });

      return TokenService.toClaims(type, payload);
    } catch {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.INVALID_TOKEN,
        ErrorCode.INVALID_TOKEN,
      );
    }
  }

  static async tryVerify(
    type: TokenType,
    token: string | undefined,
  ): Promise<TokenClaims | undefined> {
    if (!token) {
      return undefined;
    }

    try {
      return await TokenService.verify(type, token);
    } catch {
      return undefined;
    }
  }

  static hash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  static remainingTtlSeconds(expiresAt: number): number {
    return Math.max(0, expiresAt - Math.floor(Date.now() / 1000));
  }

  private static toClaims(type: TokenType, payload: JWTPayload): TokenClaims {
    const { sub, jti, exp } = payload;
    const sessionId = payload["sid"];

    if (
      !sub ||
      !jti ||
      !exp ||
      typeof sessionId !== "string" ||
      payload["typ"] !== type
    ) {
      throw new Error("malformed token claims");
    }

    return { userId: sub, sessionId, tokenId: jti, type, expiresAt: exp };
  }
}
