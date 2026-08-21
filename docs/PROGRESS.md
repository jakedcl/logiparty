# PROGRESS.md — Ticket tracker

**Current milestone:** M5 (ops polish)

---

## M0 — Foundation

- [x] M0-1 through M0-8

**M0 milestone complete:** [x]

---

## M1 — Onboarding & users

- [x] M1-1 White-label settings page
- [x] M1-2 Invite tokens + accept profile (Resend optional; dev logs link)
- [x] M1-3 Role at invite
- [x] M1-4 Staff capability tags CRUD
- [x] M1-5 Dual Staff + Manager membership
- [x] M1-6 client_companies + client_users
- [x] M1-7 Client invite (company, name, title)

**M1 milestone complete:** [x]

---

## M2 — Catalogs

- [x] M2-1 Org inventory CRUD
- [x] M2-2 Client inventory CRUD
- [x] M2-3 Fleet vehicles CRUD
- [x] M2-4 Tools CRUD
- [x] M2-5 RLS on catalog tables
- [x] M2-6 Activity log on catalog mutations

**M2 milestone complete:** [x]

---

## M3 — Jobs core

- [x] M3-1 `jobs` CRUD + statuses
- [x] M3-2 `job_locations` max 5
- [x] M3-3 Job detail panels
- [x] M3-4 Assign inventory
- [x] M3-5 `quantity_loaded` + lock rules
- [x] M3-6 Assign fleet to job
- [x] M3-7 Crew assignments; exclude manager-only
- [x] M3-8 `job_lead_user_id` display
- [x] M3-9 Auto-ready service (TypeScript)
- [x] M3-10 Release locks after `load_out_end`
- [x] M3-11 Staff "My Jobs" list
- [x] M3-12 Print run sheet

**M3 milestone complete:** [x]

---

## M4 — Client portal

- [x] M4-1 Portal layout (org brand only)
- [x] M4-2 Client auth routes on subdomain
- [x] M4-3 Job request → `draft`
- [x] M4-4 Manager accept draft → `upcoming`
- [x] Manager deny portal draft → `denied` (D5b; migration `0020`)
- [x] M4-5 R2 document upload + list
- [x] M4-6 Client delete own docs
- [x] M4-7 Mobile-responsive job list + upload

**M4 milestone complete:** [x]

---

## M5 — Ops polish

- [x] M5-1 Availability requests
- [x] M5-2 Crew picker respects time-off
- [x] M5-3 Activity log page (managers; low prominence)
- [x] M5-4 Cross-org + RBAC integration tests
- [x] M5-5 Staging Neon branch notes + seed script
- [x] M5-6 Security pass (cookies, rate limit login)

**M5 milestone complete:** [x]

---

## Documentation phase

- [x] All documentation deliverables

---

## Post-MVP cleanup

- [x] **Tools → Our inventory (Option A):** Deprecated separate `tools` catalog; dollies/hand tools live in `inventory_items`. Removed `/dashboard/tools` nav and page. UI label "Org inventory" → **Our inventory**. See DECISIONS D17 / O2.
- [x] **Removed `demo` org** from seed (and Devon / `admin@demo.test`). Seed is `nydac` + `test` + `axis`. Neon **dev** triple-seeded; prod `main` untouched.

---

## Go-live queue (OPEN_TABS)

- [x] **A3** Apex marketing homepage at `logiparty.com` (leads → `marketing_leads`; invite-only CTA)
- [x] **A4** Unknown subdomain → redirect to apex homepage (middleware + Neon slug check)
- [x] **A6** Client inventory UI polish (dense table; demoted add; soft SKU)
- [x] **A7** Dashboard UI consistency — list-first tables + collapsed add on Our inventory, Fleet, Jobs, Team, Clients, Availability, Activity; SKU soft-normalize on Our inventory
- [x] **A8** Dev role / persona switcher (`ALLOW_DEV_ROLE_SWITCH`; never Vercel Production; seed quick-login + header identity; personas keyed by org slug)
- [x] **A10** Dual-tenant seed: `nydac` (NYDAC logo) + `test` (Acme / orange TEST badge); Neon **dev** only
- [x] **F1** Third seed tenant: `axis` (Axis Global Staging / teal logo + Volt Energy); Dev panel host-scoped; Neon **dev** only
- [x] **A11** View-then-edit detail UIs (job Summary/Locations/Inventory; settings; team) + collapsed job assigns
- [x] **A11b** Job detail real tabs (`?tab=`) + dense lists (no stacked section dump)
- [x] **Account menu** — top-bar name+role dropdown (My Profile + Sign out); Settings → My Profile; portal `/portal/profile`
- [x] **A13** Portal inventory requests v1 — `client_inventory_requests`; client request add/qty/remove; manager approve/deny; Notifications + Client inventory; Neon **dev** `0021`
- [x] **A13b** Portal inventory request UX — ⋯ menu → dedicated `/portal/inventory/requests/new` form (no inline stacked forms)
- [x] Portal jobs list sort by `job_start` desc (newest job date first)
- [x] **A14** Client → tenant general notes — `client_notes`; portal Notes page; staff Notifications unread + Mark read; Neon **dev** `0022`
- [x] **A15** Staff dashboard home — replace M0 stub with role-aware ops console (Needs attention + Upcoming work + primary CTAs)
- [x] **A16** Visual system — tokens, tenant primary, open layouts (2026-08-20)
- [x] **A17** Rejected out of feeds — denied jobs/inventory leave Inbox/Jobs/portal primary lists; collapsed Rejected folders; DB rows kept
- [x] **A19** Jobs / My Jobs calendar view + weekday date format (2026-08-20)
- [x] **A18a** Inventory IA — one nav Inventory; tabs Client \| Equipment \| Fleet (`?tab=`); warehouses (**A18b**) deferred
- [x] **A18 Inventory nested sidebar** — sidebar parent Inventory → Client | Equipment | Fleet; `?tab=` deep-links; page tabs removed (sidebar primary). PR #40.
- [x] **A18a polish** Client hero dropdown + pending reveal; Add on caption row (all tabs); URL `companyId` (+ `clientId` / `client` aliases)

