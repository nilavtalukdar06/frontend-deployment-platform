import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";

type JsonObject = Record<string, unknown>;
type Headers = Record<string, JsonObject>;

const REFRESH_COOKIE_NAME = "refresh_token";
const OAUTH_STATE_COOKIE_NAME = "oauth_state";

const jsonContent = (schemaName: string, example?: unknown) => ({
  "application/json": {
    schema: { $ref: `#/components/schemas/${schemaName}` },
    ...(example === undefined ? {} : { example }),
  },
});

const ref = (name: string) => ({ $ref: `#/components/responses/${name}` });

const errorExample = (
  statusCode: number,
  errorCode: ErrorCode,
  message: ErrorMessage,
  details?: unknown,
) => ({
  success: false,
  statusCode,
  errorCode,
  message,
  ...(details === undefined ? {} : { details }),
});

const errorResponse = (
  description: string,
  example: ReturnType<typeof errorExample>,
  headers?: Headers,
): JsonObject => ({
  description,
  ...(headers ? { headers } : {}),
  content: jsonContent("ErrorResponse", example),
});

const exampleUser = {
  id: "0192f5a4-7b1e-7c3a-9d2e-5f8a1b2c3d4e",
  githubLogin: "janedoe",
  name: "Jane Doe",
  email: "jane.doe@example.com",
  avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
  status: "active",
  lastLoginAt: "2026-11-03T09:30:00.000Z",
  createdAt: "2026-10-20T12:00:00.000Z",
};

const exampleTokenPayload = {
  accessToken:
    "eyJhbGciOiJIUzI1NiJ9.eyJzaWQiOiJmM2U0Iiwic3ViIjoiMDE5MmY1YTQifQ.signature",
  tokenType: "Bearer",
  expiresIn: 900,
};

const refreshCookieHeader: Headers = {
  "Set-Cookie": {
    description: `Sets the \`${REFRESH_COOKIE_NAME}\` cookie (HttpOnly, SameSite=Strict, Path=/auth, Secure in production). Its lifetime equals \`REFRESH_TOKEN_TTL_SECONDS\`.`,
    schema: { type: "string" },
  },
};

const clearedCookieHeader: Headers = {
  "Set-Cookie": {
    description: `Clears the \`${REFRESH_COOKIE_NAME}\` cookie.`,
    schema: { type: "string" },
  },
};

const sharedErrorResponses = {
  "429": ref("TooManyRequests"),
  "500": ref("InternalServerError"),
};

const schemas: Record<string, JsonObject> = {
  UserStatus: {
    type: "string",
    enum: ["active", "suspended", "deactivated"],
  },
  User: {
    type: "object",
    required: [
      "id",
      "githubLogin",
      "name",
      "email",
      "avatarUrl",
      "status",
      "lastLoginAt",
      "createdAt",
    ],
    properties: {
      id: { type: "string", format: "uuid" },
      githubLogin: {
        type: "string",
        description: "GitHub username, refreshed on every sign-in.",
      },
      name: { type: ["string", "null"] },
      email: {
        type: ["string", "null"],
        format: "email",
        description:
          "Primary verified email of the GitHub account, lower-cased. Null when GitHub has none.",
      },
      avatarUrl: { type: ["string", "null"], format: "uri" },
      status: { $ref: "#/components/schemas/UserStatus" },
      lastLoginAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "Time of the last GitHub sign-in.",
      },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  AccessTokenPayload: {
    type: "object",
    required: ["accessToken", "tokenType", "expiresIn"],
    properties: {
      accessToken: {
        type: "string",
        description: "Short-lived JWT (HS256) sent as a Bearer token.",
      },
      tokenType: { type: "string", enum: ["Bearer"] },
      expiresIn: {
        type: "integer",
        description: "Access token lifetime in seconds.",
        example: 900,
      },
    },
  },
  HealthData: {
    type: "object",
    required: ["postgres", "redis", "uptime"],
    properties: {
      postgres: { type: "string", enum: ["up", "down"] },
      redis: { type: "string", enum: ["up", "down"] },
      uptime: {
        type: "number",
        description: "Process uptime in seconds.",
        example: 1234.56,
      },
    },
  },
  MessageResponse: {
    type: "object",
    required: ["success", "statusCode", "message"],
    properties: {
      success: { type: "boolean", example: true },
      statusCode: { type: "integer", example: 200 },
      message: { type: "string" },
    },
  },
  UserResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/User" } },
      },
    ],
  },
  GithubTokenResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: {
            type: "object",
            required: ["accessToken"],
            properties: {
              accessToken: {
                type: "string",
                description:
                  "Decrypted GitHub OAuth access token of the user (scopes `repo`, `read:user`, `user:email`).",
              },
            },
          },
        },
      },
    ],
  },
  RefreshResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: {
          data: { $ref: "#/components/schemas/AccessTokenPayload" },
        },
      },
    ],
  },
  HealthResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/HealthData" } },
      },
    ],
  },
  ErrorCode: {
    type: "string",
    enum: Object.values(ErrorCode),
  },
  ErrorResponse: {
    type: "object",
    required: ["success", "statusCode", "errorCode", "message"],
    properties: {
      success: { type: "boolean", enum: [false] },
      statusCode: { type: "integer" },
      errorCode: { $ref: "#/components/schemas/ErrorCode" },
      message: { type: "string" },
      details: {
        description:
          "Optional context. For `VALIDATION_ERROR` it is the Zod tree-ified error (`errors` plus per-field `properties`); for `NOT_FOUND` it is `{ path }`.",
      },
      stack: {
        type: "string",
        description:
          "Stack trace. Only present when the service runs with `NODE_ENV=development`.",
      },
    },
  },
};

