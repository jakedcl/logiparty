# Staging database (optional)

You do **not** need a second Neon branch to keep building locally. One `DATABASE_URL` in `.env.local` is enough.

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

Do not commit connection strings. `.env.local` stays untracked.
