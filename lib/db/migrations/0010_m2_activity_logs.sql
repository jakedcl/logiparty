-- M2-6: Activity log for catalog (and future) mutations

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  is_client_visible BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_org ON activity_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(org_id, created_at DESC);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY activity_logs_isolation ON activity_logs
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE activity_logs FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE activity_logs TO logiparty_app;
