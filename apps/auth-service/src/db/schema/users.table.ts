import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userStatus = pgEnum("user_status", [
  "active",
  "suspended",
  "deactivated",
]);

export const users = pgTable(
  "users",
  {
    id: uuid()
      .primaryKey()
      .default(sql`uuidv7()`),
    email: text().notNull(),
    passwordHash: text().notNull(),
    status: userStatus().notNull().default("active"),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    failedLoginAttempts: integer().notNull().default(0),
    lockedUntil: timestamp({ withTimezone: true }),
    lastLoginAt: timestamp({ withTimezone: true }),
    passwordChangedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    tokenVersion: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_active_unique_idx")
      .on(table.email)
      .where(sql`${table.deletedAt} is null`),
    index("users_created_at_idx").on(table.createdAt),
    index("users_unverified_created_at_idx")
      .on(table.createdAt)
      .where(
        sql`${table.emailVerifiedAt} is null and ${table.deletedAt} is null`,
      ),
    index("users_locked_until_idx")
      .on(table.lockedUntil)
      .where(sql`${table.lockedUntil} is not null`),
    index("users_deleted_at_idx")
      .on(table.deletedAt)
      .where(sql`${table.deletedAt} is not null`),
    check(
      "users_email_lowercase_check",
      sql`${table.email} = lower(${table.email})`,
    ),
    check(
      "users_email_length_check",
      sql`char_length(${table.email}) between 3 and 320`,
    ),
    check(
      "users_failed_login_attempts_check",
      sql`${table.failedLoginAttempts} >= 0`,
    ),
    check("users_token_version_check", sql`${table.tokenVersion} >= 0`),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
