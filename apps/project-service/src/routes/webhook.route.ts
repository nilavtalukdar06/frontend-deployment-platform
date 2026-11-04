import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";
import { validate } from "../middlewares/validate.middleware";
import { asyncHandler } from "../utils/async-handler";
import { WebhookValidator } from "../validators/webhook.validator";

export const webhookRouter = Router();

webhookRouter.post(
  "/github/projects/:projectId",
  validate(WebhookValidator.github),
  asyncHandler(WebhookController.github),
);
