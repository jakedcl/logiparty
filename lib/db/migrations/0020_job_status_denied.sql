-- Add `denied` for manager rejection of client portal draft requests.
-- Distinct from D5 deferred "cancelled" (mid-lifecycle cancel of upcoming/ready).
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'denied';
