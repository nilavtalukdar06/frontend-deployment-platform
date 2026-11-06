import { Router } from "express";
import { asyncHandler } from "@repo/http";
import { validate } from "@repo/http/middlewares";
import { DeploymentLogController } from "../controllers/deployment-log.controller";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { DeploymentLogValidator } from "../validators/deployment-log.validator";

export const deploymentLogRouter = Router();

deploymentLogRouter.use(AuthenticateMiddleware.handle);

deploymentLogRouter.get(
  "/:id/logs",
  validate(DeploymentLogValidator.list),
  asyncHandler(DeploymentLogController.list),
);
