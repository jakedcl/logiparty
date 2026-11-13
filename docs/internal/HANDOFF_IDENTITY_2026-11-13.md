# BRAND1 — Handoff identity

User-selected direction A, implemented on `brand/handoff-identity` on top of public-site PR #76 (`improve/public-site-clarity`). The branding PR targets that branch so its diff contains only the identity work; merge/rebase #76 first.

## Result

- Exact approved LP geometry and outlined lowercase wordmark, shared by React and generated assets.
- Cobalt/coral mark, ink lettering, warm-white public canvas.
- Header/footer, apex workspace picker, marketing/demo header identity, favicon, browser icon, Apple icon, install icons, manifest theme, static/dynamic social images.
- Reversed and monochrome SVG exports plus a reproducible asset generator using existing dependencies.
- No fonts embedded in the wordmark, no new packages, no authentication, schema, or tenant-branding changes.

## Verification

- Desktop and 390 × 844 mobile homepage inspected in the local browser; no clipping in the demo header or workspace picker.
- Local dynamic Open Graph, browser icon, and Apple icon routes return PNG with HTTP 200; social image and Apple icon visually inspected.
- SVG link artwork is decorative inside a labeled home link, avoiding repeated screen-reader names.
- Primary white/cobalt contrast is 6.99:1; ink/paper 14.54:1. Coral is a graphic accent.
- Asset regeneration completes without font downloads or extra packages.
- Lint, TypeScript, existing unit tests, and Vercel build are recorded in the PR. Browser QA is local; authenticated operations are outside this branding change.

The live site is unchanged until the PRs are merged/released. Approved artwork is also provided as a downloadable brand kit outside the repository.
