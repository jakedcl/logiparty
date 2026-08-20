# OPEN_TABS.md — Active work queue

**Purpose:** Single source of truth for what's open, blocked, and done.  
**Agents:** Read this every session (see [AGENTS.md](../AGENTS.md)). Update when you finish or start an item.  
**Human:** Pick **one** active item before starting a new convo or subagent.

*Last updated: 2026-08-20 (A18a Client hero + Add-above-table).*

---

## Active (pick ONE — do not start the next until checked off)

| ID | Task | Owner | Notes |
|----|------|-------|-------|
| **A1** | Jake tests job flow locally | Jake | Automated: `npx tsx scripts/golden-path-walk.ts` → **29 passed, 0 failed** (2026-08-19). Still worth one manual click-through on prod. |

---

## Future / backlog (do not start unless Jake asks)

| ID | Task | Notes |
|----|------|-------|
| **A12** | Staff accept/deny **job assignments** | Separate from manager deny of portal drafts (done). `job_assignments` still has no accept status. Needs product decision + small schema before UI. |
| **A18b** | Warehouses / item locations (optional) | Deferred — nice detail, not required. No schema/filter until Jake asks. |

---

## Blocked / waiting

| ID | Task | Blocked by |
|----|------|------------|
| B1 | Prod smoke test + logo on login | Login works (A2 done). Remaining: full smoke + logo on login |
| B2 | First real paying customer | Jake tested app + A3 homepage live |
| B3 | Resend invite emails | Resend account + domain verify |
| B4 | M6 (Stripe, self-serve signup, custom domains) | **Stripe scaffold done** (keys TBD). Remaining: Jake adds Stripe keys + webhook + prod migrate `0019`; self-serve signup + custom domains still later |

---

## Done (reference — don't reopen unless broken)

