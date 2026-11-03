CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER "projects_set_updated_at"
BEFORE UPDATE ON "projects"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
