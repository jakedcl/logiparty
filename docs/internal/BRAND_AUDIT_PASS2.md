# Brand audit — pass 2 (2026-11-10)

Checklist used for PR #73 deep pass. **Found → fixed** unless noted.

| Surface | Found | Fixed |
|--------|--------|--------|
| `/` hero | CSS mock + stale sticky note; old composite screenshot | Real `jobs-list.png` in window; copy names Northline sample |
| `/` product | Text-only capability inspector; duplicate screenshot grid | Seven feature rows with real PNGs per capability |
| `/` tour | `TourMock` CSS widgets | Segment screenshots (jobs, inventory, portal, my-jobs) |
| `/` how it works | Glossy iOS stepper only | Commercial flow (request→invoice) + flat warehouse stepper |
| `/` FAQ | Missing | `MarketingFaq` section |
| `/` nav | Pricing/demo shell had sparse nav | Shared `MarketingNavLinks` on all marketing pages |
| `/pricing` | Thin bullet list | Included/onboarding grid, billing honesty, FAQ link |
| `/demo` | Sep 2026 job dates; vague header | Nov 2026 dates; “Northline sample data” label |
| `/demo` steps | Finish card said “Stage→load→return” only | Adds request→invoice framing |
| `/login` | OK pass 1 | Unchanged; re-verified in screenshots |
| 404 | OK pass 1 | Captured in PR artifacts |
| Legal | OK chrome | Privacy captured in PR artifacts |
| `product-mocks.tsx` | Still used by `/demo` screens | Demo UI kept; marketing no longer uses mocks |
| `process-stepper` | Framer glossy 3D nodes | Flat tabs + checklist panel |
| `globals.css` stepper/demo | Gloss gradients, blue spotlight | Flat stepper styles; neutral spotlight |
| `public/marketing/*` | Old `app-screenshot.png`, stale reports/search | Regenerated from seeded Northline (playwright script) |
| Lead email | Plain HTML string | React Email template with brand accent |
| `event-email.tsx` | Old navy `#1e3a5f` button | `#0B5CAB` accent |
| Seed northline | No quote/invoice for marketing | `seedNorthlineCommercial` (NL-Q-2401 / NL-INV-2401) |
| Tenant noindex | Pass 1 | Re-verified |
| OG image | Generic card | Regenerated after copy pass (script) |

**Consciously left:** Demo `/demo` screens remain component-built (not PNG) so the tour stays interactive; help page stays org-branded with no Logiparty wordmark (per white-label rules).

**Regenerate screenshots:** `node scripts/capture-marketing-screenshots.mjs` (needs dev server + `DATABASE_URL` + `northline.localhost`).
