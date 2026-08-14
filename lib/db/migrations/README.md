# Database migrations

Run SQL files in order against your Neon database:

```bash
npm run db:migrate:sql
```

| File | Milestone |
|------|-----------|
| `0000_m0_core.sql` | orgs, users, memberships |
| `0001_m0_rls.sql` | RLS spike |
| `0002_m1_onboarding.sql` | invites, clients, tags |
| `0003_auth_org_read.sql` | auth org read |
| `0004_public_invite_read.sql` | invite token read |
| `0005_m2_org_inventory.sql` | org inventory catalog |

Then seed (optional):

```bash
npm run db:seed
```