- [x] M0–M5 MVP built and merged
- [x] R2 file uploads (bucket `logiparty-docs`)
- [x] Domain `logiparty.com` on Vercel
- [x] Wildcard `*.logiparty.com`
- [x] Login subdomain fix (middleware `x-org-slug`)
- [x] Seed tenants: **`nydac`** · **`test`** (Acme) · **`axis`** (Axis Global Staging). Neon **dev** triple-seeded; prod **main** still old until Jake asks
- [x] Scripts: `db:reset-seed`, `db:relink-admin`, `golden-path-walk`, `r2-morgan-smoke`
- [x] Tools catalog deprecated → **Our inventory** (Option A)
- [x] Cloudflare MCP connected
- [x] **A2** Fix Vercel Production env + login redirect loop — Jake confirmed login works on prod (`test.logiparty.com`, 2026-08-20). Env checklist + `secureCookie: true` for `__Secure-authjs.session-token` in middleware.
- [x] **A5** Neon `dev` branch — local `.env.local` `DATABASE_URL` → pooled `dev` (`ep-lucky-water-aphwec7q-pooler…`); Vercel Production stays on Neon `main`. Fork had schema + seed data; no reset of `main`. Only run `db:reset-seed` against `dev`.
- [x] Removed **`demo`** org from seed (and Devon / `admin@demo.test`). Seed creates **`nydac` + `test` + `axis`**. Reset still cleans legacy `demo` / acme + orphaned users.
- [x] **A3** Marketing / leads homepage at apex `logiparty.com` — invite-only “Request access” form → `marketing_leads` (+ optional Resend notify). Tenant `{slug}.logiparty.com` unchanged. Follow-up: **A4** unknown subdomain → homepage.
- [x] **A4** Unknown subdomain → apex homepage — middleware checks `organizations.slug` via Neon HTTP; missing org → redirect to `https://logiparty.com` / `http://localhost:3000`. Known tenants + apex/www unchanged.
- [x] **A6** Client inventory UI polish — dense items table (SKU/Name/Description/Qty/Actions); inline qty + description edit; SKU/name read-only after create; soft SKU normalize (trim, uppercase, `A-Z0-9_-`); “+ Add item” collapsed at bottom. Files: `app/dashboard/client-inventory/page.tsx`, `components/client-inventory/*`, `lib/inventory/sku.ts`, `lib/actions/client-inventory.ts`.
- [x] **A7** Dashboard UI consistency — same A6 list-first / create-last pattern on: **Our inventory**, **Fleet**, **Jobs**, **Team**, **Clients**, **Availability**, **Activity**. Soft SKU normalize on Our inventory. Job detail / portal / marketing unchanged.
- [x] **A8** Dev role / persona switcher — Option A quick-login via `signIn("credentials")`; gate `ALLOW_DEV_ROLE_SWITCH=true` + hard deny when `VERCEL_ENV=production`; floating Dev panel; always show name+role in dashboard/portal headers. Personas **keyed by host org slug** (nydac / test / axis casts). Do **not** enable on Vercel Production.
- [x] **A9** Seed cast → Jake’s old company (Ed/Mike/Don/Paul/Tom/Rob/Jerome + Michaela/Dom @ Red Bull) on **nydac**; playground cast on **test**. Local Neon **dev** re-seeded; prod Neon **main** still old cast until intentional re-seed.
- [x] **A10** Dual-tenant seed + NYDAC logo — `nydac` uses `/seed/nydac-logo.svg` (navy); `test` keeps orange TEST badge. Emails globally unique across orgs.
- [x] **F1** Third seed tenant — **`axis`** · Axis Global Staging · logo `/seed/axis-logo.svg` (teal) · client Volt Energy · cast `@axis.test` / `@volt.test`. Dev persona switcher host-scoped for all three. Neon **dev** reset-seeded; prod **main** untouched.
- [x] **A11** View-then-edit detail UIs — default read-only labels/values; **Edit** → form + Save/Cancel. Shared `components/ui/view-edit.tsx`. Applied: job **Summary**, **Locations**, **Inventory** qty; org **settings**; **Team** roles/tags. Fleet/Crew stay list+Remove; assigns/uploads behind collapsed **+ Add**. Portal job detail already read-only. Create/new stays form-like.
- [x] **A11b** Job detail tabs + density — `?tab=` switches **one** panel (was hash-link dump of all sections). Dense tables/rows for locations/inventory/fleet/crew/docs; Remove behind ⋯; status chip in header; soft panel fade. Files: `app/dashboard/jobs/[id]/page.tsx`, `components/jobs/*`, `components/ui/view-edit.tsx`.
- [x] **B4 partial** Stripe billing scaffold (optional, no keys required) — Checkout + portal + webhook + Settings Billing; soft `billing_status`; keys TBD.
- [x] **Nav shell** Staff dashboard — left sidebar + mobile drawer (`DashboardShell`); portal unchanged; run-sheet location bullets → `ul`.
- [x] **NYDAC rich seed** — `seedNydacRich()` in `lib/db/seed.ts`: Monster Energy + Gotham Glow clients, fat catalogs, 5 fleet, 6 jobs across draft/upcoming/ready/completed with locations/crew/fleet/qty_loaded + activity. Crew spread: Tom/Rob/Paul/Jerome each on 5 jobs; Mike/Don lead multiple; ready jobs full LI+LO. Neon **dev** only.
- [x] **Staff nav UX** — Primary: Dashboard, Jobs / My Jobs, **Notifications**, **Inventory** (Client/Equipment/Fleet tabs), Team, Clients, **Settings**. Moved **Availability → Settings / Time off**, **Activity → Settings / Activity**. Old `/dashboard/availability` + `/dashboard/activity` redirect. Notifications = manager draft requests (Accept/Deny) + staff assignments (view/link; staff accept/deny → **A12**). Portal unchanged.
- [x] **Account menu** — Click name+role in dashboard/portal top bar → **My Profile** + **Sign out** only. Settings hub lists **My Profile** above Time off. Profile: edit first/last name; email read-only; change password if `password_hash` set. Paths: `/dashboard/settings/profile`, `/portal/profile` (`/dashboard/profile` redirects to settings). Sidebar/drawer brand: logo stacked above org name.
- [x] **Manager deny portal draft** — New job status `denied` (migration `0020`). Managers Accept / Deny on job detail + Notifications; client portal shows denied (not stuck pending). D5b; distinct from **A12** staff assignment accept/deny. Neon **dev** migrated; seed example Monster Rooftop Soft Ask.
- [x] **Clients tab contacts** — `/dashboard/clients` lists each company with a dense Name/Email/Title table of `client_users` (seed Michaela POC + Dom Rep under Red Bull on nydac). Invite contact + Add company stays collapsed create-last; invite flow unchanged.
- [x] **Portal jobs list-first** — `/portal/jobs` matches A6/A7: dense Your jobs table (name/date/status chips/View) first; **+ New request** collapsed at bottom; subtitle tracks status first. Draft accept/deny copy unchanged. Auth/company scope untouched.
- [x] **A13** Portal inventory **requests** v1 — clients request add / qty change / remove with reason; managers Approve (apply to `client_inventory_items`) or Deny (+ optional note). Table `client_inventory_requests` + migration `0021`. Portal `/portal/inventory` list-first + collapsed + Request new item + Your requests. Staff: Notifications + Client inventory pending panel. Seed: 2 Red Bull pending samples (cooler qty + umbrella add). Neon **dev** migrated + seeded.
- [x] **A13b** Portal inventory request UX — row **⋯** menu (Change quantity / Remove from storage) → dedicated `/portal/inventory/requests/new?type=…&itemId=…` form page; + Request new item → same page `type=add`. No inline stacked forms. Your requests list kept.
- [x] **Portal jobs date sort** — `/portal/jobs` ordered by `job_start` desc (then `created_at`); was `created_at` only so Date column looked jumbled. Inventory requests already newest-first by `created_at`.
- [x] **A14** Client → tenant general notes v1 — portal `/portal/notes` (list newest-first + collapsed compose); table `client_notes` + migration `0022`; managers see unread in Notifications + Mark read; one-way (D18). Seed: Red Bull Michaela unread sample. Neon **dev** migrated + seedable.
- [x] **A15** Staff `/dashboard` home — role-aware welcome (first name + org); Needs attention (top 5 from `listNotifications`, incl. notes/inventory/drafts/assignments); Upcoming work dense table (soonest `job_start` first, cap 8); manager **+ New job** / staff My Jobs + Time off; A6/A7 list density. Time-off tip → Settings.
- [x] **A16** Product visual system — high-contrast tokens (`globals.css`); tenant `--primary` via `OrgTheme` + `lib/theme/primary-color` (fallback navy `#1e3a5f`); ink staff sidebar; open tables (no decorative card chrome); portal + login white-label; `PageHeader` / `StatusBadge`. Smoke: nydac Mike + Michaela.
- [x] **A17** Rejected out of primary feeds — denied jobs leave staff Jobs + portal Your jobs (collapsed **Rejected**); Notifications Inbox stays pending-only + collapsed **Rejected** history (`listRejectedItems`); Needs attention unchanged (already pending-only). Rows kept (`denied` status).
- [x] **A18a** Inventory IA — single staff nav **Inventory**; tabs Client \| Equipment \| Fleet; `?tab=` deep-links; legacy redirects; A16 open tables. (**A18b** warehouses deferred.)
- [x] **A18 Client cleanup** — big client title (no truncate) + switcher; quiet **N pending** toggle (closed by default); caption left / **+ Add …** button right (plain button, form below — no `<details>`); Client items view-first with ⋯ Edit/Delete; Equipment/Fleet only move Add top-right (tables unchanged).
---

