# Product roadmap (prioritized backlog)

Single list of large features so nothing gets lost between QA reports and OPEN_TABS.  
**Status:** `planned` · `in progress` · `partial` · `done`

| Priority | Feature | Why it matters for a real 3PL | Effort | Status |
|----------|---------|------------------------------|--------|--------|
| P2a | **Quotes & invoicing (remaining)** | Quote-to-cash is table stakes vs Current RMS / Rentman; pilots still invoice manually without it. | M–L | **partial** — core quotes/invoices/portal approve on `main` (0026–0027); tax UI, send email, deposits, revise flow TBD |
| P2b | **Accounting sync (QuickBooks / Xero)** | Bookkeepers re-key invoices without export; errors and delay month-end close. | L | planned |
| P2c | **Serialized assets + barcode/QR scan-out & packing lists** | SKU/qty-only cannot trace one missing amp; scan-out is how warehouses trust the system. | L | planned |
| P2d | **Subrentals & substitutes** | Shortages on big jobs require vendor gear or alternate SKU, not a phone call outside the app. | L | planned |
| P2e | **Multi-warehouse / locations + transfers (A18b)** | Growing 3PLs split stock across buildings; one pool per org stops scaling. | L | planned |
| P2f | **Self-serve org signup + custom domains (B4 remainder)** | Manual onboarding caps ~5 orgs/year; custom domains complete white-label. | L | planned |
| P2g | **CSV import/export (catalog + commercial)** | Onboarding 500 SKUs from spreadsheets; finance wants invoice CSV before OAuth. | S–M | planned |
| P2h | **Mobile-friendly crew PWA + offline run sheets** | Crew live on phones in venues with bad Wi‑Fi; desktop run sheets are backup only. | L | planned |
| P2i | **SMS / push notifications** | In-app-only misses drivers who never open the dashboard; incumbents ping on assignment. | M | planned |
| P2j | **Document templates & e-sign** | Typed name works for v1; enterprise clients expect DocuSign-style audit trail. | M | planned |
| P2k | **Audit log export + status page + DPA** | Enterprise procurement asks for SOC2/DPA and incident comms before signing. | M–L | planned |
| P2l | **Observability (error tracking, uptime)** | “Fixed” requires knowing prod failures; health route alone is not ops-ready. | M | planned |
| P2m | **E2E tests in CI on seeded previews** | Regressions in tenant routing/RLS are costly; golden-path is manual today. | M | planned |
| P2n | **Advanced reporting / profitability** | Owners need margin and utilization, not only job counts. | L | planned |
| P2o | **Fine-grained permissions (price hiding, warehouse scope)** | Larger teams split billing vs warehouse; v1 manager/staff matrix is coarse. | M | planned |
| P2p | **Calendar / availability views + Google/Outlook sync** | Crew scheduling overlaps PTO and external calendars; list views do not scale. | L | planned |
| P2q | **Public API + webhooks** | Integrators (CRM, WMS) want events without scraping the UI. | L | planned |

*Update this file when a row ships or when priority changes.*
