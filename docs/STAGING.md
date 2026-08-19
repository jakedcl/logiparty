# Staging database (optional)

You do **not** need a second Neon branch to keep building locally. One `DATABASE_URL` in `.env.local` is enough.

**Important:** If you copy the same `DATABASE_URL` from `.env.local` into Vercel Production, local scripts (including `db:reset-seed`) affect the live site. Before go-live, create a **separate Neon branch** for local dev and keep Production on `main` (or a dedicated `production` branch).

When you want a throwaway copy later (without touching production):

1. In the [Neon console](https://console.neon.tech), open the `logiparty` project.
2. Create a branch from `main` (or your current branch), e.g. `staging`.
3. Copy that branch’s connection string into `.env.local` as `DATABASE_URL` (or a separate env you pass to scripts).
4. Run:

```bash
npm run db:migrate:sql
npm run db:seed
npm run test:integration
```

To wipe seeded filler (testtenant/demo orgs, test users, catalogs) and re-seed fresh:

```bash
npm run db:reset-seed -- --confirm
```

Uses `DATABASE_URL` from `.env.local`. Only deletes orgs `testtenant` and `demo` plus the seven seed test accounts — other users are kept. **Does not delete the whole database** — but if Production shares this URL, Production sees the same change.

Do not commit connection strings. `.env.local` stays untracked.
