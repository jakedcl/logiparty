# OPEN_TABS.md — Active work queue

**Purpose:** Single source of truth for what's open, blocked, and done.  
**Agents:** Read this every session (see [AGENTS.md](../AGENTS.md)). Update when you finish or start an item.  
**Human:** Pick **one** active item before starting a new convo or subagent.

*Last updated: 2026-08-20*

---

## Active (pick ONE — do not start the next until checked off)

| ID | Task | Owner | Notes |
|----|------|-------|-------|
| **A1** | Jake tests job flow locally | Jake | Automated: `npx tsx scripts/golden-path-walk.ts` → **29 passed, 0 failed** (2026-08-19). Still worth one manual click-through on prod. |

---

## Blocked / waiting

| ID | Task | Blocked by |
|----|------|------------|
| B1 | Prod smoke test + logo on login | Login works (A2 done). Remaining: full smoke + logo on login |
| B2 | First real paying customer | Jake tested app + A3 homepage live |
| B3 | Resend invite emails | Resend account + domain verify |
| B4 | M6 (Stripe, self-serve signup, custom domains) | Post-pilot — do not start unless Jake asks |

---

## Done (reference — don't reopen unless broken)

- [x] M0–M5 MVP built and merged
- [x] R2 file uploads (bucket `logiparty-docs`)
- [x] Domain `logiparty.com` on Vercel
- [x] Wildcard `*.logiparty.com`
- [x] Login subdomain fix (middleware `x-org-slug`)
- [x] Seed tenant slug: **`test`**, display name **TestTenant3PL**
- [x] Scripts: `db:reset-seed`, `db:relink-admin`, `golden-path-walk`, `r2-morgan-smoke`
- [x] Tools catalog deprecated → **Our inventory** (Option A)
- [x] Cloudflare MCP connected
- [x] **A2** Fix Vercel Production env + login redirect loop — Jake confirmed login works on prod (`test.logiparty.com`, 2026-08-20). Env checklist + `secureCookie: true` for `__Secure-authjs.session-token` in middleware.
- [x] **A5** Neon `dev` branch — local `.env.local` `DATABASE_URL` → pooled `dev` (`ep-lucky-water-aphwec7q-pooler…`); Vercel Production stays on Neon `main`. Fork had schema + `test`/`demo` already; no reset of `main`. Only run `db:reset-seed` against `dev`.
- [x] **A3** Marketing / leads homepage at apex `logiparty.com` — invite-only “Request access” form → `marketing_leads` (+ optional Resend notify). Tenant `{slug}.logiparty.com` unchanged. Follow-up: **A4** unknown subdomain → homepage.
- [x] **A4** Unknown subdomain → apex homepage — middleware checks `organizations.slug` via Neon HTTP; missing org → redirect to `https://logiparty.com` / `http://localhost:3000`. Known tenants + apex/www unchanged.
- [x] **A6** Client inventory UI polish — dense items table (SKU/Name/Description/Qty/Actions); inline qty + description edit; SKU/name read-only after create; soft SKU normalize (trim, uppercase, `A-Z0-9_-`); “+ Add item” collapsed at bottom. Files: `app/dashboard/client-inventory/page.tsx`, `components/client-inventory/*`, `lib/inventory/sku.ts`, `lib/actions/client-inventory.ts`.
- [x] **A7** Dashboard UI consistency — same A6 list-first / create-last pattern on: **Our inventory**, **Fleet**, **Jobs**, **Team**, **Clients**, **Availability**, **Activity**. Soft SKU normalize on Our inventory. Job detail / portal / marketing unchanged.
- [x] **A8** Dev role / persona switcher — Option A quick-login via `signIn("credentials")`; gate `ALLOW_DEV_ROLE_SWITCH=true` + hard deny when `VERCEL_ENV=production`; floating Dev panel; always show name+role in dashboard/portal headers. Personas: OrgAdmin, Morgan, Sam, Dana, Client (rep1). Do **not** enable on Vercel Production.

---

## Current environments

| What | URL / value |
|------|-------------|
| **Prod tenant login** | https://test.logiparty.com/login |
| **Prod marketing** | https://logiparty.com |
| **Local marketing** | http://localhost:3000 (unset `NEXT_PUBLIC_DEV_ORG_SLUG`) |
| **Local tenant** | http://test.localhost:3000 (`.env.local` → Neon **`dev`**) |
| **Seed manager** | `morgan@test.test` / `password123` |
| **Jake admin** | `jakedcl73@gmail.com` (your password) |
| **AUTH_URL (correct)** | `https://logiparty.com` |
| **NEXT_PUBLIC_ROOT_DOMAIN** | `logiparty.com` |
| **Do NOT set in prod** | `NEXT_PUBLIC_DEV_ORG_SLUG`, `ALLOW_DEV_ROLE_SWITCH` |
| **Neon branches** | Production = **`main`**; local = **`dev`** (never reset-seed on main) |

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
