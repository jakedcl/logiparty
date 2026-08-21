# APP_CONTEXT.md — Logiparty
### Master reference for AI agents, collaborators, and future self.
### Read [AGENTS.md](AGENTS.md) and [HOW_TO_BUILD.md](HOW_TO_BUILD.md) before touching code.

---

## 1. What This Is

**Logiparty** is a **multi-tenant SaaS platform** sold to third-party logistics (3PL) companies. Each 3PL runs warehouse, fleet, and crew operations for live events, deliveries, festivals, and corporate work — under **their own brand**. Their clients and internal staff should not see "Logiparty" in day-to-day use.

**Three layers:**

| Layer | Who | Relationship |
|-------|-----|----------------|
| Platform | Logiparty (you) | Sells to 3PL orgs |
| Tenant | 3PL company | Pays for org workspace; heavy daily internal use |
| End client | 3PL's customers (e.g. Red Bull, producers) | Branded portal; job requests, docs, their inventory |

**Core loop:** Client-owned assets sit in the warehouse → job order → assign inventory + fleet + crew → load and deploy → return → clean → store → repeat.

**Pilot customer profile:** A 3PL with a large contract (e.g. branded bars/activations) plus smaller clients. They store client-owned physical assets, fulfill jobs with load-in/load-out windows, and need inventory locks, fleet assignment, and client visibility — not spreadsheets.

**This is not a single-company tool.** ~5 orgs expected in year one; hand onboarding is fine.

---

## 2. Target Customer

- Small to mid-size 3PL companies (10–200 employees)
- Live events, trade shows, festivals, corporate activations, deliveries
- Currently: spreadsheets, group texts, or ill-fitting enterprise software
- Roles: org admin, managers/ops, warehouse staff, drivers, external client contacts

---

## 3. Multi-Tenancy & White-Label

### Org model
- Every user belongs to **exactly one** organization (no multi-org users in v1)
- Organizations are fully isolated — RLS at PostgreSQL level, not app-only
- **Routing:** `{slug}.logiparty.com` for internal staff and client portal (wildcard DNS on Vercel)
- **Later:** custom domain (e.g. `portal.theirdomain.com`) — post-pilot

### White-label (per org)
- Organization display name
- Logo (object storage)
- Primary brand color
- Email "from" name (e.g. "New York Design and Construction" via Resend)
- Client portal uses org branding only

### Branding rule
- **3PL staff must never see "Logiparty"** in the internal app (optional tiny mention on a help page only)
- **Clients** never see Logiparty — only the 3PL's brand

### Org membership & roles
Users have an **org membership** with a primary role. A user may hold **both `Staff` and `Manager`** on one membership (so managers are not forced into crew pickers unless they are also staff).

| Role | Description |
|------|-------------|
| `OrgAdmin` | Billing, users, white-label, org settings |
| `Manager` | Full ops: jobs, inventory, fleet, crew, documents, audit |
| `Staff` | Physical work; capability tags; assigned jobs only |
| `Client` | External user linked to a **client company**; portal only |

**Invite-only:** No public registration. OrgAdmin/Manager sends invite → email link → user completes profile. Role set at invite time.

### Staff capability tags
Fixed platform list (DB-backed, not hardcoded in UI logic only):

| Tag | Meaning |
|-----|---------|
| `driver` | Crew assignment as driver; sees load readiness on assigned jobs |
| `warehouse` | CRUD catalogs; update **loaded** quantities on assigned jobs |
| `forklift` | Forklift-certified — crew picker filter |
| `lead` | Can be assigned as crew lead |
| `rigger` | Specialty |
| `staging` | Specialty |

- Multiple tags per staff user
- Assigned by OrgAdmin or Manager
- Crew picker filters by tag + approved availability

### Client companies & users
- **`client_companies`:** e.g. "Red Bull," "Small Brand Co."
- **`client_users`:** multiple logins per company (name, email, **title** field)
- Jobs link to **`client_company_id`**, not a single user
- Clients see only their company's jobs and inventory

