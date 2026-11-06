import { Router } from "express";
import { InternalController } from "../controllers/internal.controller";
import { internalAuth } from "../middlewares/internal-auth.middleware";
import { validate } from "@repo/http/middlewares";
import { InternalValidator } from "../validators/internal.validator";
import { asyncHandler } from "@repo/http";

export const internalRouter = Router();

internalRouter.use(internalAuth);

internalRouter.get(
  "/users/:id/github-token",
  validate(InternalValidator.githubToken),
  asyncHandler(InternalController.githubToken),
);
