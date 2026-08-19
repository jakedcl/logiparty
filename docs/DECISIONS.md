# DECISIONS.md — Locked v1 defaults

Ambiguous product choices resolved here. Agents follow these unless the user overrides.

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| D1 | Manual Ready override? | **Yes** — managers can set `ready` without auto-rules | Night-before ops flexibility |
| D2 | Min fleet for auto-ready? | **≥1** `job_fleet_assignments` row | User specified trucks in ready rules |
| D3 | Loaded granularity? | Per-line `quantity_loaded` int | Same as school staged qty |
| D4 | Client edit draft? | **Defer** — manager accepts/rejects only | Reduce portal scope |
| D5 | Cancelled job status? | **Defer** — use `completed` + internal notes | Simpler enum |
| D6 | Realtime updates? | **Defer** — page refresh OK | M5+ |
| D7 | Local subdomain dev | `/etc/hosts` → `acme.localhost` + port 3000 | See README |
| D8 | Logiparty visible to staff? | **No** except optional help footer | White-label positioning |
| D9 | Multi-org per user? | **No** | v1 simplicity |
| D10 | Manager in crew picker? | Only if `is_staff = true` on membership | Dual manager+staff allowed |
| D11 | Job lead vs Lead role | `job_lead_user_id` on job + optional `Lead` assignment | Display "who to ask" |
| D12 | Custom domain per org? | **Post-pilot** (M6) | Subdomain first |
| D13 | Stripe billing? | **Manual** invoices | User focus on product |
| D14 | Document retention | **Defer** hard immutability | Soft delete rules in M5+ |
| D15 | Auth method v1 | Email + password via NextAuth | SSO later |
| D16 | Org onboarding v1 | Manual seed + invite for pilot; self-serve later | ~5 orgs year one |
| D17 | Separate tools catalog? | **No** — unified into `inventory_items` ("Our inventory") | Dollies, hand tools, and general gear share one catalog; simpler ops and job assignment |

---

## Resolved open questions

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| O2 | Tools on job lines or catalog only? | **Deprecated separate `tools` table** — use our inventory | Hand tools tracked like dollies in `inventory_items`; assign via `job_inventory_lines` with `item_type = org` |

---

## Open questions (update when decided)

| # | Question | Status |
|---|----------|--------|
| O1 | Assign managers to staff (reporting line)? | TBD — not MVP |
| O3 | Minimum crew count beyond 1+1 phases? | At least 1 LoadIn + 1 LoadOut assignment |

*Last updated: post-MVP cleanup (tools → our inventory).*
