import type { CookieOptions, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { AuthService, type TokenPair } from "../services/auth.service";
import { GithubOauthService } from "../services/github-oauth.service";
import { ApiError, ApiResponse } from "@repo/http";

const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_PATH = "/auth";
const OAUTH_STATE_COOKIE_NAME = "oauth_state";
const FRONTEND_CALLBACK_PATH = "/auth/callback";

export abstract class AuthController {
  static async githubAuthorize(_req: Request, res: Response): Promise<void> {
    const { state, url } = await GithubOauthService.createAuthorization();

    res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
      ...AuthController.oauthStateCookieOptions(),
      maxAge: env.OAUTH_STATE_TTL_SECONDS * 1000,
    });

    res.redirect(StatusCodes.MOVED_TEMPORARILY, url);
  }

  static async githubCallback(req: Request, res: Response): Promise<void> {
    const stateCookie: unknown = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
    res.clearCookie(
      OAUTH_STATE_COOKIE_NAME,
      AuthController.oauthStateCookieOptions(),
    );

    try {
      if (req.query["error"] !== undefined) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          ErrorMessage.GITHUB_AUTH_FAILED,
          ErrorCode.GITHUB_AUTH_FAILED,
        );
      }

      const { refreshToken } = await AuthService.completeGithubLogin(
        AuthController.readQueryString(req, "code"),
        AuthController.readQueryString(req, "state"),
        typeof stateCookie === "string" ? stateCookie : undefined,
      );

      AuthController.setRefreshCookie(res, refreshToken.token);
      res.redirect(
        StatusCodes.MOVED_TEMPORARILY,
        AuthController.frontendCallbackUrl(),
      );
    } catch (err) {
      const errorCode =
        err instanceof ApiError
          ? err.errorCode
          : ErrorCode.INTERNAL_SERVER_ERROR;

      (err instanceof ApiError && err.isOperational
        ? req.log.warn
        : req.log.error
      ).call(req.log, { err, errorCode }, "github sign-in failed");

      res.redirect(
        StatusCodes.MOVED_TEMPORARILY,
        AuthController.frontendCallbackUrl(errorCode),
      );
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { accessToken, refreshToken }: TokenPair =
        await AuthService.refresh(AuthController.readRefreshCookie(req));

      AuthController.setRefreshCookie(res, refreshToken.token);

      res
        .status(StatusCodes.OK)
        .json(
          new ApiResponse(
            StatusCodes.OK,
            SuccessMessage.TOKEN_REFRESHED,
            AuthController.toAccessTokenPayload(accessToken),
          ),
        );
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.errorCode === ErrorCode.INVALID_TOKEN
      ) {
        AuthController.clearRefreshCookie(res);
      }

      throw err;
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    await AuthService.logout(
      AuthenticateMiddleware.extractBearerToken(req),
      AuthController.readRefreshCookie(req),
    );

    AuthController.clearRefreshCookie(res);

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, SuccessMessage.LOGGED_OUT));
  }

  static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        ErrorMessage.UNAUTHORIZED,
        ErrorCode.UNAUTHORIZED,
      );
    }

    const { sessionId: _sessionId, ...user } = req.user;

    res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, SuccessMessage.CURRENT_USER, user));
  }

  private static toAccessTokenPayload(accessToken: TokenPair["accessToken"]) {
    return {
      accessToken: accessToken.token,
      tokenType: "Bearer",
      expiresIn: accessToken.expiresInSeconds,
    };
  }

  private static cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      path: REFRESH_COOKIE_PATH,
    };
  }

  private static oauthStateCookieOptions(): CookieOptions {
    return { ...AuthController.cookieOptions(), sameSite: "lax" };
  }

  private static frontendCallbackUrl(errorCode?: string): string {
    const url = new URL(FRONTEND_CALLBACK_PATH, env.FRONTEND_URL);

    if (errorCode) {
      url.searchParams.set("error", errorCode);
    }

    return url.toString();
  }

  private static readQueryString(
    req: Request,
    name: string,
  ): string | undefined {
    const value = req.query[name];
    return typeof value === "string" ? value : undefined;
  }

  private static setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...AuthController.cookieOptions(),
      maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000,
    });
  }

  private static clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, AuthController.cookieOptions());
  }

  private static readRefreshCookie(req: Request): string | undefined {
    const value: unknown = req.cookies?.[REFRESH_COOKIE_NAME];
    return typeof value === "string" ? value : undefined;
  }
}
