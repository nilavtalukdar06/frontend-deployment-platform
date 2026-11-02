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
import { ApiError } from "../utils/api-error";
import { ApiResponse } from "../utils/api-response";

const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_PATH = "/auth";

export abstract class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };
    const user = await AuthService.register(email, password);

    res
      .status(StatusCodes.CREATED)
      .json(
        new ApiResponse(StatusCodes.CREATED, SuccessMessage.REGISTERED, user),
      );
  }

  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body as { email: string; password: string };
    const { user, accessToken, refreshToken } = await AuthService.login(
      email,
      password,
    );

    AuthController.setRefreshCookie(res, refreshToken.token);

    res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, SuccessMessage.LOGGED_IN, {
        user,
        ...AuthController.toAccessTokenPayload(accessToken),
      }),
    );
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
