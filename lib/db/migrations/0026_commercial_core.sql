-- Quotes, rate cards, invoicing (commercial). Self-contained; renumber if main adds migrations first.

CREATE TYPE quote_status AS ENUM (
  'draft', 'sent', 'approved', 'declined', 'expired', 'void'
);

CREATE TYPE invoice_status AS ENUM (
  'draft', 'sent', 'partially_paid', 'paid', 'void', 'overdue'
);

CREATE TYPE commercial_line_kind AS ENUM (
  'equipment', 'labor', 'fleet', 'fee', 'discount', 'tax', 'deposit', 'custom',
  'damage_loss', 'adjustment'
);

CREATE TYPE rate_unit AS ENUM (
  'each', 'day', 'hour', 'flat', 'percent'
);

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS quote_prefix text NOT NULL DEFAULT 'Q',
  ADD COLUMN IF NOT EXISTS invoice_prefix text NOT NULL DEFAULT 'INV',
  ADD COLUMN IF NOT EXISTS next_quote_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS next_invoice_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS default_tax_rate_bps integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_label text NOT NULL DEFAULT 'Sales tax',
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS payment_terms_days integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS quote_valid_days integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS invoice_footer_text text;

CREATE TABLE rate_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  is_default boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_cards_org ON rate_cards(org_id);

CREATE TABLE rate_card_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rate_card_id uuid NOT NULL REFERENCES rate_cards(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('equipment', 'labor', 'fleet', 'fee')),
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  fleet_vehicle_id uuid REFERENCES fleet_vehicles(id) ON DELETE SET NULL,
  labor_role text,
  description text NOT NULL,
  unit rate_unit NOT NULL DEFAULT 'each',
  unit_price_cents integer NOT NULL DEFAULT 0,
  min_qty integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  client_company_id uuid REFERENCES client_companies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_card_lines_org ON rate_card_lines(org_id);
CREATE INDEX idx_rate_card_lines_card ON rate_card_lines(rate_card_id);

CREATE TABLE quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_company_id uuid NOT NULL REFERENCES client_companies(id) ON DELETE RESTRICT,
  quote_number text NOT NULL,
  status quote_status NOT NULL DEFAULT 'draft',
  version integer NOT NULL DEFAULT 1,
  title text NOT NULL,
  event_start timestamptz,
  event_end timestamptz,
  valid_until timestamptz,
  currency text NOT NULL DEFAULT 'USD',
  subtotal_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  deposit_cents integer,
  notes_internal text,
  notes_client text,
  sent_at timestamptz,
  sent_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  pdf_storage_key text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, quote_number)
);

CREATE INDEX idx_quotes_org ON quotes(org_id);
CREATE INDEX idx_quotes_client ON quotes(client_company_id);
CREATE INDEX idx_quotes_status ON quotes(org_id, status);

CREATE TABLE quote_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  kind commercial_line_kind NOT NULL DEFAULT 'custom',
  description text NOT NULL,
  quantity numeric(12, 4) NOT NULL DEFAULT 1,
  unit rate_unit NOT NULL DEFAULT 'each',
  unit_price_cents integer NOT NULL DEFAULT 0,
  line_total_cents integer NOT NULL DEFAULT 0,
  taxable boolean NOT NULL DEFAULT true,
  source_rate_card_line_id uuid REFERENCES rate_card_lines(id) ON DELETE SET NULL,
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  fleet_vehicle_id uuid REFERENCES fleet_vehicles(id) ON DELETE SET NULL
);

CREATE INDEX idx_quote_lines_quote ON quote_lines(quote_id);

CREATE TABLE quote_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version integer NOT NULL,
  snapshot_json jsonb NOT NULL,
  pdf_storage_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_id, version)
);

CREATE TABLE quote_client_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quote_version integer NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved', 'declined')),
  signer_name text NOT NULL,
  responded_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  responded_at timestamptz NOT NULL DEFAULT now(),
  decline_reason text,
  UNIQUE (quote_id, quote_version)
);

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quote_version integer;

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_company_id uuid NOT NULL REFERENCES client_companies(id) ON DELETE RESTRICT,
  job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  subtotal_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  total_cents integer NOT NULL DEFAULT 0,
  amount_paid_cents integer NOT NULL DEFAULT 0,
  notes_client text,
  notes_internal text,
  sent_at timestamptz,
  paid_at timestamptz,
  stripe_payment_link_id text,
  stripe_payment_link_url text,
  pdf_storage_key text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, invoice_number)
);

CREATE INDEX idx_invoices_org ON invoices(org_id);
CREATE INDEX idx_invoices_job ON invoices(job_id);

CREATE TABLE invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  kind commercial_line_kind NOT NULL DEFAULT 'custom',
  description text NOT NULL,
  quantity numeric(12, 4) NOT NULL DEFAULT 1,
  unit rate_unit NOT NULL DEFAULT 'each',
  unit_price_cents integer NOT NULL DEFAULT 0,
  line_total_cents integer NOT NULL DEFAULT 0,
  taxable boolean NOT NULL DEFAULT true,
  job_inventory_line_id uuid REFERENCES job_inventory_lines(id) ON DELETE SET NULL
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

CREATE TABLE invoice_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  method text NOT NULL CHECK (method IN ('stripe', 'check', 'ach', 'other')),
  stripe_payment_intent_id text,
  recorded_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  paid_at timestamptz NOT NULL DEFAULT now()
);

-- RLS (org isolation)
ALTER TABLE rate_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_card_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_client_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_isolation ON rate_cards
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON rate_card_lines
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON quotes
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON quote_lines
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON quote_versions
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON quote_client_responses
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON invoices
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON invoice_lines
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
CREATE POLICY org_isolation ON invoice_payments
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON rate_cards TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_card_lines TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON quotes TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON quote_lines TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON quote_versions TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON quote_client_responses TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoices TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_lines TO logiparty_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON invoice_payments TO logiparty_app;
