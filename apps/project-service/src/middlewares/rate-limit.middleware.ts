import type { Request } from "express";
import { rateLimit } from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { StatusCodes } from "http-status-codes";
import { env } from "../config/env";
import { redisClient } from "../lib/redis";
import { ApiError } from "@repo/http";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";

const READ_METHODS = new Set(["GET", "HEAD"]);

const isWebhookRequest = (req: Request) => req.path.startsWith("/webhooks/");

const isReadRequest = (req: Request) => READ_METHODS.has(req.method);

const createRateLimiter = (
  limit: number,
  prefix: string,
  skip: (req: Request) => boolean,
) =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
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

export const rateLimiter = createRateLimiter(
  env.RATE_LIMIT_MAX,
  "project-rate-limit:",
  (req) => isWebhookRequest(req) || isReadRequest(req),
);

export const readRateLimiter = createRateLimiter(
  env.READ_RATE_LIMIT_MAX,
  "project-read-rate-limit:",
  (req) => isWebhookRequest(req) || !isReadRequest(req),
);
