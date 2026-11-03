CREATE TYPE "public"."deployment_status" AS ENUM('queued', 'building', 'ready', 'failed', 'canceled');--> statement-breakpoint
CREATE TABLE "deployments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid NOT NULL,
	"status" "deployment_status" DEFAULT 'queued' NOT NULL,
	"branch" text NOT NULL,
	"commit_sha" text,
	"framework" "project_framework" NOT NULL,
	"root_directory" text NOT NULL,
	"install_command" text NOT NULL,
	"build_command" text NOT NULL,
	"output_directory" text NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "deployments_commit_sha_format_check" CHECK ("deployments"."commit_sha" is null or "deployments"."commit_sha" ~ '^[0-9a-f]{40}$')
);
--> statement-breakpoint
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deployments_project_id_created_at_idx" ON "deployments" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "deployments_status_idx" ON "deployments" USING btree ("status");