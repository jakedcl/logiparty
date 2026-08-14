-- M2-3: Fleet vehicles catalog

CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  plate TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_org ON fleet_vehicles(org_id);

ALTER TABLE fleet_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY fleet_vehicles_isolation ON fleet_vehicles
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE fleet_vehicles FORCE ROW LEVEL SECURITY;
