-- M3-1: Jobs core table + statuses

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('draft', 'upcoming', 'ready', 'completed');
  END IF;
END
$body$;

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status job_status NOT NULL DEFAULT 'upcoming',
  job_start TIMESTAMPTZ,
  job_end TIMESTAMPTZ,
  load_in_start TIMESTAMPTZ,
  load_in_end TIMESTAMPTZ,
  load_out_start TIMESTAMPTZ,
  load_out_end TIMESTAMPTZ,
  client_poc_name TEXT,
  client_poc_phone TEXT,
  job_lead_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_status ON jobs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_company ON jobs(client_company_id);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_isolation ON jobs
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE jobs FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE jobs TO logiparty_app;
