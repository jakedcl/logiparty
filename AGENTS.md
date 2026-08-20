# AGENTS.md — Logiparty

Instructions for AI coding agents (Cursor, etc.).

---

## Read order (every session)

1. **AGENTS.md** (this file)
2. **[docs/OPEN_TABS.md](docs/OPEN_TABS.md)** — what's active, blocked, done (update when you finish)
3. **[HOW_TO_BUILD.md](HOW_TO_BUILD.md)** — find your ticket ID and Definition of Done
4. **[APP_CONTEXT.md](APP_CONTEXT.md)** — product rules
5. **[docs/SCHEMA.md](docs/SCHEMA.md)** — tables and columns (do not invent schema)
6. **[docs/DECISIONS.md](docs/DECISIONS.md)** — defaults for ambiguous cases
7. **[docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md)** — when ticket touches jobs/portal flows

---

## Session rules

1. **One ticket per session** — e.g. `M0-4` only. Never "build the whole app."
2. **Cite ticket ID** in branch name and commit message.
3. **Stop at milestone DoD** — do not start the next milestone unless the user asks.
4. **Update [docs/PROGRESS.md](docs/PROGRESS.md)** when the ticket is complete.
5. **Update [docs/OPEN_TABS.md](docs/OPEN_TABS.md)** when finishing or starting queue items (go-live / ops work).
6. **Do not edit `thirdpartylogistics/`** — legacy reference only.
7. **Do not commit secrets** — use `.env.local` and `.env.example`.
8. **Match [docs/SCHEMA.md](docs/SCHEMA.md)** — if schema must change, update SCHEMA.md in the same PR.

---

## Copy-paste session prompt

```
Read: AGENTS.md, docs/OPEN_TABS.md, HOW_TO_BUILD.md, APP_CONTEXT.md, docs/SCHEMA.md
Work ONLY on OPEN_TABS item [A?] OR ticket [ID]. Do not start other active items.
Update docs/OPEN_TABS.md and docs/PROGRESS.md when finished.
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
- Job statuses: `draft`, `upcoming`, `ready`, `completed`, `denied`
- Use `**quantity_loaded`**, not `quantity_staged`
- Release inventory/fleet locks after `**load_out_end**`
- **Invite-only** accounts
- Staff: **assigned jobs only**
- Clients: **client_company** scope only

