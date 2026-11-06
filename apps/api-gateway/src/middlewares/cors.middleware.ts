import { createCorsMiddleware } from "@repo/http/middlewares";
import { env } from "../config/env";

export const corsMiddleware = createCorsMiddleware(env.CORS_ORIGIN);
