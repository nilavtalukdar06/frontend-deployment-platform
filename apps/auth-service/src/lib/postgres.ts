import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import { env } from "../config/env";
import * as schema from "../db/schema";
import { logger } from "./logger";

neonConfig.webSocketConstructor = ws;

export const pgPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pgPool.on("error", (err: Error) => {
  logger.error({ err }, "unexpected postgres pool error");
});

export const db = drizzle({ client: pgPool, schema, casing: "snake_case" });

export const checkPostgresConnection = async (): Promise<boolean> => {
  try {
    await pgPool.query("SELECT 1");
    return true;
  } catch (err) {
    logger.error({ err }, "postgres health check failed");
    return false;
  }
};
