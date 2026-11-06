import { Router } from "express";
import { realtimeService } from "../config/services";
import { createServiceProxy } from "../middlewares/proxy.middleware";

export const realtimeProxy = createServiceProxy(
  realtimeService,
  "/socket.io/",
  { ws: true },
);

export const realtimeRouter = Router();

realtimeRouter.use(realtimeProxy);
