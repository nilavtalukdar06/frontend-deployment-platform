import * as schema from "@repo/db";
import { createPostgres } from "@repo/db/postgres";
import { env } from "../config/env";
import { logger } from "./logger";

export const { db, checkPostgresConnection, closePostgres } = createPostgres({
  connectionString: env.DATABASE_URL,
  schema,
  logger,
});
