# Getting started with Logiparty

One page to go from zero → local dev → production. Read this first.

---

## Quick start (local)

```bash
cd /Users/jakedcl/Dev/logiparty
npm install
npm run db:migrate:sql   # first time only
npm run db:seed          # nydac + test + axis orgs + golden-path users
npm run dev              # http://nydac.localhost:3000
```

Add to `/etc/hosts` if you haven't:

```
127.0.0.1 nydac.localhost
127.0.0.1 test.localhost
127.0.0.1 axis.localhost
```

Copy `.env.example` → `.env.local` and fill `DATABASE_URL`, `AUTH_SECRET`, etc.
Set `NEXT_PUBLIC_DEV_ORG_SLUG=nydac` as the primary local tenant (or leave unset and use `*.localhost`).

### Test logins (password `password123`)

**NYDAC** — New York Design and Construction (`http://nydac.localhost:3000`)

| Email | Role |
|-------|------|
| `ed@test.test` | Org admin (Ed) |
| `mike@test.test` | Manager (Mike Oso) |
| `tom@test.test` | Staff (warehouse) |
| `paul@test.test` | Staff (driver) |
| `michaela@redbull.test` | Client portal (POC) |
| `dom@redbull.test` | Client portal |

**test** — Acme Event Logistics playground (`http://test.localhost:3000`)

| Email | Role |
|-------|------|
| `boss@playground.test` | Org admin (Alex Boss) |
| `riley@playground.test` | Manager |
| `chris@playground.test` | Staff (warehouse) |
| `jamie@playground.test` | Staff (driver) |
| `nina@monster.test` | Client portal (POC · Monster) |
| `kai@monster.test` | Client portal |

**axis** — Axis Global Staging (`http://axis.localhost:3000`)

| Email | Role |
|-------|------|
| `jordan@axis.test` | Org admin (Jordan Hale) |
| `avery@axis.test` | Manager (Avery Quinn) |
| `casey@axis.test` | Staff (warehouse) |
| `blake@axis.test` | Staff (driver) |
| `taylor@volt.test` | Client portal (POC · Volt Energy) |
| `reese@volt.test` | Client portal |

Emails are **globally unique** — do not reuse cast emails across orgs.

**Your personal account:** `jakedcl73@gmail.com` is linked as NYDAC org admin on the current database. Use your existing password (not `password123`). Re-run anytime:

```bash
npm run db:relink-admin
```

---

## Production

| URL | Status (checked 2026-08-19) |
|-----|------------------------------|
| https://logiparty.com/api/health | **200** — `{"status":"ok"}` |
| https://logiparty.com/login | **200** (redirects to `www.logiparty.com/login`) |
| https://test.logiparty.com | **Prod tenant** (Neon `main` still older seed until intentional re-seed) |
| https://nydac.logiparty.com | Use after prod has a `nydac` org row |

After wildcard DNS is live, log in at the tenant that exists on **prod** (today: **https://test.logiparty.com**) with seed accounts or your personal admin. Local Neon **dev** has `nydac`, `test`, and `axis`.

Latest Vercel deployment: **success** on commit `2653b5f` (main).

---

## What was wiped vs what's fine

If you ran `npm run db:reset-seed -- --confirm` earlier:

| Removed | Kept |
|---------|------|
| `nydac` + `test` + `axis` orgs (and legacy `demo`/acme if present) and all their jobs, catalogs, fleet | Other orgs (if any) |
| Seed test accounts (nydac + playground + axis casts; also legacy `admin@demo.test`) | Personal accounts like `jakedcl73@gmail.com` |
| Client companies under seed orgs | — |

**Current state (after `npm run db:seed` on Neon `dev`):** **`nydac`** + **`test`** + **`axis`** exist, catalogs re-seeded, all three casts present. Personal admin re-linked to nydac.

`db:reset-seed` only touches seed orgs/users — it does **not** drop the whole database. But if Production shares the same `DATABASE_URL`, production sees the same wipe. Script refuses Neon `main` hostnames.

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

Without this, tenant subdomains will not resolve (SSL/connect errors).

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

Log in at the **prod** tenant URL (today **`https://test.logiparty.com/login`**), not apex `logiparty.com`.

**Deployments** → latest **Production** → **Redeploy** (after domain + env changes).

---

## Useful commands

```bash
npm run dev                    # local app
npm run db:seed                # idempotent — safe to re-run (nydac + test + axis)
npm run db:reset-seed -- --confirm   # wipe seed filler; re-seed all three orgs
npm run db:relink-admin        # re-link personal email as nydac admin
npm run test:integration       # RLS / RBAC smoke tests
```

---

## Next build work

M5 is in progress. Do **not** start M6 until ready. Track tickets in [docs/PROGRESS.md](PROGRESS.md) and [HOW_TO_BUILD.md](../HOW_TO_BUILD.md).
