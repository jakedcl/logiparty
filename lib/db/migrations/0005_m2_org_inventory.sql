-- M2-1: Org-owned inventory catalog

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_org ON inventory_items(org_id);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY inventory_items_isolation ON inventory_items
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE inventory_items FORCE ROW LEVEL SECURITY;
