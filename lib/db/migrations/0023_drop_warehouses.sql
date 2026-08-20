-- Rollback accidental A18b warehouses (applied on Neon dev; not shipping).
-- Safe no-op if columns/table never existed.

ALTER TABLE inventory_items DROP COLUMN IF EXISTS warehouse_id;
ALTER TABLE client_inventory_items DROP COLUMN IF EXISTS warehouse_id;
ALTER TABLE fleet_vehicles DROP COLUMN IF EXISTS warehouse_id;

DROP TABLE IF EXISTS warehouses;
