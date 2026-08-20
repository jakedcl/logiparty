# Getting started with Logiparty

One page to go from zero → local dev → production. Read this first.

---

## Quick start (local)

```bash
cd /Users/jakedcl/Dev/logiparty
npm install
npm run db:migrate:sql   # first time only
npm run db:seed          # test + demo orgs, test users
npm run dev              # http://test.localhost:3000
```

Add to `/etc/hosts` if you haven't:

```
127.0.0.1 test.localhost
127.0.0.1 demo.localhost
```

Copy `.env.example` → `.env.local` and fill `DATABASE_URL`, `AUTH_SECRET`, etc.

### Test logins (password `password123`)

| URL | Email | Role |
|-----|-------|------|
| http://test.localhost:3000 | `ed@test.test` | Org admin (Ed) |
| http://test.localhost:3000 | `mike@test.test` | Manager (Mike Oso) |
| http://test.localhost:3000 | `tom@test.test` | Staff (warehouse) |
| http://test.localhost:3000 | `paul@test.test` | Staff (driver) |
| http://test.localhost:3000 | `michaela@redbull.test` | Client portal (POC) |
| http://demo.localhost:3000 | `admin@demo.test` | Demo org (RLS checks) |

**Your personal account:** `jakedcl73@gmail.com` is linked as TestTenant3PL org admin on the current database. Use your existing password (not `password123`). Re-run anytime:

```bash
npm run db:relink-admin
```

---

## Production

| URL | Status (checked 2026-08-19) |
|-----|------------------------------|
| https://logiparty.com/api/health | **200** — `{"status":"ok"}` |
| https://logiparty.com/login | **200** (redirects to `www.logiparty.com/login`) |
| https://test.logiparty.com/api/health | **Fails** — wildcard subdomain not configured yet |

After wildcard DNS is live, log in at **https://test.logiparty.com** with the same seed accounts (or your personal admin account).

Latest Vercel deployment: **success** on commit `2653b5f` (main).

---

## What was wiped vs what's fine

If you ran `npm run db:reset-seed -- --confirm` earlier:

| Removed | Kept |
|---------|------|
| `test` and `demo` orgs and all their jobs, catalogs, fleet | Other orgs (if any) |
| Seed test accounts (`ed@test.test`, etc.) | Personal accounts like `jakedcl73@gmail.com` |
| Client companies under test/demo | — |

**Current state (after `npm run db:seed`):** test + demo exist, **0 jobs**, catalogs re-seeded, test users back. Personal admin re-linked to test.

`db:reset-seed` only touches seed orgs/users — it does **not** drop the whole database. But if Production shares the same `DATABASE_URL`, production sees the same wipe.

---

## Neon branch strategy

**Concept:** two databases, same schema. Local scripts only touch `dev`; live traffic stays on `main`.

| Env | Neon branch | Where `DATABASE_URL` lives |
|-----|-------------|----------------------------|
| **Local** | `dev` (pooled host `ep-lucky-water-aphwec7q-pooler…`) | `.env.local` only — never commit |
| **Production** | `main` (pooled host `ep-red-surf-apcicxpa-pooler…`) | Vercel **Production** env only |

Done (A5, 2026-08-20): Neon project **logiparty** has branch `dev` forked from `main`. Local `.env.local` points at `dev`. Vercel Production stays on `main`.

- Safe locally: `npm run db:reset-seed -- --confirm` (only resets seed orgs on `dev`)
- Never point local at `main`, and never run reset-seed against Production

If you recreate `.env.local` from `.env.example`, copy the **`dev`** pooled connection string from the [Neon console](https://console.neon.tech) (project **logiparty** → branch **dev** → pooled).

See also [docs/STAGING.md](STAGING.md).

---

## Your 3 clicks in Vercel (if not done)

Open [vercel.com](https://vercel.com) → **logiparty** project:

### 1. Wildcard subdomain

**Settings → Domains** → Add `*.logiparty.com` (and ensure `logiparty.com` / `www.logiparty.com` are verified).

Without this, `test.logiparty.com` will not resolve (SSL/connect errors).

### 2. Environment variables checklist

**Settings → Environment Variables** — Production must have (values not shown here):

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon **main** branch pooled URL — must differ from local dev after you split branches |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://logiparty.com` (apex — **not** a tenant subdomain; see OPEN_TABS A2) |
| `AUTH_TRUST_HOST` | `true` (required so login works on `*.logiparty.com`) |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `logiparty.com` |
| `NEXT_PUBLIC_DEV_ORG_SLUG` | **Local only** — do not set in Production |
| `R2_*` | If using document uploads (M4+) |
| `RESEND_*` | If using email invites |

Never commit `.env.local`.

**Neon ↔ Vercel integration gotcha:** Neon may inject `DATABASE_URL_UNPOOLED` into Production. This app reads **`DATABASE_URL` only** (`lib/db/index.ts`). You must add **`DATABASE_URL`** (pooled, `…-pooler…`) scoped to **Production** — Development-only is not enough. Then redeploy.

Log in at **`https://test.logiparty.com/login`**, not apex `logiparty.com`.

**Deployments** → latest **Production** → **Redeploy** (after domain + env changes).

---

## Useful commands

```bash
npm run dev                    # local app
npm run db:seed                # idempotent — safe to re-run
npm run db:reset-seed -- --confirm   # wipe test/demo filler only
npm run db:relink-admin        # re-link personal email as test admin
npm run test:integration       # RLS / RBAC smoke tests
```

---

## Next build work

M5 is in progress. Do **not** start M6 until ready. Track tickets in [docs/PROGRESS.md](PROGRESS.md) and [HOW_TO_BUILD.md](../HOW_TO_BUILD.md).
