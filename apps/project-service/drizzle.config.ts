import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { env } from "./src/config/env";

const pooledUrl = env.DATABASE_URL || "";
const directUrl = env.DATABASE_URL.replace("-pooler.", ".");

if (!pooledUrl || !directUrl) {
  throw new Error("DATABASE_URL is required to run drizzle-kit");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "../../packages/db/src/schema/index.ts",
  out: "./drizzle",
  migrations: { table: "__drizzle_migrations_project_service" },
  casing: "snake_case",
  dbCredentials: { url: directUrl },
  strict: true,
  verbose: true,
});