---

## Go Live checklist

### Local testing (do this first)
- [x] Golden-path walk passes: `npx tsx scripts/golden-path-walk.ts` (29 passed, 2026-08-19)
- [ ] Manual click-through: Mike + Michaela on localhost (optional — script covers flow)

### Cloudflare R2 (file uploads)
- [x] Cloudflare MCP authenticated (account: **logiparty**, ID `6b261c181f1d1d1d46b7b88ef9522fb1`)
- [x] **Enable R2** in dashboard (required first — API returns `10042 NotEntitled` until subscribed)
- [x] Create R2 bucket `logiparty-docs`
- [x] Create R2 API token (Object Read & Write, scoped to `logiparty-docs`)
- [x] Paste `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY` into `.env.local` (account ID + bucket name already set)
- [x] Test: upload a PDF from the client portal job detail page (automated smoke: portal upload UI enabled + `putJobObject` write/delete OK)
- [x] Test: Mike sees the document on the internal job detail (`scripts/r2-morgan-smoke.ts`)

### Vercel deployment
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Import GitHub repo at vercel.com → New Project
- [ ] Add all env vars to Vercel project (copy from `.env.local`, add prod `AUTH_URL` = `https://logiparty.com`)
- [x] Add `NEXT_PUBLIC_ROOT_DOMAIN=logiparty.com` in Vercel env vars (no `www`, not blank — redeploy after change)
- [ ] Add `AUTH_SECRET` (generate: `openssl rand -base64 32`)
- [ ] Add `CRON_SECRET` for `/api/cron/auto-ready`
- [ ] Add domain `logiparty.com` and wildcard `*.logiparty.com` in Vercel project settings
- [ ] Point DNS to Vercel (they'll give you the records)
- [ ] Smoke test production: log in at `nydac.logiparty.com` (prod DB still `test` until renamed)

### Resend (email — invites)
- [ ] Create account at resend.com, verify your sending domain
- [ ] Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to Vercel env vars
- [ ] Test: invite a user and confirm the email arrives

### First real tenant
- [ ] Create the first real org in production DB (or build the sign-up flow in M6)
- [ ] Set their subdomain slug, run seed or manual insert
- [ ] **Use separate Neon branches:** local `.env.local` → dev branch; Vercel Production → `main` (never run `db:reset-seed` against prod URL)

### M6 — Stripe billing scaffold (optional plug-and-play)
- [x] Env stubs in `.env.example` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, optional publishable)
- [x] `lib/stripe.ts` — `isStripeConfigured()` / `getStripe()` (null when missing)
- [x] Org columns: `stripe_customer_id`, `stripe_subscription_id`, `billing_status` + migration `0019`
- [x] Checkout Session + Customer Portal server actions; webhook at `/api/stripe/webhook`
- [x] Settings → Billing UI (calm “not configured” without keys; soft status only)
- [ ] Jake: create Stripe product/price, add keys to Vercel + `.env.local`, register webhook URL
- [ ] Jake: apply `0019_m6_org_billing.sql` on Neon **prod `main`** (dev can be migrated anytime)

### Go-live ops (OPEN_TABS)
- [x] **A16** Visual system — tokens, tenant primary, open layouts (2026-08-20)
- [x] **A17** Rejected out of primary feeds (2026-08-20)
- [x] **A19** Jobs / My Jobs calendar + weekday dates (2026-08-20)
- [x] **A18a** Inventory hub tabs (2026-08-20); **A18b** warehouses deferred; Client hero + Add-above-table polish
