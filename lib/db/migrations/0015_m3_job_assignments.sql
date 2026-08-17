-- M3-7: Crew assignments (load-in / load-out)

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_phase') THEN
    CREATE TYPE assignment_phase AS ENUM ('LoadIn', 'LoadOut');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_role') THEN
    CREATE TYPE assignment_role AS ENUM ('Driver', 'Laborer', 'Lead');
  END IF;
END
$body$;

CREATE TABLE IF NOT EXISTS job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase assignment_phase NOT NULL,
  assigned_role assignment_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, user_id, phase)
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_job ON job_assignments(job_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_org ON job_assignments(org_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_user ON job_assignments(user_id);

ALTER TABLE job_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY job_assignments_isolation ON job_assignments
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE job_assignments FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE job_assignments TO logiparty_app;
