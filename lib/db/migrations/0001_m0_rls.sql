-- M0-4: Row-level security spike

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_memberships ENABLE ROW LEVEL SECURITY;

-- Organizations: visible only when id matches session org
CREATE POLICY org_isolation_select ON organizations
  FOR SELECT
  USING (id = current_setting('app.current_org_id', true)::uuid);

-- Memberships: visible only within current org
CREATE POLICY org_memberships_isolation ON org_memberships
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- Force RLS for table owner (Neon superuser bypass otherwise)
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE org_memberships FORCE ROW LEVEL SECURITY;