## Current environments

| What | URL / value |
|------|-------------|
| **Prod tenant login** | https://test.logiparty.com/login (**still `test` on Neon main** — triple-seed / rename only when Jake asks) |
| **Prod marketing** | https://logiparty.com |
| **Local marketing** | http://localhost:3000 (unset `NEXT_PUBLIC_DEV_ORG_SLUG`) |
| **Local NYDAC** | http://nydac.localhost:3000 (`.env.local` → Neon **`dev`**) |
| **Local playground** | http://test.localhost:3000 |
| **Local Axis** | http://axis.localhost:3000 |
| **Seed orgs** | `nydac` · New York Design and Construction · `/seed/nydac-logo.svg`; `test` · Acme Event Logistics · `/seed/test-tenant-logo.svg`; `axis` · Axis Global Staging · `/seed/axis-logo.svg` |
| **NYDAC OrgAdmin** | `ed@test.test` / `password123` |
| **NYDAC manager** | `mike@test.test` / `password123` |
| **Test OrgAdmin** | `boss@playground.test` / `password123` |
| **Axis OrgAdmin** | `jordan@axis.test` / `password123` |
| **Jake admin** | `jakedcl73@gmail.com` (your password) — linked to **nydac** |
| **AUTH_URL (correct)** | `https://logiparty.com` |
| **NEXT_PUBLIC_ROOT_DOMAIN** | `logiparty.com` |
| **NEXT_PUBLIC_DEV_ORG_SLUG** | Local primary: `nydac` (do not set in Production) |
| **Do NOT set in prod** | `NEXT_PUBLIC_DEV_ORG_SLUG`, `ALLOW_DEV_ROLE_SWITCH` |
| **Neon branches** | Production = **`main`**; local = **`dev`** (never reset-seed on main) |

### Seed cheat sheet (Neon `dev` — password `password123`)

| Org | Local host | OrgAdmin | Manager | Client POC |
|-----|------------|----------|---------|------------|
| **nydac** · NYDAC | http://nydac.localhost:3000 | `ed@test.test` | `mike@test.test` | `michaela@redbull.test` (Red Bull) · also Monster / Gotham Glow |
| **test** · Acme | http://test.localhost:3000 | `boss@playground.test` | `riley@playground.test` | `nina@monster.test` (Monster) |
| **axis** · Axis Global Staging | http://axis.localhost:3000 | `jordan@axis.test` | `avery@axis.test` | `taylor@volt.test` (Volt Energy) |

**NYDAC rich seed (Neon `dev`)** — busy warehouse for poking around:

| Status | Sample job |
|--------|------------|
| draft | Red Bull Holiday Window Concept |
| denied | Monster Rooftop Soft Ask |
| upcoming (partial) | Red Bull Summer Pop-Up · Monster Times Square Takeover |
| ready | Red Bull Brooklyn Mirage · Gotham Glow Fashion Week |
| completed | Red Bull Pier 17 Wrap |

Extra portal logins (still `password123`): `sara@monster.nydac.test`, `maya@gothamglow.test`. Dev panel client button stays Michaela (Red Bull).

---

## New session prompt (copy-paste)

```
Read AGENTS.md and docs/OPEN_TABS.md first.
Work ONLY on OPEN_TABS item [A3 / A4 / etc].
Update docs/OPEN_TABS.md when done (move to Done, note blockers).
Do not start other active items.
```

---

## Subagent rules

1. **One active item per agent** — parallel agents on different A-items will conflict.
2. **Always update this file** in the same PR as the work.
3. **PROGRESS.md** = milestone tickets; **OPEN_TABS.md** = current human/agent queue.
