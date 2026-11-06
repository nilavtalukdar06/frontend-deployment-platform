import { Router } from "express";
import { DeploymentController } from "../controllers/deployment.controller";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { validate } from "@repo/http/middlewares";
import { DeploymentValidator } from "../validators/deployment.validator";
import { asyncHandler } from "@repo/http";

export const deploymentRouter = Router();

deploymentRouter.use(AuthenticateMiddleware.handle);

deploymentRouter.get(
  "/:id/logs",
  validate(DeploymentValidator.listLogs),
  asyncHandler(DeploymentController.listLogs),
);
