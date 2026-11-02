import { ErrorCode } from "../constants/error-code.enum";
import {
  ErrorMessage,
  SuccessMessage,
} from "../constants/response-message.enum";
import { authService } from "../config/services";

type JsonObject = Record<string, unknown>;
type Headers = Record<string, JsonObject>;

const REFRESH_COOKIE_NAME = "refresh_token";

const AuthServiceMessage = {
  VALIDATION_ERROR: "Validation failed for the given request",
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED: "Too many failed login attempts, please try again later",
  ACCOUNT_INACTIVE: "This account is not active",
  REGISTERED: "Account created successfully",
  LOGGED_IN: "Logged in successfully",
  TOKEN_REFRESHED: "Tokens refreshed successfully",
  LOGGED_OUT: "Logged out successfully",
  CURRENT_USER: "Current user retrieved successfully",
} as const;

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
  message: string,
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
  email: "jane.doe@example.com",
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
    description: `Forwarded unchanged from the auth-service. Sets the \`${REFRESH_COOKIE_NAME}\` cookie (HttpOnly, SameSite=Strict, Path=/auth, Secure in production).`,
    schema: { type: "string" },
  },
};

const clearedCookieHeader: Headers = {
  "Set-Cookie": {
    description: `Forwarded unchanged from the auth-service. Clears the \`${REFRESH_COOKIE_NAME}\` cookie.`,
    schema: { type: "string" },
  },
};

const sharedErrorResponses = {
  "429": ref("TooManyRequests"),
  "500": ref("InternalServerError"),
};

const proxiedErrorResponses = {
  ...sharedErrorResponses,
  "413": ref("PayloadTooLarge"),
  "502": ref("BadGateway"),
  "503": ref("ServiceUnavailable"),
  "504": ref("GatewayTimeout"),
};

const emailSchema: JsonObject = {
  type: "string",
  format: "email",
  minLength: 3,
  maxLength: 320,
  description:
    "Trimmed and lower-cased by the service before validation and storage.",
  example: "jane.doe@example.com",
};

