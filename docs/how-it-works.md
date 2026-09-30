# How it works

A tour of the parts of Logiparty that aren't obvious from the UI: how a request finds its tenant, how tenant data is isolated, how jobs lock inventory and vehicles, and what the optional integrations do. Paths are relative to the repo root.

## What it does end to end

A 3PL company (a "tenant" or org) gets a workspace at `{slug}.logiparty.com`. Its managers create jobs, attach inventory, a vehicle and crew to them, and the job moves from `draft` to `upcoming` to `ready` to `completed` (or `denied`). The org's clients log into a separate portal on the same subdomain, where they can request jobs (which arrive as `draft`), upload documents and see only their own company's jobs and inventory.

## Tenant routing

`middleware.ts` runs on every request.

1. `lib/org/subdomain.ts` turns the Host header into an org slug: `nydac.logiparty.com` and `nydac.localhost` both give `nydac`. The apex domain and `www` give no slug (that's the marketing site). Bare `localhost` uses `NEXT_PUBLIC_DEV_ORG_SLUG` if set.
2. If the slug has no row in `organizations`, the request is redirected to the apex. If the database can't be reached, the check is skipped so real tenants keep working.
3. It reads the session JWT. Only middleware sets the `x-org-slug` header (any client-supplied value is deleted first), falling back to the org slug in the JWT.
4. Anyone without a session is sent to `/login`, except for `/login`, `/invite/*`, `/api/auth`, `/api/health`, `/api/stripe/webhook`, the apex homepage, the legal pages and `/demo`.
5. Users who are only clients are kept out of `/dashboard` and sent to `/portal`. Non-clients are kept out of `/portal`.

## Auth and roles

Login is NextAuth v5 with a credentials provider (`lib/auth/config.ts`). It needs email, password and org slug, and checks the password hash with bcrypt and that the user has a membership in that org. Sessions are JWTs that last 7 days and carry the org id, slug and the four role flags: org admin, manager, staff and client. There is a simple in-memory login throttle (8 attempts per 15 minutes per org and email), which is per serverless instance, so it's best effort.

`lib/auth/permissions.ts` is the list of who can do what. Managers include org admins. Staff can also carry capability tags (driver, warehouse and so on), and the `warehouse` tag lets staff manage inventory and record loaded quantities. Server actions in `lib/actions/` check these before doing anything.

New users only arrive by invite. Invites carry a random token and expire after 7 days (`lib/actions/invites.ts`).

## Data isolation

The database is Postgres on Neon, accessed with Drizzle over the HTTP driver (`lib/db/index.ts`). Isolation between orgs is enforced in the database with row-level security, not just in queries.

- The migrations in `lib/db/migrations/` turn on RLS for most of the tenant tables, with policies that compare `org_id` to the `app.current_org_id` setting.
- The connecting Neon role owns the tables and would bypass RLS, so migration `0009` creates a `logiparty_app` role without `BYPASSRLS`.
- `withOrgQuery` and `withOrgQueries` in `lib/db/index.ts` run a batch of `SET LOCAL ROLE logiparty_app`, then `set_config('app.current_org_id', ...)`, then the actual queries in one transaction. That is why tenant queries go through these helpers. A plain `set_config` doesn't carry across separate HTTP calls.
- Some code uses the plain `db` client outside RLS, on purpose: login, looking up the org for a session, the Stripe webhook and the cron route, which all have to work across orgs.
- `npm run db:verify-rls` and `npm run test:integration` check the policies.

Most mutations write an `activity_logs` row in the same transaction (`lib/activity/log.ts`).

## Jobs, locks and auto-ready

The interesting rules live in `lib/jobs/`.

- **Locks** (`lock-window.ts`): a job holds its inventory and vehicle while its status is `upcoming` or `ready`, until its `load_out_end` has passed. Completed and draft jobs don't hold anything.
- **Inventory** (`inventory-locks.ts`): when a line is added or changed, `assertAssignmentFits` checks that the quantity fits in the item's total, minus what other locked jobs have already taken, minus what is already assigned on this job. It fails with a message that says how many are available.
- **Vehicles** (`fleet-locks.ts`): a vehicle locked on another job can't be assigned.
- **Crew** (`availability-blocks.ts`): staff with approved time off overlapping the job's window are left out of the list of people you can assign.
- **Auto-ready** (`auto-ready.ts`): an `upcoming` job is promoted to `ready` once it has at least one load-in crew assignment, one load-out assignment, one vehicle, and every assigned inventory line is fully loaded (`quantity_loaded` at least `quantity_assigned`). It never demotes a job. The check runs after job, crew, inventory and fleet changes.
- `/api/cron/auto-ready` runs the same check over every org's upcoming jobs as a catch-up. There is no schedule for it in this repo (no `vercel.json`), so it only runs if something calls it. If `CRON_SECRET` is set it requires `Authorization: Bearer <secret>`. If it isn't set, the route is open to any caller.

## Integrations

Each of these is optional and the app degrades quietly when its keys are missing.

- **Cloudflare R2** (`lib/storage/r2.ts`): job documents are stored under a storage key, and downloads are 10-minute signed URLs. Uploads must be a PDF or an image, at most 20 MB.
- **Resend** (`lib/email/`): invite emails (without a key the invite link is printed to the server log instead), and a notification when someone submits the "request access" form on the marketing page (stored in `marketing_leads`).
- **Stripe** (`lib/stripe.ts`, `app/api/stripe/webhook`): a subscription scaffold. The webhook verifies the signature and handles `checkout.session.completed`, `customer.subscription.updated` and `customer.subscription.deleted`, which update the org's `billingStatus`. Nothing is locked when billing is unpaid.
- **Dev role switcher** (`lib/dev/role-switch.ts`): a local convenience for switching personas. It is refused when `VERCEL_ENV` is `production`.

## Environment variables

Names only. See `.env.example`.

| Variable | Used for |
|---|---|
| `DATABASE_URL` | Neon connection (pooled) |
| `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST` | NextAuth |
| `NEXT_PUBLIC_ROOT_DOMAIN` | Root domain for subdomain routing |
| `NEXT_PUBLIC_DEV_ORG_SLUG` | Local only. Makes bare localhost act as a tenant |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Document storage |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `LEADS_NOTIFY_EMAIL` | Email |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | Billing scaffold |
| `CRON_SECRET` | Guards the auto-ready route |
| `ALLOW_DEV_ROLE_SWITCH` | Local only |

## More detail

The schema, decision log and setup steps have their own pages in this folder: `SCHEMA.md`, `DECISIONS.md`, `GETTING_STARTED.md` and `GOLDEN_PATH.md`.

## Known limits

- Rate limiting for login is in memory, so it doesn't hold across serverless instances.
- The auto-ready cron isn't scheduled anywhere in the repo.
- Accounts are created by invite or by the seed script. There is no public signup.
- There is no realtime layer. Nothing in the code pushes updates to open pages.
