-- M4-5: Job documents (R2 object metadata)

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'uploader_role') THEN
    CREATE TYPE uploader_role AS ENUM ('manager', 'client');
  END IF;
END
$body$;

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploader_role uploader_role NOT NULL,
  file_name TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_job ON documents(job_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(org_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_isolation ON documents
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

ALTER TABLE documents FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE documents TO logiparty_app;
