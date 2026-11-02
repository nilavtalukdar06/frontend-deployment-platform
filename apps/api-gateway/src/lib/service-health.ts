import { env } from "../config/env";
import type { UpstreamService } from "../config/services";
import { logger } from "./logger";

export const checkServiceHealth = async (
  service: UpstreamService,
): Promise<boolean> => {
  try {
    const response = await fetch(new URL("/health", service.url), {
      signal: AbortSignal.timeout(env.HEALTH_CHECK_TIMEOUT_MS),
    });
    return response.ok;
  } catch (err) {
    logger.error({ err, service: service.name }, "service health check failed");
    return false;
  }
};
