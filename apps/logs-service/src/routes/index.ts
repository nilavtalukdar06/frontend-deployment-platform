import { Router } from "express";
import { deploymentLogRouter } from "./deployment-log.route";
import { docsRouter } from "./docs.route";
import { healthRouter } from "./health.route";

export const router = Router();

router.use(docsRouter);
router.use(healthRouter);
router.use("/deployment", deploymentLogRouter);
