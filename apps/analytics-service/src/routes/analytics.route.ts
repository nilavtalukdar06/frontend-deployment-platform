import { Router } from "express";
import { asyncHandler } from "@repo/http";
import { validate } from "@repo/http/middlewares";
import { AnalyticsController } from "../controllers/analytics.controller";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { AnalyticsValidator } from "../validators/analytics.validator";

export const analyticsRouter = Router();

analyticsRouter.use(AuthenticateMiddleware.handle);

analyticsRouter.get(
  "/projects/:projectId",
  validate(AnalyticsValidator.getProjectAnalytics),
  asyncHandler(AnalyticsController.getProjectAnalytics),
);
