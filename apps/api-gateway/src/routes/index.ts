import { Router } from "express";
import { authRouter } from "./auth.route";
import { docsRouter } from "./docs.route";
import { healthRouter } from "./health.route";

export const router = Router();

router.use(docsRouter);
router.use(healthRouter);
router.use(authRouter);
