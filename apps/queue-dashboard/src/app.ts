import compression from "compression";
import express, { type Application } from "express";
import { bullBoardRouter } from "./lib/bull-board";
import { dashboardAuth } from "./middlewares/basic-auth.middleware";
import {
  globalErrorHandler,
  notFoundHandler,
} from "./middlewares/error-handler.middleware";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { router } from "./routes";

export const createApp = (): Application => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(requestLogger);
  app.use(compression());

  app.use(router);
  app.use("/admin/queues", dashboardAuth, bullBoardRouter);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
};
