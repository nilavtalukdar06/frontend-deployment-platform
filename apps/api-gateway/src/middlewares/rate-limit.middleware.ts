import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { isWebhookRoute } from "../config/webhook-routes";
import { redisClient } from "../lib/redis";
import { ApiError } from "@repo/http";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";

interface RateLimiterOptions {
  windowMs: number;
  limit: number;
  prefix: string;
  skip?: (req: Request) => boolean;
}

const createRateLimiter = ({
  windowMs,
  limit,
  prefix,
  skip,
}: RateLimiterOptions) =>
  rateLimit({
    windowMs,
    limit,
    ...(skip ? { skip } : {}),
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    store: new RedisStore({
      sendCommand: (command: string, ...args: string[]) =>
        redisClient.call(command, ...args) as Promise<RedisReply>,
      prefix,
    }),
    handler: (_req, _res, next) => {
      next(
        new ApiError(
          StatusCodes.TOO_MANY_REQUESTS,
          ErrorMessage.TOO_MANY_REQUESTS,
          ErrorCode.TOO_MANY_REQUESTS,
        ),
      );
    },
  });

export const rateLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  prefix: "gateway-rate-limit:",
  skip: isWebhookRoute,
});

export const webhookRateLimiter = createRateLimiter({
  windowMs: env.WEBHOOK_RATE_LIMIT_WINDOW_MS,
  limit: env.WEBHOOK_RATE_LIMIT_MAX,
  prefix: "gateway-webhook-rate-limit:",
});

export const credentialRateLimiter = createRateLimiter({
  windowMs: env.CREDENTIAL_RATE_LIMIT_WINDOW_MS,
  limit: env.CREDENTIAL_RATE_LIMIT_MAX,
  prefix: "gateway-credential-rate-limit:",
});
