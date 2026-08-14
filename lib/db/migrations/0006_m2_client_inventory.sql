-- M2-2: Client-owned inventory catalog

CREATE TABLE IF NOT EXISTS client_inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_inventory_items_org
  ON client_inventory_items(org_id);
CREATE INDEX IF NOT EXISTS idx_client_inventory_items_company
  ON client_inventory_items(client_company_id);

ALTER TABLE client_inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_inventory_items_isolation ON client_inventory_items
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE client_inventory_items FORCE ROW LEVEL SECURITY;
