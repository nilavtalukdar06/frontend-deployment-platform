CREATE TYPE "public"."package_manager" AS ENUM('npm', 'pnpm', 'yarn', 'bun');--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "package_manager" "package_manager" DEFAULT 'npm' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployments" ADD COLUMN "package_manager" "package_manager" DEFAULT 'npm' NOT NULL;--> statement-breakpoint
ALTER TABLE "deployments" ALTER COLUMN "package_manager" DROP DEFAULT;