import { Router } from "express";
import { env } from "../config/env";
import { projectService } from "../config/services";
import { WEBHOOK_PATH_PREFIX } from "../config/webhook-routes";
import { createBodyLimit } from "../middlewares/body-limit.middleware";
import { createServiceProxy } from "../middlewares/proxy.middleware";
import { webhookRateLimiter } from "../middlewares/rate-limit.middleware";

export const webhookRouter = Router();

webhookRouter.use(
  WEBHOOK_PATH_PREFIX,
  webhookRateLimiter,
  createBodyLimit(env.MAX_WEBHOOK_BODY_BYTES),
);
webhookRouter.use(
  createServiceProxy(projectService, WEBHOOK_PATH_PREFIX, {
    maxBodyBytes: env.MAX_WEBHOOK_BODY_BYTES,
  }),
);
