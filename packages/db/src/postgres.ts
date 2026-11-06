import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import type { Logger } from "pino";
import ws from "ws";

export interface CreatePostgresOptions<
  TSchema extends Record<string, unknown>,
> {
  connectionString: string;
  schema: TSchema;
  logger: Logger;
  max?: number;
}

export const createPostgres = <TSchema extends Record<string, unknown>>({
  connectionString,
  schema,
  logger,
  max = 10,
}: CreatePostgresOptions<TSchema>) => {
  neonConfig.webSocketConstructor = ws;

  const pgPool = new Pool({
    connectionString,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pgPool.on("error", (err: Error) => {
    logger.error({ err }, "unexpected postgres pool error");
  });

  const db = drizzle({ client: pgPool, schema, casing: "snake_case" });

  const checkPostgresConnection = async (): Promise<boolean> => {
    try {
      await pgPool.query("SELECT 1");
      return true;
    } catch (err) {
      logger.error({ err }, "postgres health check failed");
      return false;
    }
  };

  const closePostgres = async (): Promise<void> => {
    try {
      await pgPool.end();
    } catch (err) {
      logger.error({ err }, "failed to close postgres pool");
    }
  };

  return { pgPool, db, checkPostgresConnection, closePostgres };
};
