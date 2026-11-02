import { randomUUID } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import type { User } from "../db/schema";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { logger } from "../lib/logger";
import { LoginAttemptRepository } from "../repositories/login-attempt.repository";
import {
  RotationResult,
  TokenRepository,
} from "../repositories/token.repository";
import { UserRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/api-error";
import { PasswordService } from "./password.service";
import { TokenService, type IssuedToken } from "./token.service";

export interface PublicUser {
  id: string;
  email: string;
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

const POSTGRES_UNIQUE_VIOLATION = "23505";

export abstract class AuthService {
  static toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  static async register(email: string, password: string): Promise<PublicUser> {
    const passwordHash = await PasswordService.hash(password);

    try {
      const user = await UserRepository.create({ email, passwordHash });
      return AuthService.toPublicUser(user);
    } catch (err) {
      if (AuthService.isUniqueViolation(err)) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          ErrorMessage.EMAIL_ALREADY_REGISTERED,
          ErrorCode.CONFLICT,
        );
      }

      throw err;
    }
  }

  static async login(email: string, password: string): Promise<LoginResult> {
    const emailHash = TokenService.hash(email);

    const lockTtlSeconds =
      await LoginAttemptRepository.getLockTtlSeconds(emailHash);

    if (lockTtlSeconds > 0) {
      throw AuthService.accountLocked(lockTtlSeconds);
    }

    const user = await UserRepository.findByEmail(email);
    const passwordMatches = user
      ? await PasswordService.verify(user.passwordHash, password)
      : await PasswordService.verifyAgainstDummy(password);

    if (!user || !passwordMatches) {
      const nowLocked = await LoginAttemptRepository.recordFailure(emailHash);

      if (nowLocked) {
        throw AuthService.accountLocked(env.LOGIN_LOCK_SECONDS);
      }

      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.INVALID_CREDENTIALS,
        ErrorCode.INVALID_CREDENTIALS,
      );
    }

    if (user.status !== "active") {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        ErrorMessage.ACCOUNT_INACTIVE,
        ErrorCode.FORBIDDEN,
      );
    }

    await LoginAttemptRepository.clear(emailHash);
    await UserRepository.touchLastLogin(user.id);

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

  private static accountLocked(retryAfterSeconds: number): ApiError {
    return new ApiError(
      StatusCodes.LOCKED,
      ErrorMessage.ACCOUNT_LOCKED,
      ErrorCode.ACCOUNT_LOCKED,
      { retryAfterSeconds },
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

  private static isUniqueViolation(err: unknown): boolean {
    let current: unknown = err;

    for (let depth = 0; depth < 3 && current; depth += 1) {
      if (
        typeof current === "object" &&
        "code" in current &&
        current.code === POSTGRES_UNIQUE_VIOLATION
      ) {
        return true;
      }

      current =
        typeof current === "object" && "cause" in current
          ? current.cause
          : undefined;
    }

    return false;
  }
}
