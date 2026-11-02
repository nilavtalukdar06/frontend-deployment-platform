import { Pool } from "pg";
import { env } from "../config/env";
import { logger } from "./logger";

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pgPool.on("error", (err) => {
  logger.error({ err }, "unexpected postgres pool error");
});

export const checkPostgresConnection = async (): Promise<boolean> => {
  try {
    await pgPool.query("SELECT 1");
    return true;
  } catch (err) {
    logger.error({ err }, "postgres health check failed");
    return false;
  }
};
