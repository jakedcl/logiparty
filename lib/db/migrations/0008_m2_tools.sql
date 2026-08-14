-- M2-4: Tools catalog

CREATE TABLE IF NOT EXISTS tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku TEXT,
  name TEXT NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_org ON tools(org_id);

ALTER TABLE tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY tools_isolation ON tools
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE tools FORCE ROW LEVEL SECURITY;
