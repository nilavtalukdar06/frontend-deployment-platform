import { Router } from "express";
import { WebhookController } from "../controllers/webhook.controller";
import { validate } from "@repo/http/middlewares";
import { asyncHandler } from "@repo/http";
import { WebhookValidator } from "../validators/webhook.validator";

export const webhookRouter = Router();

webhookRouter.post(
  "/github/projects/:projectId",
  validate(WebhookValidator.github),
  asyncHandler(WebhookController.github),
);
