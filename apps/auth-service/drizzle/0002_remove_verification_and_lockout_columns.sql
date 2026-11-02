ALTER TABLE "users" DROP CONSTRAINT "users_failed_login_attempts_check";--> statement-breakpoint
DROP INDEX "users_unverified_created_at_idx";--> statement-breakpoint
DROP INDEX "users_locked_until_idx";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "failed_login_attempts";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "locked_until";