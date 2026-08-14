# AGENTS.md — Logiparty

Instructions for AI coding agents (Cursor, etc.).

---

## Read order (every session)

1. **AGENTS.md** (this file)
2. **[HOW_TO_BUILD.md](HOW_TO_BUILD.md)** — find your ticket ID and Definition of Done
3. **[APP_CONTEXT.md](APP_CONTEXT.md)** — product rules
4. **[docs/SCHEMA.md](docs/SCHEMA.md)** — tables and columns (do not invent schema)
5. **[docs/DECISIONS.md](docs/DECISIONS.md)** — defaults for ambiguous cases
6. **[docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md)** — when ticket touches jobs/portal flows

---

## Session rules

1. **One ticket per session** — e.g. `M0-4` only. Never "build the whole app."
2. **Cite ticket ID** in branch name and commit message.
3. **Stop at milestone DoD** — do not start the next milestone unless the user asks.
4. **Update [docs/PROGRESS.md](docs/PROGRESS.md)** when the ticket is complete.
5. **Do not edit `thirdpartylogistics/`** — legacy reference only.
6. **Do not commit secrets** — use `.env.local` and `.env.example`.
7. **Match [docs/SCHEMA.md](docs/SCHEMA.md)** — if schema must change, update SCHEMA.md in the same PR.

---

## Copy-paste session prompt

```
Ticket: [ID from HOW_TO_BUILD.md]
Read: AGENTS.md, HOW_TO_BUILD.md, APP_CONTEXT.md, docs/SCHEMA.md
Implement ONLY ticket [ID]. Do not implement the next ticket.
Definition of done: [paste from HOW_TO_BUILD.md]
Update docs/PROGRESS.md when finished.
```

---

## PR checklist

See [HOW_TO_BUILD.md §12](HOW_TO_BUILD.md#12-pr-checklist).

---

## Stack (do not substitute without user approval)

- Next.js 15 App Router
- Tailwind CSS v4
- shadcn/ui
- NextAuth v5
- Drizzle ORM + Neon PostgreSQL
- Cloudflare R2
- Resend
- Vercel

---

## Critical product rules

- Multi-tenant via **subdomain** `{slug}.logiparty.com`
- **RLS** on all org-scoped tables; `app.current_org_id` per request
- **No "Logiparty"** in 3PL staff UI
- Job statuses: `draft`, `upcoming`, `ready`, `completed`
- Use `**quantity_loaded`**, not `quantity_staged`
- Release inventory/fleet locks after `**load_out_end**`
- **Invite-only** accounts
- Staff: **assigned jobs only**
- Clients: **client_company** scope only