const responses: Record<string, JsonObject> = {
  ValidationError: errorResponse(
    "The path parameters failed validation.",
    errorExample(
      400,
      ErrorCode.VALIDATION_ERROR,
      ErrorMessage.VALIDATION_ERROR,
      {
        errors: [],
        properties: {
          id: {
            errors: ["Invalid UUID"],
          },
        },
      },
    ),
  ),
  TooManyRequests: errorResponse(
    "The per-client rate limit was exceeded (`RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS`). Standard `RateLimit-*` headers are returned on every response. Routes under `/internal` are not rate limited.",
    errorExample(
      429,
      ErrorCode.TOO_MANY_REQUESTS,
      ErrorMessage.TOO_MANY_REQUESTS,
    ),
  ),
  InternalServerError: errorResponse(
    "An unexpected error occurred.",
    errorExample(
      500,
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorMessage.INTERNAL_SERVER_ERROR,
    ),
  ),
};

const bearerSecurity = [{ bearerAuth: [] }];
const refreshCookieSecurity = [{ refreshCookie: [] }];
const internalApiKeySecurity = [{ internalApiKey: [] }];

const redirectHeader = (description: string): Headers => ({
  Location: { description, schema: { type: "string", format: "uri" } },
});

const health: JsonObject = {
  security: [],
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Service health",
  description:
    "Checks the Postgres and Redis connections. Responds with 503 when either dependency is down.",
  responses: {
    "200": {
      description: "All dependencies are reachable.",
      content: jsonContent("HealthResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.HEALTH_OK,
        data: { postgres: "up", redis: "up", uptime: 1234.56 },
      }),
    },
    "503": {
      description:
        "At least one dependency is down. The body uses the success envelope with `success: false`.",
      content: jsonContent("HealthResponse", {
        success: false,
        statusCode: 503,
        message: ErrorMessage.SERVICE_UNAVAILABLE,
        data: { postgres: "up", redis: "down", uptime: 1234.56 },
      }),
    },
    "429": sharedErrorResponses["429"],
  },
};

const githubAuthorize: JsonObject = {
  security: [],
  tags: ["Auth"],
  operationId: "startGithubSignIn",
  summary: "Start GitHub sign-in",
  description: `Open in the browser (a top-level navigation, not \`fetch\`). Creates a single-use \`state\` and a PKCE verifier (stored in Redis for \`OAUTH_STATE_TTL_SECONDS\`), sets the \`${OAUTH_STATE_COOKIE_NAME}\` cookie and redirects to GitHub, requesting the \`repo\`, \`read:user\` and \`user:email\` scopes. The \`repo\` scope lets the platform list and read the user's public and private repositories.`,
  responses: {
    "302": {
      description: "Redirect to the GitHub authorization page.",
      headers: {
        ...redirectHeader(
          "`https://github.com/login/oauth/authorize?client_id=…&redirect_uri=…&scope=repo read:user user:email&state=…&code_challenge=…&code_challenge_method=S256`",
        ),
        "Set-Cookie": {
          description: `Sets the \`${OAUTH_STATE_COOKIE_NAME}\` cookie (HttpOnly, SameSite=Lax, Path=/auth, Secure in production, expires after \`OAUTH_STATE_TTL_SECONDS\`).`,
          schema: { type: "string" },
        },
      },
    },
    ...sharedErrorResponses,
  },
};

