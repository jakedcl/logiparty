-- M2-5: App role without BYPASSRLS so catalog RLS actually applies.
-- Neon owner (neondb_owner) bypasses RLS; catalog queries SET LOCAL ROLE to this.

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'logiparty_app') THEN
    CREATE ROLE logiparty_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$body$;

-- Allow the connection role (neondb_owner) to assume the app role
GRANT logiparty_app TO CURRENT_USER;

GRANT USAGE ON SCHEMA public TO logiparty_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  inventory_items,
  client_inventory_items,
  fleet_vehicles,
  tools,
  client_companies
TO logiparty_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO logiparty_app;
