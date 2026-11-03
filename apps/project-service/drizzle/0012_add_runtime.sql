CREATE TYPE "public"."runtime" AS ENUM('node', 'bun');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "runtime" "runtime" DEFAULT 'node' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "runtime" "runtime" DEFAULT 'node' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployments" ALTER COLUMN "runtime" DROP DEFAULT;