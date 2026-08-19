# Getting started with Logiparty

One page to go from zero → local dev → production. Read this first.

---

## Quick start (local)

```bash
cd /Users/jakedcl/Dev/logiparty
npm install
npm run db:migrate:sql   # first time only
npm run db:seed          # acme + demo orgs, test users
npm run dev              # http://acme.localhost:3000
```

Add to `/etc/hosts` if you haven't:

```
127.0.0.1 acme.localhost
127.0.0.1 demo.localhost
```

Copy `.env.example` → `.env.local` and fill `DATABASE_URL`, `AUTH_SECRET`, etc.

### Test logins (password `password123`)

| URL | Email | Role |
|-----|-------|------|
| http://acme.localhost:3000 | `admin@acme.test` | Org admin |
| http://acme.localhost:3000 | `morgan@acme.test` | Manager |
| http://acme.localhost:3000 | `sam@acme.test` | Staff (warehouse) |
| http://acme.localhost:3000 | `rep1@redbull.test` | Client portal |
| http://demo.localhost:3000 | `admin@demo.test` | Demo org (RLS checks) |

**Your personal account:** `jakedcl73@gmail.com` is linked as Acme org admin on the current database. Use your existing password (not `password123`). Re-run anytime:

```bash
npm run db:relink-admin
```

---

## Production

| URL | Status (checked 2026-08-19) |
|-----|------------------------------|
| https://logiparty.com/api/health | **200** — `{"status":"ok"}` |
| https://logiparty.com/login | **200** (redirects to `www.logiparty.com/login`) |
| https://acme.logiparty.com/api/health | **Fails** — wildcard subdomain not configured yet |

After wildcard DNS is live, log in at **https://acme.logiparty.com** with the same seed accounts (or your personal admin account).

Latest Vercel deployment: **success** on commit `2653b5f` (main).

---

## What was wiped vs what's fine

If you ran `npm run db:reset-seed -- --confirm` earlier:

| Removed | Kept |
|---------|------|
| `acme` and `demo` orgs and all their jobs, catalogs, fleet | Other orgs (if any) |
| Seven seed test accounts (`admin@acme.test`, etc.) | Personal accounts like `jakedcl73@gmail.com` |
| Client companies under acme/demo | — |

**Current state (after `npm run db:seed`):** acme + demo exist, **0 jobs**, catalogs re-seeded, test users back. Personal admin re-linked to acme.

`db:reset-seed` only touches seed orgs/users — it does **not** drop the whole database. But if Production shares the same `DATABASE_URL`, production sees the same wipe.

---

## Neon branch strategy

**Today:** `.env.local` points at Neon host `ep-red-surf-apcicxpa-pooler.c-7.us-east-1.aws.neon.tech` (likely the `main` branch). If Vercel Production uses the same connection string, local scripts affect live data.

**Recommended going forward:**

1. **Production** → Neon `main` branch connection string in Vercel **Production** env only.
2. **Local dev** → Create a Neon **`dev`** branch from `main` in the [Neon console](https://console.neon.tech) → paste that branch's pooled URL into `.env.local` as `DATABASE_URL`.
3. Run `npm run db:migrate:sql && npm run db:seed` against the dev branch once.

Then you can safely run `db:reset-seed` locally without touching production.

> Neon MCP was not authenticated in the automation session — confirm branches manually in the Neon console under project **logiparty**.

See also [docs/STAGING.md](STAGING.md).

---

## Your 3 clicks in Vercel (if not done)

Open [vercel.com](https://vercel.com) → **logiparty** project:

### 1. Wildcard subdomain

**Settings → Domains** → Add `*.logiparty.com` (and ensure `logiparty.com` / `www.logiparty.com` are verified).

Without this, `acme.logiparty.com` will not resolve (SSL/connect errors).

### 2. Environment variables checklist

**Settings → Environment Variables** — Production must have (values not shown here):

| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Neon **main** branch pooled URL — must differ from local dev after you split branches |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_URL` | `https://acme.logiparty.com` (or your primary tenant URL) |
| `AUTH_TRUST_HOST` | `true` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | `logiparty.com` |
| `R2_*` | If using document uploads (M4+) |
| `RESEND_*` | If using email invites |

Never commit `.env.local`.

### 3. Redeploy

**Deployments** → latest **Production** → **Redeploy** (after domain + env changes).

---

## Useful commands

```bash
npm run dev                    # local app
npm run db:seed                # idempotent — safe to re-run
npm run db:reset-seed -- --confirm   # wipe acme/demo filler only
npm run db:relink-admin        # re-link personal email as acme admin
npm run test:integration       # RLS / RBAC smoke tests
```

---

## Next build work

M5 is in progress. Do **not** start M6 until ready. Track tickets in [docs/PROGRESS.md](PROGRESS.md) and [HOW_TO_BUILD.md](../HOW_TO_BUILD.md).