const githubCallback: JsonObject = {
  security: [],
  tags: ["Auth"],
  operationId: "completeGithubSignIn",
  summary: "GitHub sign-in callback",
  description: `GitHub redirects the browser here. The \`state\` query parameter must match the \`${OAUTH_STATE_COOKIE_NAME}\` cookie and an unused state in Redis. The code is exchanged with PKCE, the GitHub profile and primary verified email are read, and the user is created or updated by GitHub id. The GitHub access token is stored encrypted (AES-256-GCM). A session is started and the browser is redirected to \`FRONTEND_URL/auth/callback\` with the \`${REFRESH_COOKIE_NAME}\` cookie set; the frontend then calls \`POST /auth/refresh\` to get an access token. This route never responds with JSON: on any failure it redirects to \`FRONTEND_URL/auth/callback?error=<ERROR_CODE>\` with \`INVALID_OAUTH_STATE\` (missing, mismatched, expired or reused state, or missing code), \`GITHUB_AUTH_FAILED\` (the user cancelled, the code exchange or profile lookup failed, or the \`repo\` scope was not granted), \`FORBIDDEN\` (the account is suspended or deactivated), \`SERVICE_UNAVAILABLE\` (GitHub unreachable) or \`INTERNAL_SERVER_ERROR\`. The \`${OAUTH_STATE_COOKIE_NAME}\` cookie is always cleared.`,
  parameters: [
    {
      name: "code",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Authorization code issued by GitHub.",
    },
    {
      name: "state",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "The state created by `GET /auth/github`.",
    },
    {
      name: "error",
      in: "query",
      required: false,
      schema: { type: "string" },
      description: "Set by GitHub when the user cancels, e.g. `access_denied`.",
    },
  ],
  responses: {
    "302": {
      description:
        "Redirect to the frontend. On success the refresh cookie is set; on failure the `error` query parameter carries the error code.",
      headers: {
        ...redirectHeader(
          "`FRONTEND_URL/auth/callback` on success, `FRONTEND_URL/auth/callback?error=INVALID_OAUTH_STATE` (or another error code) on failure.",
        ),
        "Set-Cookie": {
          description: `On success sets the \`${REFRESH_COOKIE_NAME}\` cookie (HttpOnly, SameSite=Strict, Path=/auth, Secure in production) for \`REFRESH_TOKEN_TTL_SECONDS\`. Always clears the \`${OAUTH_STATE_COOKIE_NAME}\` cookie.`,
          schema: { type: "string" },
        },
      },
    },
    ...sharedErrorResponses,
  },
};

const refresh: JsonObject = {
  tags: ["Auth"],
  operationId: "refreshTokens",
  summary: "Rotate the refresh token and issue a new access token",
  description: `Used right after GitHub sign-in to get the first access token, and whenever the access token expires. Reads the refresh token from the \`${REFRESH_COOKIE_NAME}\` cookie, rotates it and returns a new access token. Re-using an already rotated refresh token revokes the whole session.`,
  security: refreshCookieSecurity,
  responses: {
    "200": {
      description: "Tokens refreshed.",
      headers: refreshCookieHeader,
      content: jsonContent("RefreshResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.TOKEN_REFRESHED,
        data: exampleTokenPayload,
      }),
    },
    "401": errorResponse(
      "The refresh cookie is missing, invalid, expired, revoked or reused. The cookie is cleared when the error code is `INVALID_TOKEN`.",
      errorExample(401, ErrorCode.INVALID_TOKEN, ErrorMessage.INVALID_TOKEN),
      clearedCookieHeader,
    ),
    ...sharedErrorResponses,
  },
};

