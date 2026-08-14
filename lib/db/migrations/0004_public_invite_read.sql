-- Allow invite acceptance and login without org context set
DROP POLICY IF EXISTS invites_isolation ON invites;
CREATE POLICY invites_access ON invites
  FOR ALL
  USING (
    current_setting('app.current_org_id', true) IS NULL
    OR current_setting('app.current_org_id', true) = ''
    OR org_id = current_setting('app.current_org_id', true)::uuid
  );
