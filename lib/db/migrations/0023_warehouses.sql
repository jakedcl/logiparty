-- A18b: Org warehouses (storage sites) + optional location on catalog rows.
-- Distinct from job_locations (event venue addresses on a job).

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouses_org ON warehouses(org_id);

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

CREATE POLICY warehouses_isolation ON warehouses
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE warehouses FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE warehouses TO logiparty_app;

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

ALTER TABLE client_inventory_items
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

ALTER TABLE fleet_vehicles
  ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_items_warehouse
  ON inventory_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_client_inventory_items_warehouse
  ON client_inventory_items(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_warehouse
  ON fleet_vehicles(warehouse_id);
