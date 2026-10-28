-- Client-company scope for quotes/invoices (extends 0024 pattern).

CREATE POLICY quotes_client_scope ON quotes
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR (
      client_company_id = app_client_company_id()
      AND status <> 'draft'
      AND status <> 'void'
    )
  )
  WITH CHECK (
    NOT app_is_client()
    OR client_company_id = app_client_company_id()
  );

CREATE POLICY quote_lines_client_scope ON quote_lines
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_lines.quote_id
        AND q.client_company_id = app_client_company_id()
        AND q.status NOT IN ('draft', 'void')
    )
  )
  WITH CHECK (NOT app_is_client());

CREATE POLICY quote_versions_client_scope ON quote_versions
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_versions.quote_id
        AND q.client_company_id = app_client_company_id()
        AND q.status NOT IN ('draft', 'void')
    )
  );

CREATE POLICY quote_responses_client_insert ON quote_client_responses
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_client_responses.quote_id
        AND q.client_company_id = app_client_company_id()
        AND q.status = 'sent'
    )
  );

CREATE POLICY quote_responses_client_select ON quote_client_responses
  AS RESTRICTIVE
  FOR SELECT
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM quotes q
      WHERE q.id = quote_client_responses.quote_id
        AND q.client_company_id = app_client_company_id()
    )
  );

CREATE POLICY quote_responses_client_no_write ON quote_client_responses
  AS RESTRICTIVE
  FOR UPDATE
  USING (NOT app_is_client())
  WITH CHECK (NOT app_is_client());

CREATE POLICY quote_responses_client_no_delete ON quote_client_responses
  AS RESTRICTIVE
  FOR DELETE
  USING (NOT app_is_client());

-- Rate cards: internal only (clients cannot read pricing catalog)
CREATE POLICY rate_cards_client_hide ON rate_cards
  AS RESTRICTIVE
  FOR ALL
  USING (NOT app_is_client())
  WITH CHECK (NOT app_is_client());

CREATE POLICY rate_card_lines_client_hide ON rate_card_lines
  AS RESTRICTIVE
  FOR ALL
  USING (NOT app_is_client())
  WITH CHECK (NOT app_is_client());

CREATE POLICY invoices_client_scope ON invoices
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR (
      client_company_id = app_client_company_id()
      AND status <> 'draft'
      AND status <> 'void'
    )
  )
  WITH CHECK (NOT app_is_client());

CREATE POLICY invoice_lines_client_scope ON invoice_lines
  AS RESTRICTIVE
  FOR ALL
  USING (
    NOT app_is_client()
    OR EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
        AND i.client_company_id = app_client_company_id()
        AND i.status NOT IN ('draft', 'void')
    )
  )
  WITH CHECK (NOT app_is_client());

CREATE POLICY invoice_payments_client_hide ON invoice_payments
  AS RESTRICTIVE
  FOR ALL
  USING (NOT app_is_client())
  WITH CHECK (NOT app_is_client());
