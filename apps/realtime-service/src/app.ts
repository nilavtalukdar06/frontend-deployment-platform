import express, { type Application } from "express";
import { docsRouter } from "./routes/docs.route";
import { healthRouter } from "./routes/health.route";

export const createApp = (): Application => {
  const app = express();

  app.disable("x-powered-by");
  app.use(docsRouter);
  app.use(healthRouter);

  return app;
};
