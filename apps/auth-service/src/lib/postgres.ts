import * as schema from "../db/schema";
import { createPostgres } from "@repo/db/postgres";
import { env } from "../config/env";
import { logger } from "./logger";

export const { pgPool, db, checkPostgresConnection } = createPostgres({
  connectionString: env.DATABASE_URL,
  schema,
  logger,
});
