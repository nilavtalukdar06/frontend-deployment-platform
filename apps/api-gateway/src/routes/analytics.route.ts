import { Router } from "express";
import { analyticsService } from "../config/services";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { createServiceProxy } from "../middlewares/proxy.middleware";

export const analyticsRouter = Router();

analyticsRouter.use("/analytics", AuthenticateMiddleware.handle);
analyticsRouter.use(createServiceProxy(analyticsService, "/analytics"));
