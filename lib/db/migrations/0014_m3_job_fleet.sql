-- M3-6: Assign fleet vehicles to jobs

CREATE TABLE IF NOT EXISTS job_fleet_assignments (
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  fleet_vehicle_id UUID NOT NULL REFERENCES fleet_vehicles(id) ON DELETE RESTRICT,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, fleet_vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_job_fleet_assignments_org ON job_fleet_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_job_fleet_assignments_vehicle ON job_fleet_assignments(fleet_vehicle_id);

ALTER TABLE job_fleet_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_fleet_assignments_isolation ON job_fleet_assignments
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE job_fleet_assignments FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE job_fleet_assignments TO logiparty_app;
