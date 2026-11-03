import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const projectFrameworks = [
  "vite",
  "create-react-app",
  "next",
  "remix",
  "gatsby",
  "other",
] as const;

export const projectFramework = pgEnum("project_framework", projectFrameworks);

export const projects = pgTable(
  "projects",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    userId: uuid().notNull(),
    name: text().notNull(),
    description: text(),
    repositoryUrl: text().notNull(),
    branch: text().notNull().default("main"),
    framework: projectFramework().notNull().default("vite"),
    rootDirectory: text().notNull().default("."),
    installCommand: text().notNull().default("npm install"),
    buildCommand: text().notNull().default("npm run build"),
    outputDirectory: text().notNull().default("dist"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("projects_user_id_name_active_unique_idx")
      .on(table.userId, table.name)
      .where(sql`${table.deletedAt} is null`),
    index("projects_user_id_created_at_idx").on(table.userId, table.createdAt),
    index("projects_deleted_at_idx")
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} is not null`),
    check(
      "projects_name_length_check",
      sql`char_length(${table.name}) between 1 and 100`,
    ),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
