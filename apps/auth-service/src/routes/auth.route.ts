import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.get("/github", asyncHandler(AuthController.githubAuthorize));
authRouter.get("/github/callback", asyncHandler(AuthController.githubCallback));
authRouter.post("/refresh", asyncHandler(AuthController.refresh));
authRouter.post("/logout", asyncHandler(AuthController.logout));
authRouter.get(
  "/me",
  AuthenticateMiddleware.handle,
  asyncHandler(AuthController.me),
);
