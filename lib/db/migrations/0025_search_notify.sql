-- Search helpers (trigram) + email notification preference on memberships

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_jobs_name_trgm ON jobs USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_companies_name_trgm ON client_companies USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_items_sku_trgm ON inventory_items USING gin (sku gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name_trgm ON inventory_items USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin (
  (coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops
);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_name_trgm ON fleet_vehicles USING gin (name gin_trgm_ops);

ALTER TABLE org_memberships
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true;
