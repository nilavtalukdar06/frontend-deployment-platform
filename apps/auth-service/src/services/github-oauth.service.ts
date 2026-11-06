import { createHash, randomBytes } from "node:crypto";
import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { env } from "../config/env";
import { ErrorCode } from "../constants/error-code.enum";
import { RedisKeys } from "@repo/contracts";
import { ErrorMessage } from "../constants/response-message.enum";
import { logger } from "../lib/logger";
import { redisClient } from "../lib/redis";
import { ApiError } from "@repo/http";

export interface GithubAuthorization {
  state: string;
  url: string;
}

export interface GithubGrant {
  accessToken: string;
  scopes: string[];
}

export interface GithubProfile {
  githubId: number;
  githubLogin: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_URL = "https://api.github.com";
const REQUESTED_SCOPES = ["repo", "read:user", "user:email"];
const REQUIRED_SCOPE = "repo";

const accessTokenResponseSchema = z.union([
  z.object({
    access_token: z.string().min(1),
    scope: z.string(),
    token_type: z.string(),
  }),
  z.object({ error: z.string(), error_description: z.string().optional() }),
]);

const userResponseSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
  name: z.string().nullable(),
  avatar_url: z.string().nullable(),
});

const emailsResponseSchema = z.array(
  z.object({
    email: z.string(),
    primary: z.boolean(),
    verified: z.boolean(),
  }),
);

export abstract class GithubOauthService {
  static async createAuthorization(): Promise<GithubAuthorization> {
    const state = randomBytes(32).toString("base64url");
    const codeVerifier = randomBytes(32).toString("base64url");
    const codeChallenge = createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    await redisClient.set(
      RedisKeys.oauthState(state),
      codeVerifier,
      "EX",
      env.OAUTH_STATE_TTL_SECONDS,
    );

    const url = new URL(AUTHORIZE_URL);
    url.search = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_CALLBACK_URL,
      scope: REQUESTED_SCOPES.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      allow_signup: "true",
    }).toString();

    return { state, url: url.toString() };
  }

  static async consumeState(state: string): Promise<string | undefined> {
    const codeVerifier = await redisClient.getdel(RedisKeys.oauthState(state));
    return codeVerifier ?? undefined;
  }

  static async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<GithubGrant> {
    const response = await GithubOauthService.request(ACCESS_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_CALLBACK_URL,
        code_verifier: codeVerifier,
      }),
    });

    const parsed = accessTokenResponseSchema.safeParse(
      response.ok ? await response.json() : undefined,
    );

    if (!parsed.success || "error" in parsed.data) {
      logger.warn(
        {
          status: response.status,
          error:
            parsed.success && "error" in parsed.data
              ? parsed.data.error
              : undefined,
        },
        "github code exchange failed",
      );
      throw GithubOauthService.authFailed(ErrorMessage.GITHUB_AUTH_FAILED);
    }

    const scopes = parsed.data.scope
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean);

    if (!scopes.includes(REQUIRED_SCOPE)) {
      throw GithubOauthService.authFailed(ErrorMessage.GITHUB_SCOPE_MISSING);
    }

    return { accessToken: parsed.data.access_token, scopes };
  }

  static async fetchProfile(accessToken: string): Promise<GithubProfile> {
    const userResponse = await GithubOauthService.request(
      `${GITHUB_API_URL}/user`,
      { headers: GithubOauthService.apiHeaders(accessToken) },
    );

    const user = userResponseSchema.safeParse(
      userResponse.ok ? await userResponse.json() : undefined,
    );

    if (!user.success) {
      logger.warn(
        { status: userResponse.status },
        "github profile lookup failed",
      );
      throw GithubOauthService.authFailed(ErrorMessage.GITHUB_AUTH_FAILED);
    }

    return {
      githubId: user.data.id,
      githubLogin: user.data.login,
      name: user.data.name,
      email: await GithubOauthService.fetchPrimaryEmail(accessToken),
      avatarUrl: user.data.avatar_url,
    };
  }

  private static async fetchPrimaryEmail(
    accessToken: string,
  ): Promise<string | null> {
    const response = await GithubOauthService.request(
      `${GITHUB_API_URL}/user/emails`,
      { headers: GithubOauthService.apiHeaders(accessToken) },
    );

    const emails = emailsResponseSchema.safeParse(
      response.ok ? await response.json() : undefined,
    );

    const primary = emails.success
      ? emails.data.find((entry) => entry.primary && entry.verified)
      : undefined;

    return primary ? primary.email.trim().toLowerCase() : null;
  }

  private static apiHeaders(accessToken: string): Record<string, string> {
    return {
      Authorization: `Bearer ${accessToken}`,
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  private static async request(
    url: string,
    init: RequestInit,
  ): Promise<Response> {
    try {
      return await fetch(url, {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(env.GITHUB_API_TIMEOUT_MS),
        headers: {
          Accept: "application/json",
          "User-Agent": "react-deployment-platform-auth-service",
          ...init.headers,
        },
      });
    } catch (err) {
      logger.error({ err }, "github request could not be completed");
      throw new ApiError(
        StatusCodes.SERVICE_UNAVAILABLE,
        ErrorMessage.GITHUB_UNAVAILABLE,
        ErrorCode.SERVICE_UNAVAILABLE,
      );
    }
  }

  private static authFailed(message: ErrorMessage): ApiError {
    return new ApiError(
      StatusCodes.UNAUTHORIZED,
      message,
      ErrorCode.GITHUB_AUTH_FAILED,
    );
  }
}
