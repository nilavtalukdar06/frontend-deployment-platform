CREATE TYPE "public"."project_framework" AS ENUM('vite', 'create-react-app', 'next', 'remix', 'gatsby', 'other');--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"repository_url" text NOT NULL,
	"branch" text DEFAULT 'main' NOT NULL,
	"framework" "project_framework" DEFAULT 'vite' NOT NULL,
	"root_directory" text DEFAULT '.' NOT NULL,
	"install_command" text DEFAULT 'npm install' NOT NULL,
	"build_command" text DEFAULT 'npm run build' NOT NULL,
	"output_directory" text DEFAULT 'dist' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "projects_name_length_check" CHECK (char_length("projects"."name") between 1 and 100)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "projects_user_id_name_active_unique_idx" ON "projects" USING btree ("user_id","name") WHERE "projects"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "projects_user_id_created_at_idx" ON "projects" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "projects_deleted_at_idx" ON "projects" USING btree ("deleted_at") WHERE "projects"."deleted_at" is not null;