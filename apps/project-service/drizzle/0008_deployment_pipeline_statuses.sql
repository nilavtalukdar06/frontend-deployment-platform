ALTER TYPE "public"."deployment_status" ADD VALUE 'cloning' BEFORE 'building';--> statement-breakpoint
ALTER TYPE "public"."deployment_status" ADD VALUE 'installing' BEFORE 'building';--> statement-breakpoint
ALTER TYPE "public"."deployment_status" ADD VALUE 'uploading' BEFORE 'ready';