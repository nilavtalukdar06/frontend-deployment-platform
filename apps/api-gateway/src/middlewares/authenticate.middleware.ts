import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { isPublicRoute } from "../config/public-routes";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { logger } from "../lib/logger";
import { TokenRepository } from "../repositories/token.repository";
import {
  TokenService,
  type AccessTokenClaims,
} from "../services/token.service";
import { ApiError } from "../utils/api-error";

export abstract class AuthenticateMiddleware {
  static handle(req: Request, _res: Response, next: NextFunction): void {
    if (isPublicRoute(req)) {
      next();
      return;
    }

    AuthenticateMiddleware.authenticate(req).then(() => next(), next);
  }

  static extractBearerToken(req: Request): string | undefined {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    return scheme?.toLowerCase() === "bearer" ? token : undefined;
  }

  private static async authenticate(req: Request): Promise<void> {
    const accessToken = AuthenticateMiddleware.extractBearerToken(req);

    if (!accessToken) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    const claims = await TokenService.verifyAccessToken(accessToken);

    if (await AuthenticateMiddleware.isRevoked(claims)) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.TOKEN_REVOKED,
        ErrorCode.INVALID_TOKEN,
      );
    }

    req.auth = claims;
  }

  private static async isRevoked(claims: AccessTokenClaims): Promise<boolean> {
    try {
      const [blacklisted, sessionActive] = await Promise.all([
        TokenRepository.isBlacklisted(claims.tokenId),
        TokenRepository.sessionExists(claims.sessionId),
      ]);
      return blacklisted || !sessionActive;
    } catch (err) {
      logger.error({ err }, "token revocation lookup failed");
      throw new ApiError(
        StatusCodes.SERVICE_UNAVAILABLE,
        ErrorMessage.SERVICE_UNAVAILABLE,
        ErrorCode.SERVICE_UNAVAILABLE,
      );
    }
  }
}
