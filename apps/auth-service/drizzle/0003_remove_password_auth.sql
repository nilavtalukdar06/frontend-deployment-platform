DELETE FROM "users";--> statement-breakpoint
DROP INDEX "users_email_active_unique_idx";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_hash";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password_changed_at";