-- Portal inventory change requests (client propose → manager approve/deny)

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_request_type') THEN
    CREATE TYPE inventory_request_type AS ENUM ('add', 'qty_change', 'remove');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inventory_request_status') THEN
    CREATE TYPE inventory_request_status AS ENUM ('pending', 'approved', 'denied');
  END IF;
END
$body$;

CREATE TABLE IF NOT EXISTS client_inventory_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type inventory_request_type NOT NULL,
  client_inventory_item_id UUID REFERENCES client_inventory_items(id) ON DELETE SET NULL,
  proposed_sku TEXT,
  proposed_name TEXT,
  proposed_description TEXT,
  proposed_quantity INTEGER,
  reason TEXT NOT NULL,
  status inventory_request_status NOT NULL DEFAULT 'pending',
  reviewer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_inventory_requests_org
  ON client_inventory_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_client_inventory_requests_company
  ON client_inventory_requests(client_company_id);
CREATE INDEX IF NOT EXISTS idx_client_inventory_requests_status
  ON client_inventory_requests(org_id, status);
CREATE INDEX IF NOT EXISTS idx_client_inventory_requests_item
  ON client_inventory_requests(client_inventory_item_id);

ALTER TABLE client_inventory_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_inventory_requests_isolation ON client_inventory_requests
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE client_inventory_requests FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE client_inventory_requests TO logiparty_app;
