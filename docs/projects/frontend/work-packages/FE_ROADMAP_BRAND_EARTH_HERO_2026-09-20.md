# CAPITAL-AI-FE — Roadmap Brand & Earth Hero

**Work Package:** `FE-ROADMAP-BRAND-EARTH-HERO-01`  
**Project:** `CAPITAL-AI-FE`  
**Canonical project folder:** `docs/projects/frontend/`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@da37d227cca5b3b19ae5dbfa477dd08fe583c540`  
**Status:** IN IMPLEMENTATION  
**Direction:** USER_VISIBLE_TOP_LAYER_FIRST

## Goal

Transfer the Owner-approved roadmap visual language into the application without creating a second branding authority. The existing canonical token registry remains `docs/frontend/design-tokens.json`; `src/index.css @theme` remains its web projection.

## Milestones

### FE-RB-01 — Canonical roadmap palette
- Capital Gold / Foundation: `#F5C453`
- Automation / verified convergence: `#44DE88`
- Self-healing runtime: `#22D3EE`
- Product & Market: `#8D26FF`
- Scaling: `#E879F9`
- Status: IMPLEMENTED_ON_BRANCH
- Exit: token registry and web projection agree; semantic PASS/FAIL roles are not replaced by decorative roadmap roles.

### FE-RB-02 — Application-wide roadmap typography
- Montserrat becomes the canonical application-wide sans/display family.
- JetBrains Mono remains technical/data typography.
- Remove Poppins from the web font request.
- Status: IMPLEMENTED_ON_BRANCH
- Exit: global theme owns typography; no component-local replacement authority.

### FE-RB-03 — Responsive canonical Earth Hero
- Replace the current synthetic globe presentation with one production-safe canonical Earth asset.
- Europe/Africa is the primary focal region.
- Derive desktop/tablet/mobile/social crops from the same source visual.
- Preserve dark readability gradient, Capital Gold network atmosphere and blue atmospheric rim.
- No fake market points, prices, scores or runtime state.
- Asset must be repository-local/trusted, license/provenance recorded, responsive dimensions explicit and CSP-safe.
- Status: ASSET_MATERIALIZATION_PENDING
- Exit: AVIF/WebP responsive derivatives plus fallback are present and the hero uses `picture/srcset` without layout shift.

### FE-RB-04 — Roadmap semantic presentation
- Apply the five roadmap colors to presentation icons, roadmap surfaces and non-status visual accents.
- Do not use decorative colors as sole state evidence.
- Status: NEXT

### FE-RB-05 — Exact-head validation
- Frontend architecture check
- TypeScript
- relevant unit/visual regression tests
- build
- accessibility/responsive validation
- Governance/Security required checks
- Status: PENDING

## Hero asset contract

Canonical logical asset: `capital-ai-earth-hero`.

Planned derivatives:
- `public/brand/hero/capital-ai-earth-hero-1920.avif`
- `public/brand/hero/capital-ai-earth-hero-1440.webp`
- `public/brand/hero/capital-ai-earth-hero-1024.webp`
- `public/brand/hero/capital-ai-earth-hero-768.webp`
- `public/brand/hero/capital-ai-earth-hero-390.webp`
- fallback JPG only if required by supported browser matrix.

The generated design reference from the Owner conversation is visual direction only until its production asset is explicitly materialized with provenance. No external hotlink is permitted.

## Invariants

1. No new Frontend architecture root.
2. No second design-token registry.
3. No fabricated financial/runtime data.
4. Frontend remains a presentation consumer; FINTECH/GOV/OPS authority is unchanged.
5. Roadmap colors supplement semantic state; they do not redefine PASS, FAIL, BLOCKED or financial score semantics.
6. Responsive Hero behavior must respect reduced motion and accessibility.
7. Every final PR head is re-correlated against CURRENT_MAIN before merge readiness.

## Current implementation evidence

- `docs/frontend/design-tokens.json`: roadmap palette + application-wide Montserrat projection.
- `src/index.css`: matching Tailwind theme tokens + Montserrat global sans.
- Earth asset integration intentionally remains pending until a repository-safe binary asset with provenance is available.
