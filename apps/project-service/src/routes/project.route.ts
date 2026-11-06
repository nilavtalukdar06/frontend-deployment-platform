import { Router } from "express";
import { EnvironmentVariableController } from "../controllers/environment-variable.controller";
import { ProjectController } from "../controllers/project.controller";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { validate } from "@repo/http/middlewares";
import { ProjectValidator } from "../validators/project.validator";
import { asyncHandler } from "@repo/http";

export const projectRouter = Router();

projectRouter.use(AuthenticateMiddleware.handle);

projectRouter.post(
  "/",
  validate(ProjectValidator.create),
  asyncHandler(ProjectController.create),
);
projectRouter.get(
  "/",
  validate(ProjectValidator.list),
  asyncHandler(ProjectController.list),
);
projectRouter.get(
  "/repositories",
  validate(ProjectValidator.repositories),
  asyncHandler(ProjectController.listRepositories),
);
projectRouter.get(
  "/:id",
  validate(ProjectValidator.get),
  asyncHandler(ProjectController.get),
);
projectRouter.patch(
  "/:id",
  validate(ProjectValidator.update),
  asyncHandler(ProjectController.update),
);
projectRouter.delete(
  "/:id",
  validate(ProjectValidator.remove),
  asyncHandler(ProjectController.remove),
);
projectRouter.post(
  "/:id/deployments",
  validate(ProjectValidator.redeploy),
  asyncHandler(ProjectController.redeploy),
);
projectRouter.post(
  "/:id/webhook",
  validate(ProjectValidator.enableAutoDeploy),
  asyncHandler(ProjectController.enableAutoDeploy),
);
projectRouter.get(
  "/:id/deployments",
  validate(ProjectValidator.listDeployments),
  asyncHandler(ProjectController.listDeployments),
);
projectRouter.get(
  "/:id/deployments/:deploymentId",
  validate(ProjectValidator.getDeployment),
  asyncHandler(ProjectController.getDeployment),
);
projectRouter.post(
  "/:id/deployments/:deploymentId/cancel",
  validate(ProjectValidator.cancelDeployment),
  asyncHandler(ProjectController.cancelDeployment),
);
projectRouter.get(
  "/:id/environment-variables",
  validate(ProjectValidator.listEnvironmentVariables),
  asyncHandler(EnvironmentVariableController.list),
);
projectRouter.put(
  "/:id/environment-variables/:key",
  validate(ProjectValidator.setEnvironmentVariable),
  asyncHandler(EnvironmentVariableController.set),
);
projectRouter.delete(
  "/:id/environment-variables/:key",
  validate(ProjectValidator.deleteEnvironmentVariable),
  asyncHandler(EnvironmentVariableController.remove),
);
