# APP1 — Workspace usability

Status: implemented on `improve/workspace-usability`, based on `brand/handoff-identity` (PR #77). Separate draft PR; no release or merge performed.

## User story

A manager opens their own tenant dashboard to review the recent inbox and active jobs, then opens a job to see loading progress, assigned resources, and its run-sheet sections. The mobile navigation must work with keyboard input as well as touch.

## Changes

- Tenant-scoped neutral surfaces, solid buttons, readable table headers and status labels. Company names, logos, primary colors, and existing permissions remain in place. No Logiparty logo added to tenant workspaces.
- Dashboard overview uses the same existing queries: recent inbox items (the existing inbox query caps at 40), upcoming/ready jobs, and ready jobs. Inbox failures now show unavailable/error text instead of a false empty state.
- Job preparation displays fully loaded item lines and actual unit totals, fleet assignments, and crew slots by phase. Progress is calculated per item line, so extra units of one SKU cannot complete another SKU. No automatic-readiness rules or job statuses change.
- Named job panels and native section links. Mobile drawer gets initial focus, Tab/Shift-Tab containment, Escape, focus restoration, background inertness, and cleanup on desktop resize.
- Readable derived link color for pale company colors, plus a black label fallback for middle tones where neither white nor soft ink clears 4.5:1 contrast.
- Guided demo shares the overview components and workspace presentation. Its popups now measure their height to keep their controls inside the viewport; desktop QA caught a clipped Next button at step 11.

## Verification

- TypeScript, ESLint, and 11 unit tests pass (six existing, five new loading/color scenarios).
- Local browser: actual DashboardShell, JobPanel, overview/progress, buttons, and tables rendered with sample data in a temporary fixture. Tested desktop and 390×844 mobile; fixture removed before staging.
- Mobile drawer: initial close-button focus; backward/forward Tab wrapping; Escape closes and restores Open menu focus; body scroll lock and inert background; expanding Inventory; resize to desktop removes drawer and restores scrolling.
- Job anchor links reach their sections below the sticky header; partial inventory renders 4/5 lines and 23/27 units. Pale yellow brand retains its fill with dark labels. Mobile document width stays 390px.
- Guided tour: all 12 steps on mobile; desktop walkthrough and portal presentation; Finish reaches the completion dialog. Step 11 popup bottom is 708px in a 720px viewport. No browser console errors observed.
- No database, migrations, operational writes, email sends, or authentication changes. Authenticated saves and role-specific live data still need a safe test account/environment. Local component/demo QA is not an end-to-end backend test.

## Review order

This branch includes PR #76 and #77 through its parent. Review the APP1 diff against `brand/handoff-identity`; merge/rebase the earlier public/brand PRs first. Security PR #75 is independent and is not included here.
