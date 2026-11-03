import { Router } from "express";
import { InternalController } from "../controllers/internal.controller";
import { internalAuth } from "../middlewares/internal-auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { InternalValidator } from "../validators/internal.validator";
import { asyncHandler } from "../utils/async-handler";

export const internalRouter = Router();

internalRouter.use(internalAuth);

internalRouter.get(
  "/users/:id/github-token",
  validate(InternalValidator.githubToken),
  asyncHandler(InternalController.githubToken),
);
