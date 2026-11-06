import type { IncomingMessage, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import type { RequestHandler } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { env } from "../config/env";
import type { UpstreamService } from "../config/services";
import { ErrorCode } from "../constants/error-code.enum";
import { ErrorMessage } from "../constants/response-message.enum";
import { logger } from "../lib/logger";
import type { AccessTokenClaims } from "../services/token.service";
import { ApiError } from "../utils/api-error";
import { payloadTooLargeError } from "./body-limit.middleware";

type TrackedRequest = IncomingMessage & {
  id?: unknown;
  log?: Logger;
  auth?: AccessTokenClaims;
};

const USER_ID_HEADER = "x-user-id";
const SESSION_ID_HEADER = "x-session-id";
const BODY_TOO_LARGE_CODE = "E_BODY_TOO_LARGE";

const TIMEOUT_ERROR_CODES = new Set(["ETIMEDOUT", "ESOCKETTIMEDOUT"]);
const UNREACHABLE_ERROR_CODES = new Set(["ECONNREFUSED", "ENOTFOUND"]);

const toProxyError = (
  err: Error,
  service: UpstreamService,
  maxBodyBytes: number,
): ApiError => {
  const code = (err as NodeJS.ErrnoException).code ?? "";
  const details = { service: service.name };

  if (code === BODY_TOO_LARGE_CODE) {
    return payloadTooLargeError(maxBodyBytes);
  }

  if (TIMEOUT_ERROR_CODES.has(code)) {
    return new ApiError(
      StatusCodes.GATEWAY_TIMEOUT,
      ErrorMessage.GATEWAY_TIMEOUT,
      ErrorCode.GATEWAY_TIMEOUT,
      details,
    );
  }

  if (UNREACHABLE_ERROR_CODES.has(code)) {
    return new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      ErrorMessage.SERVICE_UNAVAILABLE,
      ErrorCode.SERVICE_UNAVAILABLE,
      details,
    );
  }

  return new ApiError(
    StatusCodes.BAD_GATEWAY,
    ErrorMessage.BAD_GATEWAY,
    ErrorCode.BAD_GATEWAY,
    details,
  );
};

const isServerResponse = (
  res: ServerResponse | Socket,
): res is ServerResponse => "setHeader" in res;

export interface ServiceProxyOptions {
  maxBodyBytes?: number;
  ws?: boolean;
}

export type ServiceProxy = RequestHandler &
  Pick<ReturnType<typeof createProxyMiddleware>, "upgrade">;

export const createServiceProxy = (
  service: UpstreamService,
  pathFilter: string,
  {
    maxBodyBytes = env.MAX_REQUEST_BODY_BYTES,
    ws = false,
  }: ServiceProxyOptions = {},
): ServiceProxy =>
  createProxyMiddleware<TrackedRequest, ServerResponse>({
    target: service.url,
    pathFilter,
    changeOrigin: true,
    xfwd: true,
    ws,
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.removeHeader(USER_ID_HEADER);
        proxyReq.removeHeader(SESSION_ID_HEADER);

        if (req.auth) {
          proxyReq.setHeader(USER_ID_HEADER, req.auth.userId);
          proxyReq.setHeader(SESSION_ID_HEADER, req.auth.sessionId);
        }

        if (req.headers["content-length"] === undefined) {
          let receivedBytes = 0;

          req.on("data", (chunk: Buffer) => {
            receivedBytes += chunk.length;

            if (receivedBytes > maxBodyBytes) {
              proxyReq.destroy(
                Object.assign(new Error("request body too large"), {
                  code: BODY_TOO_LARGE_CODE,
                }),
              );
            }
          });
        }

        proxyReq.setTimeout(env.PROXY_TIMEOUT_MS, () => {
          proxyReq.destroy(
            Object.assign(new Error("upstream request timed out"), {
              code: "ETIMEDOUT",
            }),
          );
        });

        if (typeof req.id === "string") {
          proxyReq.setHeader("x-request-id", req.id);
        }
      },
      proxyRes: (proxyRes) => {
        for (const header of Object.keys(proxyRes.headers)) {
          if (header.startsWith("access-control-")) {
            delete proxyRes.headers[header];
          }
        }
      },
      error: (err, req, res) => {
        const apiError = toProxyError(err, service, maxBodyBytes);

        (req.log ?? logger)[apiError.statusCode >= 500 ? "error" : "warn"](
          { err, service: service.name, statusCode: apiError.statusCode },
          apiError.message,
        );

        if (!isServerResponse(res) || res.headersSent) {
          res.destroy();
          return;
        }

        res.statusCode = apiError.statusCode;
        res.setHeader("Connection", "close");
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(
          JSON.stringify({
            success: false,
            statusCode: apiError.statusCode,
            errorCode: apiError.errorCode,
            message: apiError.message,
            details: apiError.details,
          }),
        );
      },
    },
  }) as unknown as ServiceProxy;
