-- Client-company isolation on top of org RLS.
-- Internal sessions (app.is_client unset or not 'true') are unchanged.
-- Client-only sessions are narrowed to app.client_company_id.
-- admin/manager/staff write rules stay in the app layer.

CREATE OR REPLACE FUNCTION app_is_client()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(current_setting('app.is_client', true), '') = 'true'
$$;

CREATE OR REPLACE FUNCTION app_client_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.client_company_id', true), '')::uuid
$$;

GRANT EXECUTE ON FUNCTION app_is_client() TO logiparty_app;
GRANT EXECUTE ON FUNCTION app_client_company_id() TO logiparty_app;

-- Own company row only.
CREATE POLICY client_companies_client_scope ON client_companies
  AS RESTRICTIVE
  FOR ALL
  USING (NOT app_is_client() OR id = app_client_company_id())
  WITH CHECK (NOT app_is_client() OR id = app_client_company_id());

-- Own company's jobs only.
CREATE POLICY jobs_client_scope ON jobs
  AS RESTRICTIVE
  FOR ALL
  USING (NOT app_is_client() OR client_company_id = app_client_company_id())
  WITH CHECK (NOT app_is_client() OR client_company_id = app_client_company_id());

-- Child rows follow the parent job's company.
CREATE POLICY job_locations_client_scope ON job_locations
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_locations.job_id
        AND j.client_company_id = app_client_company_id()
    )
  )
  WITH CHECK (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_locations.job_id
        AND j.client_company_id = app_client_company_id()
    )
  );

CREATE POLICY job_inventory_lines_client_scope ON job_inventory_lines
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_inventory_lines.job_id
        AND j.client_company_id = app_client_company_id()
    )
  )
  WITH CHECK (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_inventory_lines.job_id
        AND j.client_company_id = app_client_company_id()
    )
  );

CREATE POLICY job_fleet_assignments_client_scope ON job_fleet_assignments
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_fleet_assignments.job_id
        AND j.client_company_id = app_client_company_id()
    )
  )
  WITH CHECK (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_fleet_assignments.job_id
        AND j.client_company_id = app_client_company_id()
    )
  );

CREATE POLICY job_assignments_client_scope ON job_assignments
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_assignments.job_id
        AND j.client_company_id = app_client_company_id()
    )
  )
  WITH CHECK (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = job_assignments.job_id
        AND j.client_company_id = app_client_company_id()
    )
  );

CREATE POLICY documents_client_scope ON documents
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = documents.job_id
        AND j.client_company_id = app_client_company_id()
    )
  )
  WITH CHECK (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = documents.job_id
        AND j.client_company_id = app_client_company_id()
    )
  );

-- Staff time-off and one-way notes are not visible to clients.
CREATE POLICY availability_requests_client_hide ON availability_requests
  AS RESTRICTIVE
  FOR ALL
  USING (NOT app_is_client())
  WITH CHECK (NOT app_is_client());

CREATE POLICY client_notes_client_select ON client_notes
  AS RESTRICTIVE
  FOR SELECT
  USING (NOT app_is_client());

CREATE POLICY client_notes_client_update ON client_notes
  AS RESTRICTIVE
  FOR UPDATE
  USING (NOT app_is_client())
  WITH CHECK (NOT app_is_client());

CREATE POLICY client_notes_client_delete ON client_notes
  AS RESTRICTIVE
  FOR DELETE
  USING (NOT app_is_client());

-- Clients may still send a note, only for their own company.
CREATE POLICY client_notes_client_insert ON client_notes
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    NOT app_is_client()
    OR client_company_id = app_client_company_id()
  );

CREATE POLICY client_inventory_items_client_scope ON client_inventory_items
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR client_company_id = app_client_company_id()
  )
  WITH CHECK (
    NOT app_is_client()
    OR client_company_id = app_client_company_id()
  );

-- Clients may read and insert requests for their company only.
CREATE POLICY client_inventory_requests_client_select ON client_inventory_requests
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT app_is_client()
    OR client_company_id = app_client_company_id()
  );

CREATE POLICY client_inventory_requests_client_insert ON client_inventory_requests
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    NOT app_is_client()
    OR client_company_id = app_client_company_id()
  );

CREATE POLICY client_inventory_requests_client_update ON client_inventory_requests
  AS RESTRICTIVE
  FOR UPDATE
  USING (NOT app_is_client())
  WITH CHECK (NOT app_is_client());

CREATE POLICY client_inventory_requests_client_delete ON client_inventory_requests
  AS RESTRICTIVE
  FOR DELETE
  USING (NOT app_is_client());
