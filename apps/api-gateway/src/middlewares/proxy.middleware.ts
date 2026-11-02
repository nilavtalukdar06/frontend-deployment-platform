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
import { ApiError } from "../utils/api-error";

type TrackedRequest = IncomingMessage & { id?: unknown; log?: Logger };

const TIMEOUT_ERROR_CODES = new Set(["ETIMEDOUT", "ESOCKETTIMEDOUT"]);
const UNREACHABLE_ERROR_CODES = new Set(["ECONNREFUSED", "ENOTFOUND"]);

const toUpstreamError = (err: Error, service: UpstreamService): ApiError => {
  const code = (err as NodeJS.ErrnoException).code ?? "";
  const details = { service: service.name };

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

export const createServiceProxy = (
  service: UpstreamService,
  pathFilter: string,
): RequestHandler =>
  createProxyMiddleware<TrackedRequest, ServerResponse>({
    target: service.url,
    pathFilter,
    changeOrigin: true,
    xfwd: true,
    on: {
      proxyReq: (proxyReq, req) => {
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
        const apiError = toUpstreamError(err, service);

        (req.log ?? logger).error(
          { err, service: service.name, statusCode: apiError.statusCode },
          apiError.message,
        );

        if (!isServerResponse(res) || res.headersSent) {
          res.destroy();
          return;
        }

        res.statusCode = apiError.statusCode;
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
  }) as unknown as RequestHandler;
