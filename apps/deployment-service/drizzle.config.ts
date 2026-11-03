import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";

const directUrl = env.DATABASE_URL.replace("-pooler.", ".");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  migrations: { table: "__drizzle_migrations_project_service" },
  casing: "snake_case",
  dbCredentials: { url: directUrl },
  strict: true,
  verbose: true,
});
