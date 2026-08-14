# Logiparty

Multi-tenant SaaS for third-party logistics (3PL) companies — jobs, warehouse inventory, fleet, crew, and a white-label client portal.

**Status:** M1 complete (onboarding, invites, client companies). Neon project `logiparty` provisioned — use `.env.local` (not committed).

---

## Documentation map

| Doc | Purpose |
|-----|---------|
| [README.md](README.md) | This file — entry point |
| [AGENTS.md](AGENTS.md) | Rules for AI agents |
| [HOW_TO_BUILD.md](HOW_TO_BUILD.md) | Milestones, tickets, DoD |
| [APP_CONTEXT.md](APP_CONTEXT.md) | Product + stack spec |
| [docs/SCHEMA.md](docs/SCHEMA.md) | Database tables |
| [docs/GOLDEN_PATH.md](docs/GOLDEN_PATH.md) | Pilot acceptance test |
| [docs/DECISIONS.md](docs/DECISIONS.md) | Locked v1 defaults |
| [docs/PROGRESS.md](docs/PROGRESS.md) | Ticket checklist |

**Legacy reference only:** [`thirdpartylogistics/`](thirdpartylogistics/) — school capstone; do not modify.

---

## Stack

Next.js 15 · Tailwind v4 · shadcn/ui · NextAuth v5 · Drizzle · Neon · R2 · Resend · Vercel

---

## Local development

### Prerequisites

- Node.js 20+
- Neon PostgreSQL database (or local Postgres for RLS dev)
- Copy `.env.example` → `.env.local` and fill values

### Subdomain routing (local)

Production uses `{slug}.logiparty.com`. For local dev:

1. Add to `/etc/hosts`:
   ```
   127.0.0.1 acme.localhost
   127.0.0.1 demo.localhost
   ```
2. Run `npm run dev` and open `http://acme.localhost:3000`

Alternatively set `NEXT_PUBLIC_DEV_ORG_SLUG=acme` if using a dev fallback (see middleware).

### Commands

```bash
npm install
npm run dev          # http://acme.localhost:3000
npm run db:generate  # Drizzle migrations
npm run db:migrate
npm run db:studio    # optional Drizzle Studio
```

---

## Environment variables

See [.env.example](.env.example).

---

## Building agentically

1. Open [docs/PROGRESS.md](docs/PROGRESS.md) — find the next unchecked ticket.
2. Start a session with the prompt template in [AGENTS.md](AGENTS.md).
3. Complete one ticket; check it off in PROGRESS.md.

---

## License

Private — All rights reserved.
