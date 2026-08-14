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
| `0006_m2_client_inventory.sql` | client inventory catalog |
| `0007_m2_fleet.sql` | fleet vehicles catalog |
| `0008_m2_tools.sql` | tools catalog |
| `0009_m2_catalog_rls_role.sql` | app role so catalog RLS applies |
| `0010_m2_activity_logs.sql` | activity_logs + RLS |

Then seed (optional):

```bash
npm run db:seed
```