### Client portal
- Separate UX from internal dashboard
- Job **requests** → `draft` jobs for manager acceptance
- Upload documents (PDF, images; mobile-friendly)
- View **only their company's** inventory and jobs
- No staff lists, no other clients' data

---

## 4. Core Domain: Jobs

### What a job is
Central unit of work: inventory lines, fleet, crew, locations, documents, activity. Called **job** (not "event") — may be delivery, festival, etc.

### Job fields
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `org_id` | UUID | RLS anchor |
| `name` | string | |
| `client_company_id` | UUID | FK to client_companies |
| `status` | enum | `draft`, `upcoming`, `ready`, `completed`, `denied` |
| `job_start` | timestamptz | When work/event starts |
| `job_end` | timestamptz | |
| `load_in_start` | timestamptz | |
| `load_in_end` | timestamptz | |
| `load_out_start` | timestamptz | |
| `load_out_end` | timestamptz | |
| `client_poc_name` | string | On-site POC |
| `client_poc_phone` | string | |
| `job_lead_user_id` | UUID | Nullable — staff to contact before job (display) |
| `notes` | text | Internal manager notes |
| `created_by` | UUID | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### Job locations (`job_locations`)
- Up to **5** per job
- Each: `label` (e.g. "Warehouse," "Venue") + `address` (string)
- Enforced in app + DB trigger or check

### Job status flow
```
draft → upcoming → ready → completed
draft → denied   (manager rejects client portal request)
```

| Status | Meaning |
|--------|---------|
| `draft` | Client job request; manager has not accepted |
| `upcoming` | Active job (manager created or accepted draft) |
| `ready` | Auto or manual — trucks loaded, inventory loaded, crew assigned |
| `completed` | Manager closed job |
| `denied` | Manager rejected a client portal `draft` request (terminal for that request) |

- **No** `confirmed`, `staged`, `active`, or mid-lifecycle `cancelled` in v1 (see [docs/DECISIONS.md](docs/DECISIONS.md) D5)
- Manager may **manually** set `ready` even if auto-rules incomplete (v1 default)

### Auto-ready rules
When status is `upcoming` and not `completed`, system evaluates:

1. ≥1 **load-in** crew assignment and ≥1 **load-out** crew assignment
2. ≥1 **fleet vehicle** assigned to job (see §5 Fleet)
3. Every job inventory line with `quantity_assigned > 0` has `quantity_loaded >= quantity_assigned`

