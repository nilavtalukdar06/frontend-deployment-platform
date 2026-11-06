import { Router } from "express";
import { authRouter } from "./auth.route";
import { deploymentRouter } from "./deployment.route";
import { docsRouter } from "./docs.route";
import { healthRouter } from "./health.route";
import { projectRouter } from "./project.route";
import { realtimeRouter } from "./realtime.route";
import { webhookRouter } from "./webhook.route";

export const router = Router();

router.use(docsRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(projectRouter);
router.use(deploymentRouter);
router.use(realtimeRouter);
router.use(webhookRouter);