const schemas: Record<string, JsonObject> = {
  RegisterRequest: {
    type: "object",
    additionalProperties: false,
    required: ["email", "password"],
    properties: {
      email: emailSchema,
      password: {
        type: "string",
        format: "password",
        minLength: 10,
        maxLength: 128,
        example: "correct-horse-battery",
      },
    },
  },
  LoginRequest: {
    type: "object",
    additionalProperties: false,
    required: ["email", "password"],
    properties: {
      email: emailSchema,
      password: {
        type: "string",
        format: "password",
        minLength: 1,
        maxLength: 128,
        example: "correct-horse-battery",
      },
    },
  },
  UserStatus: {
    type: "string",
    enum: ["active", "suspended", "deactivated"],
  },
  User: {
    type: "object",
    required: ["id", "email", "status", "lastLoginAt", "createdAt"],
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      status: { $ref: "#/components/schemas/UserStatus" },
      lastLoginAt: {
        type: ["string", "null"],
        format: "date-time",
        description: "Null until the first successful login.",
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
  LoginData: {
    type: "object",
    required: ["user", "accessToken", "tokenType", "expiresIn"],
    allOf: [
      { $ref: "#/components/schemas/AccessTokenPayload" },
      {
        type: "object",
        required: ["user"],
        properties: { user: { $ref: "#/components/schemas/User" } },
      },
    ],
  },
  HealthData: {
    type: "object",
    required: ["gateway", "redis", "authService", "uptime"],
    properties: {
      gateway: { type: "string", enum: ["up"] },
      redis: {
        type: "string",
        enum: ["up", "down"],
        description:
          "Result of a `PING` against the Redis instance shared with the auth-service. The gateway uses it for rate limiting and to look up revoked access tokens.",
      },
      authService: {
        type: "string",
        enum: ["up", "down"],
        description:
          "Result of `GET /health` on the auth-service, treated as down on a non-2xx response, a connection error or after `HEALTH_CHECK_TIMEOUT_MS`.",
      },
      uptime: {
        type: "number",
        description: "Gateway process uptime in seconds.",
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
  LoginResponse: {
    allOf: [
      { $ref: "#/components/schemas/MessageResponse" },
      {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/LoginData" } },
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
          "Optional context. For `VALIDATION_ERROR` it is the Zod tree-ified error (`errors` plus per-field `properties`); for `ACCOUNT_LOCKED` it is `{ retryAfterSeconds }`; for `NOT_FOUND` it is `{ path }`; for `PAYLOAD_TOO_LARGE` it is `{ maxBytes }`; for `BAD_GATEWAY`, `SERVICE_UNAVAILABLE` and `GATEWAY_TIMEOUT` it is `{ service }`. Errors produced by the auth-service are forwarded unchanged.",
      },
      stack: {
        type: "string",
        description:
          "Stack trace. Only present when the service that produced the error runs with `NODE_ENV=development`.",
      },
    },
  },
};

const responses: Record<string, JsonObject> = {
  ValidationError: errorResponse(
    "The request body failed validation.",
    errorExample(
      400,
      ErrorCode.VALIDATION_ERROR,
      AuthServiceMessage.VALIDATION_ERROR,
      {
        errors: [],
        properties: {
          password: {
            errors: ["Too small: expected string to have >=10 characters"],
          },
        },
      },
    ),
  ),
  TooManyRequests: errorResponse(
    "The per-client rate limit was exceeded, either at the gateway or at the auth-service. The gateway applies `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` to every route and, on top of that, `CREDENTIAL_RATE_LIMIT_MAX` requests per `CREDENTIAL_RATE_LIMIT_WINDOW_MS` to `/auth/register`, `/auth/login` and `/auth/refresh`. Clients are identified by IP address and counters live in Redis, so limits hold across gateway instances. Standard `RateLimit-*` headers are returned on every response.",
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
  PayloadTooLarge: errorResponse(
    "The request body is larger than `MAX_REQUEST_BODY_BYTES` (10240 bytes by default). Rejected from the `Content-Length` header before the body is read; for chunked bodies the request is aborted as soon as the limit is crossed and the connection is closed.",
    errorExample(
      413,
      ErrorCode.PAYLOAD_TOO_LARGE,
      ErrorMessage.PAYLOAD_TOO_LARGE,
      { maxBytes: 10240 },
    ),
  ),
  BadGateway: errorResponse(
    "The gateway could not get a valid response from the upstream service.",
    errorExample(502, ErrorCode.BAD_GATEWAY, ErrorMessage.BAD_GATEWAY, {
      service: authService.name,
    }),
  ),
  ServiceUnavailable: errorResponse(
    "The upstream service refused the connection or could not be resolved, or the gateway could not reach Redis to check whether a bearer token was revoked. Requests that need a bearer token fail closed in that case.",
    errorExample(
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorMessage.SERVICE_UNAVAILABLE,
      { service: authService.name },
    ),
  ),
  GatewayTimeout: errorResponse(
    "The upstream service did not respond within `PROXY_TIMEOUT_MS`.",
    errorExample(504, ErrorCode.GATEWAY_TIMEOUT, ErrorMessage.GATEWAY_TIMEOUT, {
      service: authService.name,
    }),
  ),
};

const bearerSecurity = [{ bearerAuth: [] }];
const refreshCookieSecurity = [{ refreshCookie: [] }];

const health: JsonObject = {
  security: [],
  tags: ["Health"],
  operationId: "getHealth",
  summary: "Gateway and upstream health",
  description:
    "Served by the gateway itself (not proxied). Pings Redis, calls `GET /health` on every upstream service and responds with 503 when any of them is down.",
  responses: {
    "200": {
      description: "The gateway, Redis and all upstream services are healthy.",
      content: jsonContent("HealthResponse", {
        success: true,
        statusCode: 200,
        message: SuccessMessage.HEALTH_OK,
        data: {
          gateway: "up",
          redis: "up",
          authService: "up",
          uptime: 1234.56,
        },
      }),
    },
    "503": {
      description:
        "Redis or at least one upstream service is down. The body uses the success envelope with `success: false`.",
      content: jsonContent("HealthResponse", {
        success: false,
        statusCode: 503,
        message: ErrorMessage.SERVICE_UNAVAILABLE,
        data: {
          gateway: "up",
          redis: "up",
          authService: "down",
          uptime: 1234.56,
        },
      }),
    },
    "429": sharedErrorResponses["429"],
  },
};

const register: JsonObject = {
  security: [],
  tags: ["Auth"],
  operationId: "register",
  summary: "Create an account",
  description:
    "Public. Proxied to the auth-service `POST /auth/register`. Subject to the stricter credential rate limit.",
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/RegisterRequest" },
      },
    },
  },
  responses: {
    "201": {
      description: "Account created.",
      content: jsonContent("UserResponse", {
        success: true,
        statusCode: 201,
        message: AuthServiceMessage.REGISTERED,
        data: exampleUser,
      }),
    },
    "400": ref("ValidationError"),
    "409": errorResponse(
      "An account with this email already exists.",
      errorExample(
        409,
        ErrorCode.CONFLICT,
        AuthServiceMessage.EMAIL_ALREADY_REGISTERED,
      ),
    ),
    ...proxiedErrorResponses,
  },
};

const login: JsonObject = {
  security: [],
  tags: ["Auth"],
  operationId: "login",
  summary: "Log in with email and password",
  description:
    "Public. Proxied to the auth-service `POST /auth/login`. Subject to the stricter credential rate limit. Returns a short-lived access token in the body and sets the refresh token as an HttpOnly cookie. After `LOGIN_MAX_ATTEMPTS` failed attempts within `LOGIN_ATTEMPT_WINDOW_SECONDS` the email is locked for `LOGIN_LOCK_SECONDS`.",
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/LoginRequest" },
      },
    },
  },
  responses: {
    "200": {
      description: "Logged in.",
      headers: refreshCookieHeader,
      content: jsonContent("LoginResponse", {
        success: true,
        statusCode: 200,
        message: AuthServiceMessage.LOGGED_IN,
        data: { user: exampleUser, ...exampleTokenPayload },
      }),
    },
    "400": ref("ValidationError"),
    "401": errorResponse(
      "Unknown email or wrong password.",
      errorExample(
        401,
        ErrorCode.INVALID_CREDENTIALS,
        AuthServiceMessage.INVALID_CREDENTIALS,
      ),
    ),
    "403": errorResponse(
      "The credentials are valid but the account is not active.",
      errorExample(
        403,
        ErrorCode.FORBIDDEN,
        AuthServiceMessage.ACCOUNT_INACTIVE,
      ),
    ),
    "423": errorResponse(
      "Too many failed attempts; the account is temporarily locked.",
      errorExample(
        423,
        ErrorCode.ACCOUNT_LOCKED,
        AuthServiceMessage.ACCOUNT_LOCKED,
        {
          retryAfterSeconds: 900,
        },
      ),
      {
        "Retry-After": {
          description: "Seconds until the lock expires.",
          schema: { type: "integer", example: 900 },
        },
      },
    ),
    ...proxiedErrorResponses,
  },
};

