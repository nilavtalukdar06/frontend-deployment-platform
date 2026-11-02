import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { validate } from "../middlewares/validate.middleware";
import { AuthValidator } from "../validators/auth.validator";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.post(
  "/register",
  validate(AuthValidator.register),
  asyncHandler(AuthController.register),
);
authRouter.post(
  "/login",
  validate(AuthValidator.login),
  asyncHandler(AuthController.login),
);
authRouter.post("/refresh", asyncHandler(AuthController.refresh));
authRouter.post("/logout", asyncHandler(AuthController.logout));
authRouter.get(
  "/me",
  AuthenticateMiddleware.handle,
  asyncHandler(AuthController.me),
);
