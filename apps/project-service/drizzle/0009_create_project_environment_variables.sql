CREATE TABLE "project_environment_variables" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"project_id" uuid NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_environment_variables_key_format_check" CHECK ("project_environment_variables"."key" ~ '^[A-Za-z_][A-Za-z0-9_]*$')
);
--> statement-breakpoint
ALTER TABLE "project_environment_variables" ADD CONSTRAINT "project_environment_variables_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "project_environment_variables_project_id_key_unique_idx" ON "project_environment_variables" USING btree ("project_id","key");