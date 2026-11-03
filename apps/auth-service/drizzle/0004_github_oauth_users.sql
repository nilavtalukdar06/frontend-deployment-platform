ALTER TABLE "users" ADD COLUMN "github_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_login" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_access_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "github_token_scopes" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_github_id_unique_idx" ON "users" USING btree ("github_id");