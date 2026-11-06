import express, { type Application } from "express";
import {
  applySecurityMiddlewares,
  notFoundHandler,
} from "@repo/http/middlewares";
import { globalErrorHandler } from "./middlewares/error-handler.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { router } from "./routes";

export const createApp = (): Application => {
  const app = express();

  applySecurityMiddlewares(app);
  app.use(requestLogger);

  app.use(router);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
