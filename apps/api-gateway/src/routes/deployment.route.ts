import { Router } from "express";
import { logsService } from "../config/services";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { createServiceProxy } from "../middlewares/proxy.middleware";

export const deploymentRouter = Router();

deploymentRouter.use("/deployment", AuthenticateMiddleware.handle);
deploymentRouter.use(createServiceProxy(logsService, "/deployment/"));
