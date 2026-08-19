# HOW_TO_BUILD.md — Logiparty

Methodical build playbook for humans and AI agents. **One ticket per session.**

**Read first:** [AGENTS.md](AGENTS.md) → this file → [APP_CONTEXT.md](APP_CONTEXT.md) → [docs/SCHEMA.md](docs/SCHEMA.md)

**Track progress:** [docs/PROGRESS.md](docs/PROGRESS.md)

---

## 1. Team hats (solo dev wears one hat per ticket)

| Hat | Owns |
|-----|------|
| **Architect** | Schema, RLS, auth model, permissions |
| **Backend** | Drizzle, migrations, server actions, activity log |
| **FE Internal** | Manager/staff UI on subdomain |
| **FE Portal** | Client portal UI |
| **DevOps** | Vercel, Neon branches, env, wildcard DNS |
| **QA** | RBAC matrix, cross-org tests |
| **PM** | Scope, accept/reject tickets |

---

## 2. Non-negotiable rules

1. Every org-scoped table has `org_id` + RLS.
2. Set `app.current_org_id` on DB connection at request start.
3. Subdomain resolves org: `{slug}.logiparty.com`.
4. 3PL staff UI never shows "Logiparty" (optional tiny help footer only).
5. Staff see only **assigned** jobs (queries + RLS).
6. Clients isolated by **client_company**; no cross-client data.
7. Files go to **R2** only; signed URLs per request, not stored in DB.
8. Log meaningful mutations to `activity_logs`.
9. **Invite-only** auth — no public role registration.
10. Do not modify `thirdpartylogistics/` (legacy reference).

---

## 3. Dependency graph

```
M0 Foundation
 └── M1 Users & invites
      └── M2 Catalogs
           └── M3 Jobs core
                ├── M4 Client portal
                └── M5 Ops polish
                     └── M6 Post-pilot (optional)
```

**Do not parallelize** tickets that share schema across unmerged milestones.

---

## 4. Milestone 0 — Foundation

**Goal:** App deploys; org exists; auth + RLS proven.

| ID | Ticket | Hat | Depends |
|----|--------|-----|---------|
| M0-1 | Init Next.js 15 App Router + Tailwind v4 + shadcn | Architect | — |
| M0-2 | Drizzle + Neon client + migration pipeline | Backend | M0-1 |
| M0-3 | Schema: `organizations`, `users`, `org_memberships` | Backend | M0-2 |
| M0-4 | RLS spike: prove org isolation on one table | Backend | M0-3 |
| M0-5 | NextAuth email/password session | Backend | M0-1 |
| M0-6 | Middleware: subdomain → org slug + auth | Platform | M0-3, M0-5 |
| M0-7 | Internal shell layout (org-branded header, no Logiparty) | FE Internal | M0-6 |
| M0-8 | `.env.example` + README local dev + Vercel notes | DevOps | M0-6 |

### M0 Definition of Done

- [ ] Two seed orgs; user in org A cannot read org B data
- [ ] Login works on subdomain (local: see README hosts/`*.localhost` notes)
- [ ] `lib/auth/permissions.ts` skeleton exists
- [ ] `docs/PROGRESS.md` tickets M0-1…M0-8 checked

---

## 5. Milestone 1 — Onboarding & users

**Goal:** Invite flow; roles; client companies.

| ID | Ticket | Hat | Depends |
|----|--------|-----|---------|
| M1-1 | White-label settings page (name, logo URL, color) | FE Internal | M0 |
| M1-2 | Invite tokens + email (Resend) + accept profile | Backend + FE | M0 |
| M1-3 | Role at invite: OrgAdmin, Manager, Staff, Client | Backend | M1-2 |
| M1-4 | Staff capability tags CRUD | FE Internal | M1-3 |
| M1-5 | Dual role: Staff + Manager on one membership | Backend | M1-3 |
| M1-6 | `client_companies` + `client_users` schema & CRUD | Backend | M0 |
| M1-7 | Client invite with company, name, title | FE Portal | M1-6 |

### M1 DoD

- [ ] Manager invites warehouse staff with `warehouse` tag
- [ ] Two client users under same client company can log in
- [ ] No signup without invite token

---

## 6. Milestone 2 — Catalogs

**Goal:** Four catalogs before jobs.

| ID | Ticket | Hat |
|----|--------|-----|
| M2-1 | Org inventory CRUD | FE Internal |
| M2-2 | Client inventory CRUD (filter by client company) | FE Internal |
| M2-3 | Fleet vehicles CRUD | FE Internal |
| M2-4 | Tools CRUD (thin) | FE Internal |
| M2-5 | RLS on all catalog tables | Backend |
| M2-6 | Activity log on catalog mutations | Backend |

### M2 DoD

- [ ] Manager filters client A vs B inventory
- [ ] Client portal lists only their company inventory

---

## 7. Milestone 3 — Jobs core

**Goal:** Internal end-to-end job without client portal.

