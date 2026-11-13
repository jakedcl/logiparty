# BRAND.md — Logiparty

Internal reference for marketing, metadata, and apex-only surfaces. **Tenant workspaces stay white-label** — org logo and `--primary` override everything below inside `dashboard` and `portal`.

## Positioning

**Who it’s for:** Small and mid-size third-party logistics (3PL) companies that run **warehouse + fleet + crew** for **live events** — festivals, tours, venue deliveries, corporate activations. Teams that outgrow spreadsheets but don’t need a generic WMS.

**Core idea:** The **job** is the unit of work. Load-in / load-out windows, run sheets, crew assignments, vehicles, and **client-owned inventory** roll up on one job. While a job is upcoming or ready, **inventory and fleet lock** to that job until load-out ends.

**Distribution:** Multi-tenant SaaS. Each 3PL gets `your-org.logiparty.com` plus a **white-label client portal** (their logo, their color). Staff and clients never see Logiparty in daily ops except optional tiny copy on a help path.

**Go-to-market:** Invite-only / request access — no self-serve signup. Early access with hands-on onboarding (catalogs, roles, branding).

## Voice and tone

- **Direct, operational, specific.** Name real objects: jobs, run sheets, load-out, client portal, Cmd-K search, quotes/invoices.
- **Confident, not hype.** No “revolutionary,” no fake social proof, no invented customer counts.
- **Respect the operator.** Assume they know the warehouse-to-venue loop; explain what the product does, not what logistics is.
- **Short sentences.** Prefer one strong verb over three adjectives.

## Tagline and value props

**Tagline (one line):** Operations software for event-logistics 3PLs.

**Value props (short):**

1. **Jobs with real windows** — Draft → upcoming → ready → completed; run sheet with locations, loads, trucks, and crew.
2. **Inventory that locks** — Client assets stay reserved on live jobs; loaded quantities on the run sheet, not a side spreadsheet.
3. **White-label portal** — Clients request work and see their inventory on your subdomain, with your brand.
4. **Fleet and crew on the same job** — Vehicles and people assigned where the schedule actually moves.
5. **Quotes, invoices, reports** — Commercial docs and exports without bolting on a second tool.
6. **Cmd-K search** — Jump to jobs, clients, and gear from anywhere in the staff app.

## Approved identity — Handoff (2026-11-13)

Jake selected direction A: the two-color LP mark, lowercase outlined wordmark, cobalt and coral, ink and warm-white surfaces.

- **Mark:** Custom L and P paths, without an app-tile container. Use the two-color version on light surfaces; white L + coral P on dark surfaces; ink-only for monochrome reproduction.
- **Wordmark:** The approved lowercase lettering is outlined vector artwork. Do not replace it with browser-rendered text or require an installed font.
- **Shared source:** `lib/brand/identity.ts` defines colors and paths. `components/brand/logiparty-artwork.tsx` renders the same shapes for the header, footer, apex workspace picker, generated icons, and social images. Tenant workspace logos remain their organization's own.
- **Exports:** `public/brand/logiparty-mark.svg`, `logiparty-wordmark.svg`, `logiparty-wordmark-reversed.svg`, `logiparty-mark-mono.svg`; PNG install icons and `public/favicon.svg`.
- **Regenerate:** `node --import tsx scripts/generate-brand-assets.ts` regenerates static SVG/PNG exports and `public/og.png` from the shared artwork. No extra dependencies or font downloads are required.

## Color palette

| Role | Hex | Use |
|------|-----|-----|
| Cobalt | `#343BEE` | Primary mark, public actions and links; white text contrast 6.99:1 |
| Coral | `#F16A4B` | P in the mark and graphic accents |
| Ink | `#172131` | Wordmark and primary type; 14.54:1 against paper |
| Paper | `#F3F3EF` | Warm public canvas and install-icon background |

Public styling is scoped to marketing surfaces. Tenant `--primary` colors and daily operations styling are not replaced by the public brand palette.

## Typography

**Family:** [IBM Plex Sans](https://fonts.google.com/specimen/IBM+Sans) via `next/font/google` — 400 and 600 cuts (600 for semibold UI; do not fake 500/700).

**Scale (marketing):**

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| Display | 2.5rem / 2rem mobile | 600 | Hero H1 |
| Title | 1.5–1.875rem | 600 | Section H2 |
| Body | 1rem | 400 | Paragraphs |
| Small | 0.875rem | 400 | Captions, footer |
| Label | 0.75rem | 600 | Uppercase kicker (sparingly) |

**App:** Same family via root layout; dashboard uses existing `.lp-*` type rules.

## Spacing and radius

- **Base grid:** 4px; common gaps: 8, 12, 16, 24, 32.
- **Marketing max width:** `max-w-5xl` (1024px) for homepage; `max-w-3xl` for legal/pricing.
- **Radius:** `0.375rem` (sm), `0.5rem` (md), `0.625rem` (lg) — align with `--lp-radius-*`.
- **Panel padding:** `p-5 sm:p-6` or `sm:p-7` on hero.

## Imagery

- **Product UI only** on marketing — screenshots or in-code mocks that match the real app (`components/marketing/product-mocks`, `public/marketing/*.png`). Source refreshes from `docs/internal/screenshots/` when UI changes.
- **No stock people, no abstract 3D illustrations, no fake dashboards.**
- **Alt text** describes what’s on screen (e.g. “Jobs list with status filters and load-out dates”).
- **Tenant logos** in demos use seed assets only — never imply real customers.

## What we will NOT do

- No decorative background blobs, gradient orbs, or full-page glassmorphism.
- No emoji feature grids, rainbow gradients, or “trusted by” logo bars.
- No invented testimonials, star ratings, user counts, or customer names.
- No Logiparty wordmark in staff dashboard, portal, or tenant 404 (per `docs/internal/APP_CONTEXT.md`).
- No new npm dependencies for branding alone.
- No changes to auth, schema, migrations, Stripe, or tenant routing for brand work.

## SEO and metadata (apex only)

- **Canonical origin:** `https://logiparty.com` (`getMarketingOrigin()`).
- **Index:** `/`, `/demo`, `/pricing`, `/privacy`, `/terms`, apex `/login`.
- **Noindex:** All tenant subdomains (`app/(tenant)/layout.tsx` when org slug present).
- **OG/Twitter:** 1200×630, mark + tagline + product frame; `app/(marketing)/opengraph-image.tsx`.
- **Sitemap / robots:** `app/sitemap.ts`, `app/robots.ts` — must stay on allowlist in `proxy.ts` (no auth redirect).

## Contact / access

- Primary CTA: **Request access** (`#request` + `LeadForm` → existing marketing lead action).
- Secondary: `hello@logiparty.com`, **Sign in** (`/login` slug picker), **Demo** (`/demo`).


## Public-site clarity pass (2026-11-13)

The public homepage leads with “Keep every event job moving.” and describes the connected warehouse-to-venue workflow. The public site uses flat blue actions, light neutral surfaces, and restrained borders, scoped in CSS to `.marketing:not(.demo-app)`. The guided app tour and tenant workspaces retain product styling. The homepage uses three core views (job detail, inventory, client portal), with a supported onboarding section. Keep pricing and access-request copy customer-facing; do not expose billing implementation details or disabled checkout steps. Sample dates in the guided tour derive from fixed ISO dates in `lib/demo/scenario.ts`.
