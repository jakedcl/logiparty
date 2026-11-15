# SEC1 — Tenant-action security pass

Status: implemented locally; not deployed or verified against production.

Branch: `fix/tenant-action-boundaries`. Base: `a6db8f3`.

## Problem and resulting behavior

Some exported server actions trusted organization IDs supplied by callers instead of checking them against the authenticated session. Other data-list functions relied on their page callers for authentication. The team query also selected the entire user record, including the password hash, before passing it to a client component.

This batch:

- Adds authentication/role checks to team, client-contact, and equipment catalog reads.
- Requires matching session organization for job-lead/crew pickers, assignable inventory/fleet, quote metadata/line deletion, and the missing invoice-action checks (including client PDF access).
- Selects only ID, names, and email for team users; password hashes are not selected.
- Scopes team capability-tag reads to the current organization.
- Checks membership ownership before modifying capability tags, and batches tag replacement so an insert failure cannot commit only the preceding deletion.
- Keeps existing role policy, including manager access and warehouse staff's equipment access. No schema changes or migrations.

## Local verification

`lib/actions/tenant-boundaries.test.ts` runs actual server-action bodies with isolated auth/database dependencies. It checks anonymous requests, wrong roles, cross-organization requests, allowed same-organization access, generated SQL projections/scoping, and owned/foreign membership tag changes. It does not boot Next.js, exercise cookies/HTTP transport, or prove deployed RLS configuration.

- ESLint and TypeScript passed after the application edits.
- 75 tests pass (69 new regression cases plus 6 existing password-reset helper tests).
- The new suite fails 26 cases against the original action source, confirming regression sensitivity.
- Run all unit tests with `node --import tsx --test lib/**/*.test.ts` when the `tsx` CLI's IPC socket is unavailable in a restricted environment. The existing `npm test` script remains unchanged.
- Production compilation and build-time TypeScript pass with `npm run build -- --webpack`. Static page generation fails with `TypeError: Cannot convert object to primitive value` in this environment. An unchanged checkout of base `a6db8f3` fails at the same stage with the same error. A complete production build is not verified.
- Database integration checks and authenticated browser verification are pending a safe test environment. Never seed or migrate production to run this verification.

## Preview acceptance checks

1. Manager can list team/clients, use job lead/crew/inventory/fleet pickers, and work with quotes/invoices in their own organization.
2. Warehouse staff can read their own equipment catalog; crew without the warehouse tag cannot gain catalog access by calling the action directly.
3. Client sees only its own invoices/PDFs and cannot use manager functions.
4. Calling every changed organization-parameter action with another organization's ID fails before data access.
5. Passing a foreign membership ID to tag updates fails without changing tags; valid replacement and clearing still work.
6. Team page response and React payload contain no password hashes or password-hash property.

## Remaining review findings

This is the first batch, not a claim that all security/correctness work is complete. Still open: session permission freshness/revocation, related-record ownership audit, atomic inventory/fleet reservation and draft activation, payment-status correctness and webhook idempotency, invoice lifecycle guarantees, durable throttling/email, and public UX/branding changes. Keep these separate from SEC1 to make review and rollback clear.
