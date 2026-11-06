import { randomUUID } from "node:crypto";
import type { Logger } from "pino";
import pinoHttp, { type HttpLogger } from "pino-http";

export const createRequestLogger = (logger: Logger): HttpLogger =>
  pinoHttp({
    logger,
    genReqId: (req, res) => {
      const existingId = req.headers["x-request-id"];
      const id = typeof existingId === "string" ? existingId : randomUUID();
      res.setHeader("x-request-id", id);
      return id;
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  });
