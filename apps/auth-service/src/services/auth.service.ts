import { randomUUID, timingSafeEqual } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import type { User } from "../db/schema";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { logger } from "../lib/logger";
import {
  RotationResult,
  TokenRepository,
} from "../repositories/token.repository";
import { UserRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/api-error";
import { TokenCipher } from "../utils/token-cipher";
import { GithubOauthService } from "./github-oauth.service";
import { TokenService, type IssuedToken } from "./token.service";

export interface PublicUser {
  id: string;
  githubLogin: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  status: User["status"];
  lastLoginAt: Date | null;
  createdAt: Date;
}

export interface AuthenticatedUser extends PublicUser {
  sessionId: string;
}

export interface TokenPair {
  accessToken: IssuedToken;
  refreshToken: IssuedToken;
}

export interface LoginResult extends TokenPair {
  user: PublicUser;
}

export abstract class AuthService {
  static toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      githubLogin: user.githubLogin,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  static async completeGithubLogin(
    code: string | undefined,
    state: string | undefined,
    expectedState: string | undefined,
  ): Promise<LoginResult> {
    if (
      !code ||
      !state ||
      !expectedState ||
      !AuthService.safeEqual(state, expectedState)
    ) {
      throw AuthService.invalidOauthState();
    }

    const codeVerifier = await GithubOauthService.consumeState(state);

    if (!codeVerifier) {
      throw AuthService.invalidOauthState();
    }

    const grant = await GithubOauthService.exchangeCode(code, codeVerifier);
    const profile = await GithubOauthService.fetchProfile(grant.accessToken);

    const user = await UserRepository.upsertFromGithub({
      ...profile,
      githubAccessToken: TokenCipher.encrypt(grant.accessToken),
      githubTokenScopes: grant.scopes.join(","),
    });

    if (user.deletedAt || user.status !== "active") {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        ErrorMessage.ACCOUNT_INACTIVE,
        ErrorCode.FORBIDDEN,
      );
    }

    return AuthService.startSession(user);
  }

  static async getGithubAccessToken(userId: string): Promise<string> {
    const user = await UserRepository.findById(userId);

    if (!user || user.status !== "active") {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        ErrorMessage.NOT_FOUND,
        ErrorCode.NOT_FOUND,
      );
    }

    return TokenCipher.decrypt(user.githubAccessToken);
  }

  static async refresh(presentedToken: string | undefined): Promise<TokenPair> {
    if (!presentedToken) {
      throw AuthService.invalidToken();
    }

    const claims = await TokenService.verify("refresh", presentedToken);

    if (await TokenRepository.isBlacklisted(claims.tokenId)) {
      await TokenRepository.deleteSession(claims.sessionId);
      throw AuthService.revokedToken();
    }

    const user = await UserRepository.findById(claims.userId);

    if (!user || user.status !== "active") {
      await TokenRepository.deleteSession(claims.sessionId);
      throw AuthService.invalidToken();
    }

    const refreshToken = await TokenService.issue(
      "refresh",
      user.id,
      claims.sessionId,
    );

    const rotation = await TokenRepository.rotateRefreshTokenHash(
      claims.sessionId,
      TokenService.hash(presentedToken),
      TokenService.hash(refreshToken.token),
      refreshToken.expiresInSeconds,
    );

    if (rotation === RotationResult.SESSION_NOT_FOUND) {
      throw AuthService.invalidToken();
    }

    if (rotation === RotationResult.HASH_MISMATCH) {
      logger.warn(
        { userId: claims.userId, sessionId: claims.sessionId },
        "refresh token reuse detected, revoking session",
      );
      await Promise.all([
        TokenRepository.deleteSession(claims.sessionId),
        TokenRepository.blacklistToken(
          claims.tokenId,
          TokenService.remainingTtlSeconds(claims.expiresAt),
        ),
      ]);
      throw AuthService.revokedToken();
    }

    const accessToken = await TokenService.issue(
      "access",
      user.id,
      claims.sessionId,
    );

    return { accessToken, refreshToken };
  }

  static async logout(
    accessToken: string | undefined,
    refreshToken: string | undefined,
  ): Promise<void> {
    const [accessClaims, refreshClaims] = await Promise.all([
      TokenService.tryVerify("access", accessToken),
      TokenService.tryVerify("refresh", refreshToken),
    ]);

    const claimsList = [accessClaims, refreshClaims].flatMap((claims) =>
      claims ? [claims] : [],
    );
    const sessionIds = new Set(claimsList.map((claims) => claims.sessionId));

    await Promise.all([
      ...claimsList.map((claims) =>
        TokenRepository.blacklistToken(
          claims.tokenId,
          TokenService.remainingTtlSeconds(claims.expiresAt),
        ),
      ),
      ...[...sessionIds].map((sessionId) =>
        TokenRepository.deleteSession(sessionId),
      ),
    ]);
  }

  static async authenticate(
    accessToken: string | undefined,
  ): Promise<AuthenticatedUser> {
    if (!accessToken) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    const claims = await TokenService.verify("access", accessToken);

    const [blacklisted, sessionActive] = await Promise.all([
      TokenRepository.isBlacklisted(claims.tokenId),
      TokenRepository.sessionExists(claims.sessionId),
    ]);

    if (blacklisted || !sessionActive) {
      throw AuthService.revokedToken();
    }

    const user = await UserRepository.findById(claims.userId);

    if (!user || user.status !== "active") {
      throw AuthService.invalidToken();
    }

    return { ...AuthService.toPublicUser(user), sessionId: claims.sessionId };
  }

  private static async startSession(user: User): Promise<LoginResult> {
    const sessionId = randomUUID();
    const accessToken = await TokenService.issue("access", user.id, sessionId);
    const refreshToken = await TokenService.issue(
      "refresh",
      user.id,
      sessionId,
    );

    await TokenRepository.saveRefreshTokenHash(
      sessionId,
      TokenService.hash(refreshToken.token),
      refreshToken.expiresInSeconds,
    );

    return {
      user: AuthService.toPublicUser(user),
      accessToken,
      refreshToken,
    };
  }

  private static invalidOauthState(): ApiError {
    return new ApiError(
      StatusCodes.BAD_REQUEST,
      ErrorMessage.INVALID_OAUTH_STATE,
      ErrorCode.INVALID_OAUTH_STATE,
    );
  }

  private static safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private static invalidToken(): ApiError {
    return new ApiError(
      StatusCodes.UNAUTHORIZED,
      ErrorMessage.INVALID_TOKEN,
      ErrorCode.INVALID_TOKEN,
    );
  }

  private static revokedToken(): ApiError {
    return new ApiError(
      StatusCodes.UNAUTHORIZED,
      ErrorMessage.TOKEN_REVOKED,
      ErrorCode.INVALID_TOKEN,
    );
  }
}
