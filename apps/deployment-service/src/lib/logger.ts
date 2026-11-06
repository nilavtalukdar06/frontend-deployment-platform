import { createLogger } from "@repo/logger";
import { env } from "../config/env";

export const logger = createLogger({
  level: env.LOG_LEVEL,
  nodeEnv: env.NODE_ENV,
});
