import { createRequestLogger } from "@repo/logger/http";
import { logger } from "../lib/logger";

export const requestLogger = createRequestLogger(logger);
