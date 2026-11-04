CREATE TYPE "public"."deployment_trigger" AS ENUM('create', 'manual', 'push');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_webhook_id" bigint;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "github_webhook_secret" text;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "trigger" "deployment_trigger" DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_github_webhook_pair_check" CHECK (("projects"."github_webhook_id" is null) = ("projects"."github_webhook_secret" is null));