const refresh: JsonObject = {
  tags: ["Auth"],
  operationId: "refreshTokens",
  summary: "Rotate the refresh token and issue a new access token",
  description: `Public. Proxied to the auth-service \`POST /auth/refresh\`. Subject to the stricter credential rate limit. Reads the refresh token from the \`${REFRESH_COOKIE_NAME}\` cookie, rotates it and returns a new access token. Re-using an already rotated refresh token revokes the whole session.`,
  security: refreshCookieSecurity,
  responses: {
    "200": {
      description: "Tokens refreshed.",
      headers: refreshCookieHeader,
      content: jsonContent("RefreshResponse", {
        success: true,
        statusCode: 200,
        message: AuthServiceMessage.TOKEN_REFRESHED,
        data: exampleTokenPayload,
      }),
    },
    "401": errorResponse(
      "The refresh cookie is missing, invalid, expired, revoked or reused. The cookie is cleared when the error code is `INVALID_TOKEN`.",
      errorExample(401, ErrorCode.INVALID_TOKEN, ErrorMessage.INVALID_TOKEN),
      clearedCookieHeader,
    ),
    ...proxiedErrorResponses,
  },
};

const logout: JsonObject = {
  tags: ["Auth"],
  operationId: "logout",
  summary: "Log out and revoke the current session",
  description: `Public. Proxied to the auth-service \`POST /auth/logout\`. Blacklists the presented access token and refresh cookie (when valid) and deletes their session. Always succeeds, even when no credentials or invalid ones are sent.`,
  security: [{}, ...bearerSecurity, ...refreshCookieSecurity],
  responses: {
    "200": {
      description: "Logged out.",
      headers: clearedCookieHeader,
      content: jsonContent("MessageResponse", {
        success: true,
        statusCode: 200,
        message: AuthServiceMessage.LOGGED_OUT,
      }),
    },
    ...proxiedErrorResponses,
  },
};

