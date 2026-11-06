import { createClient } from "@clickhouse/client";
import { env } from "../config/env";
import { logger } from "../lib/logger";

export const clickhouseClient = createClient({
  url: env.CLICKHOUSE_URL,
  username: env.CLICKHOUSE_USERNAME,
  password: env.CLICKHOUSE_PASSWORD,
  request_timeout: env.CLICKHOUSE_REQUEST_TIMEOUT_MS,
});

export const checkClickhouseConnection = async (): Promise<boolean> => {
  try {
    const result = await clickhouseClient.ping();
    return result.success;
  } catch (err) {
    logger.error({ err }, "clickhouse health check failed");
    return false;
  }
};
