import { createGlobalErrorHandler } from "@repo/http/middlewares";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export const globalErrorHandler = createGlobalErrorHandler({
  logger,
  exposeStack: env.NODE_ENV === "development",
});