const me: JsonObject = {
  tags: ["Auth"],
  operationId: "getCurrentUser",
  summary: "Get the authenticated user",
  description:
    "Protected. The gateway verifies the access token (signature, issuer, audience, expiry and revocation) before proxying to the auth-service `GET /auth/me`, which additionally checks that the user is still active.",
  security: bearerSecurity,
  responses: {
    "200": {
      description: "The current user.",
      content: jsonContent("UserResponse", {
        success: true,
        statusCode: 200,
        message: AuthServiceMessage.CURRENT_USER,
        data: exampleUser,
      }),
    },
    "401": errorResponse(
      "The bearer token is missing (`UNAUTHORIZED`) or is invalid, expired, revoked, not an access token, or belongs to an inactive user (`INVALID_TOKEN`). Produced by the gateway, except for the inactive-user case which comes from the auth-service.",
      errorExample(401, ErrorCode.UNAUTHORIZED, ErrorMessage.UNAUTHORIZED),
    ),
    ...proxiedErrorResponses,
  },
};

export const openApiDocument: JsonObject = {
  openapi: "3.1.0",
  info: {
    title: "API Gateway",
    version: "1.0.0",
    description:
      "Single entry point for the React deployment platform. Routes under `/auth` are reverse-proxied to the auth-service with the method, path, query string, headers, cookies and body left untouched, so request and response contracts are identical to the auth-service.\n\n**Authentication.** The gateway authenticates every `/auth/*` request except the public routes `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` and `POST /auth/logout`; any other method or path under `/auth` is denied by default without a valid bearer token. It verifies the HS256 access token against the shared `JWT_ACCESS_SECRET`, `JWT_ISSUER` and `JWT_AUDIENCE`, rejects refresh tokens, and checks the Redis revocation list written by the auth-service on logout. Missing tokens give `401 UNAUTHORIZED`; invalid, expired or revoked tokens give `401 INVALID_TOKEN`. The `Authorization` header is still forwarded, and verified requests also carry `x-user-id` and `x-session-id` headers to the upstream. Client-supplied `x-user-id` and `x-session-id` headers are always removed.\n\n**Rate limiting.** Redis-backed, per client IP, shared across gateway instances, with a stricter limit on the credential routes (see the `429` response). If Redis is unavailable the limiter lets requests through while authenticated routes fail with `503`.\n\n**Request size.** Bodies larger than `MAX_REQUEST_BODY_BYTES` are rejected with `413 PAYLOAD_TOO_LARGE`. Bodies are streamed to the upstream, never parsed.\n\n**Other behaviour.** Security headers, CORS (the single source of CORS headers; any `Access-Control-*` header sent by an upstream service is dropped), an `x-request-id` header (generated when absent and forwarded upstream) and `X-Forwarded-*` headers are added. Unknown routes return a `404` with the standard error envelope; upstream failures return `502`, `503` or `504` with the same envelope.",
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    {
      name: "Health",
      description: "Gateway liveness and upstream service checks.",
    },
    {
      name: "Auth",
      description:
        "Registration, sessions and the current user, proxied to the auth-service. Public routes are listed in the API description; everything else requires a bearer token.",
    },
  ],
  paths: {
    "/health": { get: health },
    "/auth/register": { post: register },
    "/auth/login": { post: login },
    "/auth/refresh": { post: refresh },
    "/auth/logout": { post: logout },
    "/auth/me": { get: me },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description:
          "Access token returned by `/auth/login` or `/auth/refresh`. Verified by the gateway and again by the auth-service; the `Authorization` header is forwarded unchanged.",
      },
      refreshCookie: {
        type: "apiKey",
        in: "cookie",
        name: REFRESH_COOKIE_NAME,
        description:
          "HttpOnly refresh token cookie set by `/auth/login` and `/auth/refresh`. Browsers send it automatically to `/auth/*`.",
      },
    },
    schemas,
    responses,
  },
};
