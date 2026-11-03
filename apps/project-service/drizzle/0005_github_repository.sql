DROP INDEX "projects_user_id_name_active_unique_idx";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_repository_id" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "private" boolean NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_user_id_github_repository_id_active_unique_idx" ON "projects" USING btree ("user_id","github_repository_id") WHERE "projects"."deleted_at" is null;