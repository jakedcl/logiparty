-- M5-1: Staff availability / time-off requests

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'availability_status') THEN
    CREATE TYPE availability_status AS ENUM ('Pending', 'Approved', 'Denied');
  END IF;
END
$body$;

CREATE TABLE IF NOT EXISTS availability_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status availability_status NOT NULL DEFAULT 'Pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_availability_requests_org ON availability_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_user ON availability_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_availability_requests_status ON availability_requests(status);

ALTER TABLE availability_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY availability_requests_isolation ON availability_requests
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE availability_requests FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE availability_requests TO logiparty_app;
