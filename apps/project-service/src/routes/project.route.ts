import { Router } from "express";
import { ProjectController } from "../controllers/project.controller";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { ProjectValidator } from "../validators/project.validator";
import { asyncHandler } from "../utils/async-handler";

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
