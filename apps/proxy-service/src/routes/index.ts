import { Router } from "express";
import { docsRouter } from "./docs.route";
import { healthRouter } from "./health.route";

export const router = Router();

router.use(healthRouter);
router.use(docsRouter);
