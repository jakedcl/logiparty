# MKT1 — Public-site clarity and presentation

Independent of SEC1 / PR #75. Based on main; no security-action changes from that PR are included here.

## Result

- Outcome-focused homepage headline and a quieter public visual style.
- Three core product screenshots replace the longer repeating gallery/tour/warehouse sections.
- Clear hands-on onboarding steps, customer-facing pricing/FAQ, and a simple single-step access form.
- Form length limits match server validation; submission failures remain visible and pending fields are disabled. The existing lead server action is unchanged.
- Shared workspace picker uses customer language instead of a production localhost hint. Tenant routing and login logic are unchanged.
- Guided-tour dates come from fixed ISO dates in UTC; featured job list and detail share the same record.
- Enter activates links and buttons normally; arrow shortcuts avoid interactive controls; Escape exits; step headings receive focus.
- Public CSS changes exclude the guided app tour and tenant workspace styling. No new packages, migrations, price promises, or customer claims.

## Verification

- ESLint, TypeScript, and the six existing unit tests pass.
- Local browser QA: desktop homepage and 390 × 844 mobile homepage, access form, pricing, and workspace picker render.
- Full 12-step mobile tour reaches the finish screen.
- Enter on Exit returns home. Enter on Next/Back moves one step. ArrowRight on the focused heading advances; Escape returns home. Step focus moves to the new heading.
- Job detail shows Sat, Nov 14, 2026, matching the list; the old September detail date is absent.
- No browser console errors during the inspected public flow. Local server reports missing database/auth configuration; authenticated login and lead persistence/delivery were not exercised. No lead requests or real emails were submitted.
- Deployed build status is recorded in the pull request. This change does not alter the live site until merged/released.
