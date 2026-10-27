# Logiparty

Multi-tenant SaaS for 3PL companies (warehouse, fleet, crew for events and deliveries). Each org gets a subdomain workspace plus a white-label client portal. Live: logiparty.com (demo tenant: test.logiparty.com).

## Dev framework

This repo follows Jake's dev framework: [jakedcl/dev-framework](https://github.com/jakedcl/dev-framework) (start at its `AGENTS.md`). The framework is the source of truth; if anything in this file conflicts with it, the framework wins.

## Stack (from package.json)
Next.js ^15.5 App Router, React ^19.2, Tailwind 4, shadcn/ui (cva, tailwind-merge), NextAuth 5 beta + Drizzle adapter, Drizzle ORM ^0.45 on Neon Postgres with RLS, Cloudflare R2 (AWS S3 SDK), Resend, Stripe (scaffolded, off without keys), zod 4. Deployed on Vercel.

## Layout
- `app/` marketing site, `dashboard/` (staff), `portal/` (clients), `demo/`, `api/`, `(auth)`, `invite/`
- `lib/` server code: `auth/`, `db/` (schema.ts, migrations/, seed.ts), `jobs/`, `inventory/`, `storage/`, `email/`, `org/`, `stripe.ts`
- `middleware.ts` subdomain → tenant routing
- `scripts/` migration runner, seeds, RLS check, integration tests
- `docs/` SCHEMA, DECISIONS, GOLDEN_PATH, OPEN_TABS, PROGRESS, STAGING, how-it-works

## Commands
- `npm run dev` (open `http://nydac.localhost:3000`; add nydac/test/axis `.localhost` to /etc/hosts)
- `npm run build`, `npm run lint`
- `npm run db:migrate:sql` then `npm run db:seed`; `npm run db:verify-rls`; `npm run test:integration`
- Env: copy `.env.example` → `.env.local`; needs `DATABASE_URL`, `AUTH_SECRET`

## Read before changing
- Schema: `docs/SCHEMA.md` (don't invent columns; update it with any schema change)
- Tenancy, RLS, job locks: `docs/how-it-works.md`
- Open work: `docs/OPEN_TABS.md`; ambiguous cases: `docs/DECISIONS.md`

## Gotchas
- RLS policies key on `app.current_org_id`; app connects as `logiparty_app` (no BYPASSRLS, migration 0009). Plain `db` client is used outside RLS only on purpose (login, org lookup, Stripe webhook, cron).
- Job statuses: draft, upcoming, ready, completed, denied. Upcoming/ready jobs lock inventory and vehicles until `load_out_end`.
- Use `quantity_loaded`, not `quantity_staged`.
- No "Logiparty" branding in 3PL staff UI (white-label). Accounts are invite-only; staff see assigned jobs only; clients see their client_company only.
- `thirdpartylogistics/` is a local legacy copy (not in git). Don't edit it.
- Server Actions body limit is 20mb (`next.config.ts`), for document uploads.
