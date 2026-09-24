# FE-LANDING-TEMPLATE-01 — Landingpage Design Template Alignment

**Project:** `CAPITAL-AI-FE`  
**Owner relationship:** cross-cutting Frontend; no productive PVC  
**Baseline:** `main@cb0012e7f38452eb638ed2e3affe5e74f0b44ed6`  
**Priority:** P1  
**Status:** DONE_MAIN / TERMINAL  
**Dependency:** current productive Landingpage presentation + canonical Branding Kit  
**Open-writer correlation:** Fresh post-merge readback finds only open PR #1375 (CAPITAL-AI-DOC); no changed-file overlap with this FE package.

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

Synchronized to `main@b2eb210a7310da170db75f3065513522a224337e` after CURRENT_MAIN advanced through PR #1370. The intervening delta is OPS-scoped and has no path overlap with this FE slice.


## Latest current-main re-correlation

Synchronized to `main@b2eb210a7310da170db75f3065513522a224337e` after merged PR #1372. The intervening delta is Governance PR-evidence/template scoped and has no path overlap with this FE slice.


## Post-merge reconciliation

- PR #1374 merged into `main` as `cb0012e7f38452eb638ed2e3affe5e74f0b44ed6`.
- Exact-head Governance, CI/build, Container Security and Project Execution Directive checks completed successfully before merge.
- The implementation exit criteria are satisfied; this package is terminal and must not be selected as active work again.
- Coordination claim `CAPITAL-AI-FE-LANDING-DESIGN-ROADMAP-TEMPLATE-20260924` is released in the same reconciliation slice.
