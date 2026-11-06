import express, { type Application } from "express";
import { bodyLimit } from "./middlewares/body-limit.middleware";
import { corsMiddleware } from "./middlewares/cors.middleware";
import {
  applySecurityMiddlewares,
  notFoundHandler,
} from "@repo/http/middlewares";
import { rateLimiter } from "./middlewares/rate-limit.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { globalErrorHandler } from "./middlewares/error-handler.middleware";
import { router } from "./routes";

export const createApp = (): Application => {
  const app = express();

  applySecurityMiddlewares(app);
  app.use(corsMiddleware);
  app.use(requestLogger);
  app.use(rateLimiter);
  app.use(bodyLimit);

  app.use(router);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
