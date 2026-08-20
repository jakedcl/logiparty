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
| `0011_m3_jobs.sql` | jobs table + job_status enum |
| `0012_m3_job_locations.sql` | job locations (max 5) |
| `0013_m3_job_inventory.sql` | job inventory lines |
| `0014_m3_job_fleet.sql` | job fleet assignments |
| `0015_m3_job_assignments.sql` | job crew assignments |
| `0016_m4_documents.sql` | job documents (R2 metadata) |
| `0017_m5_availability.sql` | availability_requests |
| `0018_a3_marketing_leads.sql` | apex marketing / waitlist leads |
| `0019_m6_org_billing.sql` | org Stripe billing columns (soft status) |

Then seed (optional):

```bash
npm run db:seed
```