→ Set status to `ready`. Reference implementation: `thirdpartylogistics/server/Service/EventService.cs` (port to TypeScript, do not copy C#).

### Inventory & fleet locks
- While job is `upcoming` or `ready`, assigned inventory units and fleet vehicles are **locked** (cannot be fully loaded on another job)
- After **`load_out_end`** passes, release locks — items/vehicles available again
- Completed jobs do not hold locks

### Who creates jobs
- Manager: creates `upcoming` job directly
- Client: submits `draft` request → manager accepts → `upcoming` (or denies → `denied`)

### Recurring / templates
Out of scope for v1.

---

## 5. Catalogs: Inventory & Fleet

Three active catalogs per org (see [docs/SCHEMA.md](docs/SCHEMA.md)). The legacy `tools` table is deprecated — hand tools belong in our inventory.

### Client inventory (`client_inventory_items`)
- Belongs to a **client_company**
- SKU, name, description, `total_quantity`
- Clients see only their company in portal
- Managers filter by client when maintaining catalog

### Our inventory (`inventory_items`)
- 3PL-owned: dollies, hand tools, machines, general gear (not fleet)
- UI label: **Our inventory**
- Managers + staff with `warehouse` tag: CRUD

### Fleet (`fleet_vehicles`)
- Box trucks, vans, etc. — **separate module** from our inventory
- Assigned to jobs via `job_fleet_assignments`
- Required for auto-ready (≥1 vehicle)

### Per-job inventory (`job_inventory_lines`)
| Field | Notes |
|-------|-------|
| `job_id` | |
| `item_type` | `client` or `org` |
| `item_id` | FK to appropriate catalog |
| `quantity_assigned` | |
| `quantity_loaded` | Physical load on truck; updated at warehouse |

- `quantity_loaded` ≤ `quantity_assigned`
- Assigning to job: manager UI **defaults** to job's client inventory; may add org or other clients' items explicitly
- Warehouse staff (tag) or manager updates `quantity_loaded` at warehouse — not field mobile staging

### Per-job fleet (`job_fleet_assignments`)
| Field | Notes |
|-------|-------|
| `job_id` | |
| `fleet_vehicle_id` | |

---

## 6. Crew Assignments (`job_assignments`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `job_id` | UUID | |
| `user_id` | UUID | Staff user |
| `phase` | enum | `LoadIn`, `LoadOut` |
| `assigned_role` | enum | `Driver`, `Laborer`, `Lead` |
| `created_at` | timestamptz | |

- Unique `(job_id, user_id, phase)`
- Manager assigns; picker excludes users who are manager-only (no staff role)
- Filters by capability tag and approved availability
- **`job_lead_user_id`** on job for "who to ask" — may match lead assignment

Staff see **only assigned jobs** (API + RLS).

---

## 7. Availability

Staff submit time-off → manager approves/denies.

| Field | Notes |
|-------|-------|
| `org_id`, `user_id`, `start_time`, `end_time`, `reason` | |
| `status` | `Pending`, `Approved`, `Denied` |

Approved blocks exclude staff from crew picker for overlapping job windows.

**Milestone:** M5 (not blocking MVP core).

---

## 8. Documents

- Stored in **Cloudflare R2** only
- PDF + images; mobile upload support
- Managers: upload, delete any
- Clients: upload, delete own
- Staff: no upload/delete in v1
- Signed URLs per request — never stored in DB
- Document retention after job completed — phase 2 (see DECISIONS)

---

## 9. Activity / Audit Log

Log meaningful mutations to `activity_logs` (entity_type, entity_id, metadata jsonb).

- **Managers:** full org log (dedicated page — not hero/prominent nav)
- **Staff:** assigned jobs only
- **Clients:** filtered — no internal-only entries

---

## 10. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 App Router |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui |
| Auth | NextAuth v5 (Auth.js) |
| Data | Drizzle ORM + PostgreSQL (Neon) |
| Files | Cloudflare R2 |
| Email | Resend |
| Deploy | Vercel (`*.logiparty.com`) |
| Realtime | **Deferred** v1 (refresh OK) |
| Billing | **Deferred** (manual contracts) |

---

## 11. Row-Level Security

Every org-scoped table uses RLS with `app.current_org_id` set per request.

```sql
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON jobs
  USING (org_id = current_setting('app.current_org_id', true)::uuid);
```

See [docs/SCHEMA.md](docs/SCHEMA.md) for full table list.

---

## 12. Repository Layout

```
/
├── app/
│   ├── (auth)/              # login, invite accept
│   ├── (internal)/          # 3PL staff — subdomain
│   └── (portal)/            # client portal — subdomain
├── components/
├── lib/db/, lib/auth/, lib/storage/, lib/activity/
├── docs/                    # SCHEMA, GOLDEN_PATH, DECISIONS, PROGRESS
├── middleware.ts
├── thirdpartylogistics/     # LEGACY REFERENCE — do not modify
├── APP_CONTEXT.md
├── HOW_TO_BUILD.md
└── AGENTS.md
```

---

## 13. Permission Matrix

| Capability | OrgAdmin | Manager | Staff (warehouse) | Staff (other) | Client |
|------------|----------|---------|-------------------|---------------|--------|
| Org settings / white-label | ✓ | — | — | — | — |
| Invite users / tags | ✓ | ✓ | — | — | — |
| Create / edit / delete jobs | — | ✓ | — | — | — |
| Accept draft → upcoming | — | ✓ | — | — | — |
| Deny draft → denied | — | ✓ | — | — | — |
| Request job (draft) | — | — | — | — | ✓ |
| View jobs | All | All | Assigned | Assigned | Own company |
| Client inventory catalog | — | ✓ | ✓ | — | Read own |
| Our inventory | — | ✓ | ✓ | — | — |
| Fleet catalog (view) | ✓ | ✓ | ✓ | ✓ | — |
| Fleet catalog (edit) | ✓ | ✓ | — | — | — |
| Assign inventory / fleet / crew | — | ✓ | — | — | — |
| Update quantity_loaded | — | ✓ | ✓ (assigned job) | — | — |
| Upload documents | — | ✓ | — | — | ✓ |
| Delete documents | — | ✓ | — | — | Own only |
| Availability approve | — | ✓ | — | — | — |
| Availability submit | — | — | ✓ | ✓ | — |
| Audit log | All | All | Assigned jobs | Assigned jobs | Filtered |

---

## 14. API Surface (summary)

Protected by middleware; org from subdomain + session. Prefer server actions where practical.

| Area | Notes |
|------|-------|
| Orgs / settings | White-label CRUD (OrgAdmin) |
| Users / invites | Invite token, complete profile |
| Client companies | CRUD + link client users |
| Jobs | CRUD, status, locations, accept draft |
| Catalogs | client inventory, our inventory, fleet |
| Job lines | inventory assign, loaded qty, fleet assign |
| Assignments | crew CRUD |
| Documents | R2 presign upload, list, delete |
| Availability | staff submit, manager approve (M5) |
| Activity | scoped list |

Full routes implemented incrementally per [HOW_TO_BUILD.md](HOW_TO_BUILD.md).

---

## 15. Onboarding (New Org)

1. Org owner signs up (or manual provision for pilot)
2. Create org: name, slug, logo, color
3. Subdomain live: `{slug}.logiparty.com`
4. Invite managers → staff (with tags) → client companies + client users
5. No self-serve role picking

---

## 16. Real-Time Updates

**Deferred for v1.** Manual refresh on dashboards. Add Supabase Realtime or Ably post-pilot.

---

## 17. Print: Job Run Sheet

- `window.print()` + print CSS
- Job meta, locations, inventory (assigned/loaded), fleet, crew by phase, job lead, document names
- Server PDF later

---

## 18. Known Scope Boundaries (v1)

**In scope:** Multi-tenant, subdomain, white-label, jobs with 5 locations, four catalogs, auto-ready, client portal, invites, RLS, mobile-friendly web, audit log.

**Out of scope:**

- Stripe / in-app billing
- React Native app
- SSO / 2FA
- Realtime websockets
- Custom domains per org
- Recurring jobs / templates
- Client edit of draft requests
- Cancelled status (use completed + notes)
- Rack/slot warehouse locations
- GPS / driver tracking
- Custom capability tags per org
- In-app messaging

---

## 19. Prompt for AI Agents

```
You are building Logiparty — multi-tenant 3PL SaaS.

Read in order: AGENTS.md → HOW_TO_BUILD.md → APP_CONTEXT.md → docs/SCHEMA.md.
Implement ONE ticket ID per session. Update docs/PROGRESS.md when done.

Stack: Next.js 15, Tailwind v4, shadcn/ui, NextAuth v5, Drizzle, Neon, R2, Vercel.

Critical rules:
- RLS on all org tables; set app.current_org_id per request.
- Subdomain tenancy: {slug}.logiparty.com
- 3PL staff UI: no "Logiparty" branding.
- Staff see only assigned jobs (RLS + queries).
- Clients: portal only, per client_company isolation.
- quantity_loaded not quantity_staged; release locks after load_out_end.
- Files to R2 only; no signed URLs in DB.
- Log mutations to activity_logs.
- Do not edit thirdpartylogistics/ (legacy reference).
- Do not commit secrets.
```

---

## 20. Project Metadata

| Field | Value |
|-------|-------|
| Product name | Logiparty |
| Repo | logiparty (root app; `thirdpartylogistics/` is legacy) |
| Domain | `*.logiparty.com` (wildcard) |
| Architecture | Multi-tenant SaaS |
| Auth | NextAuth v5 sessions |
| DB isolation | PostgreSQL RLS |
| v1 goal | Pilot 3PL (Red Bull–scale warehouse workflow) |

*Keep this file in sync with [docs/DECISIONS.md](docs/DECISIONS.md) and [docs/SCHEMA.md](docs/SCHEMA.md).*
