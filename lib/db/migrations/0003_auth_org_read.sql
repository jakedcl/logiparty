-- Allow org lookup by slug during login (before org context is set)
DROP POLICY IF EXISTS org_isolation_select ON organizations;
CREATE POLICY org_select ON organizations
  FOR SELECT
  USING (
    current_setting('app.current_org_id', true) IS NULL
    OR current_setting('app.current_org_id', true) = ''
    OR id = current_setting('app.current_org_id', true)::uuid
  );
