import { Router } from "express";
import { projectService } from "../config/services";
import { AuthenticateMiddleware } from "../middlewares/authenticate.middleware";
import { createServiceProxy } from "../middlewares/proxy.middleware";

export const projectRouter = Router();

projectRouter.use("/projects", AuthenticateMiddleware.handle);
projectRouter.use(createServiceProxy(projectService, "/projects"));
