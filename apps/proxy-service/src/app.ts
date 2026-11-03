import compression from "compression";
import express, { type Application } from "express";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/error-handler.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { siteHandler } from "./middlewares/site.middleware";
import { router } from "./routes";

export const createApp = (): Application => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.set("etag", false);

  app.use(requestLogger);
  app.use(compression());

  app.use(siteHandler);
  app.use(router);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
