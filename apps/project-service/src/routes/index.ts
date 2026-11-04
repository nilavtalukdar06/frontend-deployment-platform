import { Router } from "express";
import { docsRouter } from "./docs.route";
import { healthRouter } from "./health.route";
import { projectRouter } from "./project.route";
import { webhookRouter } from "./webhook.route";

export const router = Router();

router.use(docsRouter);
router.use(healthRouter);
router.use("/projects", projectRouter);
router.use("/webhooks", webhookRouter);
