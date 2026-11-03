import { Router } from "express";
import { docsRouter } from "./docs.route";
import { healthRouter } from "./health.route";
import { projectRouter } from "./project.route";

export const router = Router();

router.use(docsRouter);
router.use(healthRouter);
router.use("/projects", projectRouter);