| ID | Ticket | Hat |
|----|--------|-----|
| M3-1 | `jobs` CRUD + statuses | Backend |
| M3-2 | `job_locations` max 5 | Backend + FE |
| M3-3 | Job detail panels (summary, locations, inventory, fleet, crew) | FE Internal |
| M3-4 | Assign inventory (default client filter; allow org/other) | FE Internal |
| M3-5 | `quantity_loaded` + lock rules | Backend |
| M3-6 | Assign fleet to job | FE Internal |
| M3-7 | Crew assignments; exclude manager-only from picker | Backend |
| M3-8 | `job_lead_user_id` display | FE Internal |
| M3-9 | Auto-ready service (TypeScript) | Backend |
| M3-10 | Release locks after `load_out_end` | Backend |
| M3-11 | Staff "My Jobs" list | FE Internal |
| M3-12 | Print run sheet | FE Internal |

### M3 DoD

- [ ] [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md) steps 1–11 pass on internal app only
- [ ] Second job cannot load same units while first job holds lock

---

## 8. Milestone 4 — Client portal

| ID | Ticket | Hat |
|----|--------|-----|
| M4-1 | Portal layout (org brand only) | FE Portal |
| M4-2 | Client auth routes on subdomain | Platform |
| M4-3 | Job request → `draft` | Backend + FE |
| M4-4 | Manager accept draft → `upcoming` | FE Internal |
| M4-5 | R2 document upload + list | Backend + FE |
| M4-6 | Client delete own docs | Backend |
| M4-7 | Mobile-responsive job list + upload | FE Portal |

### M4 DoD

- [ ] Full [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md) passes

---

## 9. Milestone 5 — Ops polish

| ID | Ticket | Hat |
|----|--------|-----|
| M5-1 | Availability requests | Full stack |
| M5-2 | Crew picker respects time-off | Backend |
| M5-3 | Activity log page (managers; low prominence) | FE Internal |
| M5-4 | Cross-org + RBAC integration tests | QA |
| M5-5 | Staging Neon branch + seed script | DevOps |
| M5-6 | Security pass (cookies, rate limit login) | Backend |

### M5 DoD

- [ ] Pilot customer could run one real job without DB access

---

## 10. Milestone 6 — Post-pilot (do not block MVP)

- Custom domains per org
- Realtime (Ably / Supabase)
- Stripe billing
- Document retention rules
- SSO / 2FA
- Server-side PDF

---

## 11. Seven-week solo calendar (adjust as needed)

| Week | Milestone | Demo |
|------|-----------|------|
| 1 | M0 | Login on `testtenant3pl.*` subdomain, empty dashboard |
| 2 | M1 | Invites + client company |
| 3 | M2 | Four catalogs |
| 4–5 | M3 | Job upcoming → ready |
| 6 | M4 | Client request + doc upload |
| 7 | M5 | Time off + staging deploy |

---

## 12. PR checklist

- [ ] Ticket ID in branch/PR title (`feat/M0-4-rls-spike`)
- [ ] Migration if schema changed
- [ ] RLS policy for new org tables
- [ ] `permissions.ts` updated
- [ ] Activity log on mutations
- [ ] No secrets in diff
- [ ] Tested on subdomain locally
- [ ] RBAC spot-check if applicable

---

## 13. QA matrix (before pilot)

| Scenario | Manager | Staff assigned | Staff unassigned | Client |
|----------|---------|----------------|------------------|--------|
| List jobs | all org | assigned | none | own company |
| Other client inventory | yes | no | no | no |
| Assign crew | yes | no | no | no |
| Update loaded qty | yes | warehouse tag | no | no |
| Upload doc | yes | no | yes | own |
| Cross-org URL | 403 | 403 | 403 | 403 |

---

## 14. Agent session template

```
Ticket: [e.g. M3-9]
Read: APP_CONTEXT §4, docs/SCHEMA.md (job_* tables), docs/GOLDEN_PATH.md steps 9-10
Implement ONLY this ticket. Do not start the next ticket.
Definition of done: [paste from section above]
Update docs/PROGRESS.md when complete.
```

---

## 15. Legacy reference map (`thirdpartylogistics/`)

| Legacy file | Reimplement as |
|-------------|----------------|
| `server/Service/EventService.cs` | `lib/jobs/auto-ready.ts` (ready not staged) |
| `server/Service/EventAccessService.cs` | job list scoping + RLS |
| `client/src/auth/permissions.js` | `lib/auth/permissions.ts` |
| `client/src/pages/EventDetailPage.jsx` | job detail panel layout |
| `client/src/components/EventPrintSheet.jsx` | print run sheet |
| `server/Data/schema.sql` | **Do not copy** — use `docs/SCHEMA.md` |

---

## 16. MVP done definition

1. Subdomain multi-tenant + white-label  
2. Invite-only users + client companies  
3. Four catalogs + jobs + fleet + crew + loaded + auto-ready  
4. Client portal: draft request, docs, inventory view  
5. Staff: my jobs + job lead visible  
6. Mobile-friendly web  
7. Cross-org isolation verified  

**Not required:** Stripe, native app, realtime, custom domains.