const logout: JsonObject = {
  tags: ["Auth"],
  operationId: "logout",
  summary: "Log out and revoke the current session",
  description: `Blacklists the presented access token and refresh cookie (when valid) and deletes their session. Deleting the session also invalidates every access token issued for it, even one that is not sent with this request. Always succeeds, even when no credentials or invalid ones are sent.`,
  security: [{}, ...bearerSecurity, ...refreshCookieSecurity],
  responses: {
    "200": {
      description: "Logged out.",
      headers: clearedCookieHeader,
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.LOGGED_OUT,
      }),
    },
    ...sharedErrorResponses,
  },
};

const me: JsonObject = {
  tags: ["Auth"],
  operationId: "getCurrentUser",
  summary: "Get the authenticated user",
  security: bearerSecurity,
  responses: {
    "200": {
      description: "The current user.",
      content: jsonContent("UserResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.CURRENT_USER,
        data: exampleUser,
      }),
    },
    "401": errorResponse(
      "The access token is missing (`UNAUTHORIZED`) or invalid, expired, revoked, belongs to a session that was logged out or ended, or belongs to an inactive user (`INVALID_TOKEN`).",
      errorExample(401, ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED),
    ),
    ...sharedErrorResponses,
  },
};

const githubToken: JsonObject = {
  tags: ["Internal"],
  operationId: "getUserGithubToken",
  summary: "Get a user's GitHub access token",
  description:
    "Service-to-service only. Used by the project-service to call GitHub on behalf of a user. Not exposed by the api-gateway, which only proxies `/auth` and `/projects`, and not rate limited. Requires the shared `INTERNAL_API_KEY` in the `x-internal-api-key` header (compared in constant time).",
  security: internalApiKeySecurity,
  parameters: [
    {
      name: "id",
      in: "path",
      required: true,
      schema: { type: "string", format: "uuid" },
    },
  ],
  responses: {
    "200": {
      description: "The decrypted GitHub access token.",
      content: jsonContent("GithubTokenResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.GITHUB_TOKEN,
        data: { accessToken: "gho_16C7e42F292c6912E7710c838347Ae178B4a" },
      }),
    },
    "400": ref("ValidationError"),
    "401": errorResponse(
      "The `x-internal-api-key` header is missing or wrong.",
      errorExample(401, ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED),
    ),
    "404": errorResponse(
      "No active user exists with this id.",
      errorExample(404, ErrorCode.NOT_FOUND, ErrorMessage.NOT_FOUND),
    ),
    "500": sharedErrorResponses["500"],
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "Auth Service API",
    version: "1.0.0",
    description:
      "Authentication for the React deployment platform. Users sign in with GitHub OAuth only (`GET /auth/github`); there is no email/password login. After sign-in the platform keeps its own stateless session: access tokens are short-lived JWTs sent as Bearer tokens, and refresh tokens are rotated and delivered as an HttpOnly cookie scoped to `/auth`. The GitHub access token is stored encrypted and only handed to other services through `/internal`. Unknown routes return a `404` with the standard error envelope.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Health", description: "Liveness and dependency checks." },
    {
      name: "Auth",
      description: "GitHub sign-in, sessions and the current user.",
    },
    {
      name: "Internal",
      description:
        "Service-to-service routes protected by `INTERNAL_API_KEY`. Not reachable through the api-gateway.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/auth/github": { get: githubAuthorize },
    "/auth/github/callback": { get: githubCallback },
    "/auth/refresh": { post: refresh },
    "/auth/logout": { post: logout },
    "/auth/me": { get: me },
    "/internal/users/{id}/github-token": { get: githubToken },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token returned by `/auth/refresh`.",
      },
      internalApiKey: {
        type: "apiKey",
        in: "header",
        name: "x-internal-api-key",
        description: "Shared `INTERNAL_API_KEY` between internal services.",
      },
      refreshCookie: {
        type: "apiKey",
        in: "cookie",
        name: REFRESH_COOKIE_NAME,
        description:
          "HttpOnly refresh token cookie set by `/auth/github/callback` and `/auth/refresh`. Browsers send it automatically to `/auth/*`.",
      },
    },
    schemas,
    responses,
  },
};
