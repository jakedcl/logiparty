-- A3: Platform marketing / waitlist leads (apex logiparty.com)
-- Not org-scoped — no RLS. Inserts use owner connection via Drizzle.

CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_leads_created
  ON marketing_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_leads_email
  ON marketing_leads (email);

DO $body$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'logiparty_app') THEN
    GRANT SELECT, INSERT ON TABLE marketing_leads TO logiparty_app;
  END IF;
END
$body$;
