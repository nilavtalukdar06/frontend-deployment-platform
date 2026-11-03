ALTER TABLE "projects" ALTER COLUMN "framework" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "framework" SET DEFAULT 'vite'::text;--> statement-breakpoint
DROP TYPE "public"."project_framework";--> statement-breakpoint
CREATE TYPE "public"."project_framework" AS ENUM('vite');--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "framework" SET DEFAULT 'vite'::"public"."project_framework";--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "framework" SET DATA TYPE "public"."project_framework" USING "framework"::"public"."project_framework";