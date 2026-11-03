import { Router } from "express";
import { authService } from "../config/services";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { createServiceProxy } from "../middlewares/proxy.middleware";
import { credentialRateLimiter } from "../middlewares/rate-limit.middleware";

export const authRouter = Router();

authRouter.get(
  ["/auth/github", "/auth/github/callback"],
  credentialRateLimiter,
);
authRouter.post("/auth/refresh", credentialRateLimiter);
authRouter.use("/auth", AuthenticateMiddleware.handle);
authRouter.use(createServiceProxy(authService, "/auth"));
