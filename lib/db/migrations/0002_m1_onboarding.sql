-- M1: Invites, client companies, staff tags

CREATE TABLE IF NOT EXISTS staff_capability_tags (
  membership_id UUID NOT NULL REFERENCES org_memberships(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (membership_id, tag)
);

CREATE TABLE IF NOT EXISTS client_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_companies_org ON client_companies(org_id);

CREATE TABLE IF NOT EXISTS client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_company_id UUID NOT NULL REFERENCES client_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_company_id, user_id)
);

CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  is_org_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_manager BOOLEAN NOT NULL DEFAULT FALSE,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  is_client BOOLEAN NOT NULL DEFAULT FALSE,
  client_company_id UUID REFERENCES client_companies(id) ON DELETE SET NULL,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invites_token ON invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_org ON invites(org_id);

ALTER TABLE client_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_capability_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY client_companies_isolation ON client_companies
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY client_users_isolation ON client_users
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY invites_isolation ON invites
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Tags: isolate via membership's org
CREATE POLICY staff_tags_isolation ON staff_capability_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_memberships m
      WHERE m.id = membership_id
        AND m.org_id = current_setting('app.current_org_id', true)::uuid
    )
  );

ALTER TABLE client_companies FORCE ROW LEVEL SECURITY;
ALTER TABLE client_users FORCE ROW LEVEL SECURITY;
ALTER TABLE invites FORCE ROW LEVEL SECURITY;
ALTER TABLE staff_capability_tags FORCE ROW LEVEL SECURITY;
