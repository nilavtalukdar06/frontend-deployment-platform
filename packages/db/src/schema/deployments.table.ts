import { sql } from "drizzle-orm";
import {
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  packageManager,
  projectFramework,
  projects,
  runtime,
} from "./projects.table";

export const deploymentStatuses = [
  "queued",
  "cloning",
  "installing",
  "building",
  "uploading",
  "ready",
  "failed",
  "canceled",
] as const;

export const deploymentStatus = pgEnum("deployment_status", deploymentStatuses);

export const deploymentTriggers = ["create", "manual", "push"] as const;

export const deploymentTrigger = pgEnum(
  "deployment_trigger",
  deploymentTriggers,
);

export const deployments = pgTable(
  "deployments",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    projectId: uuid()
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: deploymentStatus().notNull().default("queued"),
    trigger: deploymentTrigger().notNull().default("manual"),
    branch: text().notNull(),
    commitSha: text(),
    framework: projectFramework().notNull(),
    rootDirectory: text().notNull(),
    packageManager: packageManager().notNull(),
    runtime: runtime().notNull(),
    installCommand: text().notNull(),
    buildCommand: text().notNull(),
    outputDirectory: text().notNull(),
    errorMessage: text(),
    startedAt: timestamp({ withTimezone: true }),
    finishedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("deployments_project_id_created_at_idx").on(
      table.projectId,
      table.createdAt,
    ),
    index("deployments_status_idx").on(table.status),
    check(
      "deployments_commit_sha_format_check",
      sql`${table.commitSha} is null or ${table.commitSha} ~ '^[0-9a-f]{40}$'`,
    ),
  ],
);

export type Deployment = typeof deployments.$inferSelect;
export type NewDeployment = typeof deployments.$inferInsert;
