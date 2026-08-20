-- Client → tenant general notes (one-way; not tied to job or SKU)

CREATE TABLE IF NOT EXISTS client_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  sent_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  read_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_notes_org
  ON client_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_company
  ON client_notes(client_company_id);
CREATE INDEX IF NOT EXISTS idx_client_notes_unread
  ON client_notes(org_id, created_at DESC)
  WHERE read_at IS NULL;

ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_notes_isolation ON client_notes
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE client_notes FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE client_notes TO logiparty_app;
