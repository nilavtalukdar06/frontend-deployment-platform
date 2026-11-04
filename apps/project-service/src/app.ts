import express, { type Application } from "express";
import { corsMiddleware } from "./middlewares/cors.middleware";
import { applySecurityMiddlewares } from "./middlewares/security.middleware";
import { rateLimiter } from "./middlewares/rate-limit.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { notFoundHandler } from "./middlewares/not-found.middleware";
import { globalErrorHandler } from "./middlewares/error-handler.middleware";
import { router } from "./routes";
import { env } from "./config/env";

export const createApp = (): Application => {
  const app = express();

  applySecurityMiddlewares(app);
  app.use(corsMiddleware);
  app.use(requestLogger);
  app.use(rateLimiter);

  app.use(
    "/webhooks",
    express.raw({
      type: "application/json",
      limit: env.WEBHOOK_MAX_BODY_BYTES,
    }),
  );
  app.use(express.json({ limit: "64kb" }));
  app.use(express.urlencoded({ extended: true, limit: "10kb" }));

  app.use(router);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
