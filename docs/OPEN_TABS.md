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
| **A3** | Homepage at `logiparty.com` | Agent | Marketing / leads landing page (does not exist yet) |
| **A4** | Unknown subdomain → homepage | Agent | If `{slug}.logiparty.com` has no org in DB, redirect to `https://logiparty.com` (depends on A3 or stub page) |
| **A5** | Neon dev branch | Jake/Agent | Split local `.env.local` from prod `DATABASE_URL` so `db:reset-seed` can't wipe prod |
| **A6** | Client inventory UI polish | Agent (when Jake picks it) | **Docs-only queue item — do not start until Jake asks.** Polish Client inventory first; same pattern likely later for **Our inventory** and **Fleet**. (1) **SKU:** keep label "SKU"; auto-uppercase on input/blur; soft format (letters/numbers/`-`) — not a hard regex. (2) **Demote "Add item"** — collapsed or bottom; list is primary (managers mostly adjust qty). (3) **Items list:** dense table/rows, not big card containers per item. |

---

## Blocked / waiting

| ID | Task | Blocked by |
|----|------|------------|
| B1 | Prod smoke test + logo on login | Login works (A2 done). Remaining: full smoke + logo on login |
| B2 | First real paying customer | Jake tested app + A3 homepage optional |
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

---

## Current environments

| What | URL / value |
|------|-------------|
| **Prod tenant login** | https://test.logiparty.com/login |
| **Seed manager** | `morgan@test.test` / `password123` |
| **Jake admin** | `jakedcl73@gmail.com` (your password) |
| **AUTH_URL (correct)** | `https://logiparty.com` |
| **NEXT_PUBLIC_ROOT_DOMAIN** | `logiparty.com` |
| **Do NOT set in prod** | `NEXT_PUBLIC_DEV_ORG_SLUG` |

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
