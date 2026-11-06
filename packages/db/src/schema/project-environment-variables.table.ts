import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { projects } from "./projects.table";

export const projectEnvironmentVariables = pgTable(
  "project_environment_variables",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    key: text().notNull(),
    value: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("project_environment_variables_project_id_key_unique_idx").on(
      table.projectId,
      table.key,
    ),
    check(
      "project_environment_variables_key_format_check",
      sql`${table.key} ~ '^[A-Za-z_][A-Za-z0-9_]*$'`,
    ),
  ],
);

export type ProjectEnvironmentVariable =
  typeof projectEnvironmentVariables.$inferSelect;
export type NewProjectEnvironmentVariable =
  typeof projectEnvironmentVariables.$inferInsert;
