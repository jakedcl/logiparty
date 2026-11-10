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

## Logo

**Wordmark:** “Logiparty” in the brand sans, weight 700, tight tracking (-0.02em). Used on apex marketing, `/login` slug picker, and help-style surfaces only.

**Compact mark:** Rounded square (4px radius at 24px) in **accent blue**, white **abstract “L”** built from two bars (vertical stem + horizontal base) — reads as dock / runway, works at **16px**. Pair with wordmark in headers; mark alone for favicons and app icons.

**Files:** `public/brand/logiparty-mark.svg`, `public/brand/logiparty-wordmark.svg`; React: `components/brand/logiparty-logo.tsx`.

**Themes:** `light` = accent mark on light backgrounds; `dark` = white wordmark on accent header (deprecated — header is light); `on-accent` = white mark + wordmark on `--lp-accent` fills only.

## Color palette

| Role | Hex | Usage | Contrast notes |
|------|-----|--------|----------------|
| **Accent (primary)** | `#0B5CAB` | CTAs, links on light panels, mark fill | 4.6:1 on white (AA) |
| **Accent hover** | `#084A8A` | Hover on accent text/buttons | 7:1 on white |
| **Foreground** | `#1A1A1A` | Headings, body on light | 12.6:1 on white |
| **Muted** | `#3F4650` | Secondary text on white | 7.5:1 on white |
| **Subtle** | `#556274` | Tertiary / captions | 4.6:1 on white (AA) |
| **Border** | `#AEB6BF` | Panels, dividers | 3:1 against white (UI non-text) |
| **Canvas** | `#F4F5F7` | Marketing page background | — |
| **Surface** | `#FFFFFF` | Cards, panels | — |
| **Danger** | `#B91C1C` | Errors | 4.5:1 on white |

Tenant `--primary` replaces accent inside `.lp-app` only; marketing tokens stay Logiparty blue.

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
