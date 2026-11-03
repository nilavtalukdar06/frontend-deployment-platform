CREATE TRIGGER "project_environment_variables_set_updated_at"
BEFORE UPDATE ON "project_environment_variables"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
