-- M3-2: Job locations (max 5 per job)

CREATE TABLE IF NOT EXISTS job_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT job_locations_sort_order_range CHECK (sort_order >= 0 AND sort_order <= 4),
  UNIQUE (job_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_job_locations_job ON job_locations(job_id);
CREATE INDEX IF NOT EXISTS idx_job_locations_org ON job_locations(org_id);

CREATE OR REPLACE FUNCTION enforce_max_job_locations()
RETURNS TRIGGER AS $body$
DECLARE
  loc_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO loc_count FROM job_locations WHERE job_id = NEW.job_id;
  IF TG_OP = 'INSERT' AND loc_count >= 5 THEN
    RAISE EXCEPTION 'A job may have at most 5 locations';
  END IF;
  RETURN NEW;
END;
$body$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_max_job_locations ON job_locations;
CREATE TRIGGER trg_max_job_locations
  BEFORE INSERT ON job_locations
  FOR EACH ROW EXECUTE FUNCTION enforce_max_job_locations();

ALTER TABLE job_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_locations_isolation ON job_locations
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE job_locations FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE job_locations TO logiparty_app;
