-- M3-4: Job inventory line assignments

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_inventory_item_type') THEN
    CREATE TYPE job_inventory_item_type AS ENUM ('client', 'org');
  END IF;
END
$body$;

CREATE TABLE IF NOT EXISTS job_inventory_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_type job_inventory_item_type NOT NULL,
  client_item_id UUID REFERENCES client_inventory_items(id) ON DELETE RESTRICT,
  org_item_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity_assigned INTEGER NOT NULL DEFAULT 0,
  quantity_loaded INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT job_inventory_lines_item_fk CHECK (
    (item_type = 'client' AND client_item_id IS NOT NULL AND org_item_id IS NULL)
    OR
    (item_type = 'org' AND org_item_id IS NOT NULL AND client_item_id IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_job_inventory_lines_job ON job_inventory_lines(job_id);
CREATE INDEX IF NOT EXISTS idx_job_inventory_lines_org ON job_inventory_lines(org_id);

ALTER TABLE job_inventory_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_inventory_lines_isolation ON job_inventory_lines
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE job_inventory_lines FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE job_inventory_lines TO logiparty_app;
