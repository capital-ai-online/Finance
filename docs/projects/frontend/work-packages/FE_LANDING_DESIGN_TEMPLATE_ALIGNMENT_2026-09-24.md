# FE-LANDING-TEMPLATE-01 — Landingpage Design Template Alignment

**Project:** `CAPITAL-AI-FE`  
**Owner relationship:** cross-cutting Frontend; no productive PVC  
**Baseline:** `main@36edca389a02ca297d00effdd43a3c35418fdaa8`  
**Priority:** P1  
**Status:** IN_PROGRESS  
**Dependency:** current productive Landingpage presentation + canonical Branding Kit  
**Open-writer correlation:** PR #1367 modifies Dashboard runtime/performance files only; no changed-file overlap with this package.

## Scope

1. Introduce one reusable public-page template derived from the current productive Landingpage.
2. Migrate `/roadmap` away from the historical `app-shell-frame` / `ui-panel` / shared-`Card` template.
3. Align the existing `docs/frontend/design-tokens.json` authority and `src/index.css` projection to the Landingpage's current visual language.
4. Keep financial/status semantics, auth, data, scoring and PVC ownership unchanged.
5. Preserve canonical BrandLogo/brandmark geometry and avoid any second branding authority.

## Exit evidence

- `LandingPageTemplate.tsx` is the Roadmap composition surface.
- Roadmap regression coverage proves the old dashboard-template imports/classes are absent.
- Branding tokens and CSS projection contain the current Landingpage canvas, typography, Gold/Magenta/Purple hierarchy and navy surfaces.
- Frontend architecture documentation identifies the updated canonical presentation values.
- Focused unit/build validation passes on exact head.
- Human/CODEOWNER merge remains the final merge authority.


## Current-main re-correlation

Synchronized to `main@36edca389a02ca297d00effdd43a3c35418fdaa8` after PR #1369. The intervening main delta was FINTECH-only and had no path overlap with this FE slice. Open FE PR #1371 also has no changed-file overlap with the claimed paths.
