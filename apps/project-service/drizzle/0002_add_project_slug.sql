ALTER TABLE "projects" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "projects_slug_unique_idx" ON "projects" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_slug_format_check" CHECK ("projects"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length("projects"."slug") between 1 and 63);