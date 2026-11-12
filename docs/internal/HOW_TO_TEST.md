# HOW_TO_TEST.md — Logiparty

Jake: start here when you need to remember how production is set up and what to click. This repo is **public** — no passwords, hashes, tokens, or database URLs in this file or anywhere in git.

**Passwords** live outside the repo (1Password and the logiparty bot). Ask there when you need to sign in.

**Production state (2026-11-12):** Northline (`northline.logiparty.com`) is the interview demo org. Legacy `nydac` and `axis` tenants were removed. The sandbox org was renamed back to **TestTenant3PL** on `test.logiparty.com`; extra seeded users and jobs from earlier experiments were removed. Your personal admin login is **jakedcl73@gmail.com** on test — treat that as yours, not a shared QA account.

---

## Production URLs

| URL | What it is |
|-----|------------|
| [https://logiparty.com](https://logiparty.com) | Marketing site (pricing, request access, apex `/login` org picker) |
| [https://test.logiparty.com](https://test.logiparty.com) | **TestTenant3PL** — Jake's sandbox / integration tenant |
| [https://northline.logiparty.com](https://northline.logiparty.com) | **Northline Logistics** — interview demo |
| [https://demo.logiparty.com](https://demo.logiparty.com) | **Demo Warehouse Co** — lighter demo dataset |

Staff and managers use `/login` on the org subdomain → **dashboard**. Client reps use the same login → **client portal**.

---

## Accounts by tenant (emails and roles only)

### test.logiparty.com (TestTenant3PL)

| Email | Name (seed) | Role |
|-------|-------------|------|
| admin@test.test | Alex Admin | Org admin |
| morgan@test.test | Morgan Manager | Manager |
| sam@test.test | Sam Warehouse | Staff |
| dana@test.test | Dana Driver | Staff |
| rep1@redbull.test | — | Client portal (Red Bull) |
| rep2@redbull.test | — | Client portal (Red Bull) |

**Jake-only:** jakedcl73@gmail.com — admin on this tenant (not shared).

`@test.test` addresses **do not receive real email**. Forgot-password against those inboxes only works if you read the dev console / logs (no `RESEND_API_KEY`) or copy the link from server logs. Use a real inbox (e.g. jakedcl73@gmail.com) to exercise email delivery end-to-end.

### northline.logiparty.com (Northline Logistics)

| Email | Name (seed) | Role |
|-------|-------------|------|
| riley@northline.test | — | Admin |
| morgan@northline.test | Morgan Hale | Manager (**usual interview login**) |
| dana@northline.test | — | Manager |
| chris@northline.test | — | Staff |
| pat@northline.test | — | Staff |
| jamie@northline.test | — | Staff |
| alex@summit.test | — | Client (Summit) |
| jordan@summit.test | — | Client (Summit) |
| sam@harbor.test | — | Client (Harbor) |

### demo.logiparty.com (Demo Warehouse Co)

| Email | Name (seed) | Role |
|-------|-------------|------|
| admin@demo.test | Devon Demo | Admin |

---

## Smoke paths (what to click)

### Staff / manager / admin (dashboard)

1. Sign in on the org subdomain → lands on **dashboard** home (managers/admins) or **My jobs** (staff-only).
2. **Jobs:** sidebar **Jobs** → list / calendar; open a job → run sheet (locations, inventory lines, fleet, crew).
3. **Inventory:** **Inventory** → org catalog; client-owned SKUs under **Clients** as needed.
4. **Commercial:** **Quotes** and **Invoices** (managers/admins) — create/edit, PDF-style views where implemented.
5. **Team:** **Team** → invite staff (admin/manager).
6. **Clients:** **Clients** → companies and client portal invites.
7. **Search:** **Cmd-K** (or **Ctrl-K**) — jump to jobs, clients, gear.
8. **Reports:** **Reports** — exports / summaries (admin/manager).

**Role differences (quick check):**

- **Staff:** **My jobs**, assignments, availability; no full jobs list admin, no commercial admin.
- **Manager:** full jobs + commercial + team invites (per permissions).
- **Admin:** everything including org settings / billing hooks where present.

### Client portal

1. Sign in as a `*.test` client rep → **portal** home.
2. **Jobs / requests** visible for that client company only.
3. **Inventory** scoped to their company.
4. Upload / notes paths if seeded on the job.

### Marketing (logiparty.com)

1. Home → scroll features, FAQ, request access form.
2. **Pricing** → invite-only positioning (no checkout).
3. Apex **/login** → org slug picker (redirects to `https://{slug}.logiparty.com/login`).

### Forgot / reset password (new)

On a **tenant** host (not apex picker):

1. Open `https://{org}.logiparty.com/login` → **Forgot password?**
2. Submit the account email → generic confirmation (no account enumeration).
3. Email: Logiparty-branded message from `mail.logiparty.com` with a **one-time** link (expires in **1 hour**).
4. Link opens `https://{org}.logiparty.com/reset-password/{token}` → set new password → signed in.

**Testing tips:**

- **Real mail:** use jakedcl73@gmail.com (or another real address with membership + password on that org).
- **Seed `@test.test` mailboxes:** email is not delivered; in local dev without Resend, the reset URL is printed in the server log. In production, those addresses still won't receive mail — expect silent success on the form only.
- Reusing a spent link should show **invalid or expired**; request again from **Forgot password**.

---

## Local development (safe database)

1. Copy `.env.example` → `.env.local`. Use a **local** Postgres `DATABASE_URL` only — never point agents or scripts at Neon production.
2. `npm run db:migrate:sql` then `npm run db:seed` on local DB only.
3. `npm run dev` → e.g. `http://test.localhost:3000` (add `test` / `northline` / `demo` to `/etc/hosts` if needed).
4. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

Forgot-password locally: submit the form, copy the link from the terminal when `RESEND_API_KEY` is unset.

---

## Automated checks

| Command | Purpose |
|---------|---------|
| `npm run test` | Unit tests (password reset URL / token helpers) |
| `npm run test:integration` | RBAC matrix + optional RLS DB checks (skips if no `DATABASE_URL`) |
| `npm run test:role-walk` | Scripted role navigation (needs DB + seed) |

Do **not** run `db:seed` or migrations against Neon production from an agent or CI job.
