CREATE TRIGGER "deployments_set_updated_at"
BEFORE UPDATE ON "deployments"
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
