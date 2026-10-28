# Quotes & invoicing — shipped (2026-10)

**Status:** On `main`. Migrations `0026_commercial_core`, `0027_commercial_client_rls` (plus `0025_search_notify` for search/notify prefs).

**What shipped**

- Staff **Quotes** and **Invoices** under `/dashboard/quotes`, `/dashboard/invoices`; commercial settings at `/dashboard/settings/commercial`.
- Portal **Quotes** (approve/decline) and **Invoices** list; PDFs in R2 via `lib/pdf/commercial-pdf.ts`.
- Rate cards, line items, convert approved quote → job, Stripe Payment Link when keys exist.
- Schema and columns: `docs/SCHEMA.md` (commercial tables section).

**Still open (see ROADMAP / OPEN_TABS)**

- Tax settings UI, email on quote/invoice send, deposit invoices, revise/resend UX.
- Accounting CSV export and QBO/Xero OAuth (P2b).
- Resend domain + invite delivery (**B3**).

**Removed:** The long pre-ship design doc; this file is the archive pointer only.
