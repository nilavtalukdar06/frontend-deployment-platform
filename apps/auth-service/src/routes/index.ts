import { Router } from "express";
import { authRouter } from "./auth.route";
import { healthRouter } from "./health.route";

export const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
