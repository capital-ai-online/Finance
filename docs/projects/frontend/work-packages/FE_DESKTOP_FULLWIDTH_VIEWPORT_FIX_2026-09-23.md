# FE Desktop Full-Width Viewport Fix — 2026-09-23

**Canonical identity:** `FE-DESKTOP-FULLWIDTH-2026-09-23`  
**Project:** `CAPITAL-AI-FE`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Fresh baseline:** `main@dfe13a4209701227e43f93a655ad276c28766b73`  
**Branch:** `frontend/desktop-fullwidth-viewport-fix-20260923-r2`  
**Status:** IMPLEMENTED ON BRANCH / EXACT-HEAD VALIDATION PENDING

## Owner evidence

The owner-provided screenshot shows the public landing rendered as a narrow simulated iPhone inside a much wider browser desktop-site viewport. The visible symptom is excessive empty page area to the left and right while the application remains constrained to the phone canvas.

## Root cause

Two independent width gates combined:

1. the automatic canonical desktop adapter starts at `>=1024px`;
2. Chromium/Android desktop-site rendering can expose an intermediate CSS viewport below 1024px;
3. when `fullscreen` was selected manually in that gap, `ReferenceApp` still applied `max-w-md`, so the so-called full-width mode remained phone-width.

## Bounded fix

- preserve the canonical `>=1024px` website adapter and its existing source-sync contract;
- add a bounded `960..1023px` desktop-site compatibility bridge;
- resolve those wide compact viewports to `fullscreen` without User-Agent/device sniffing;
- remove the `max-w-md` ceiling from explicit `fullscreen` mode at every viewport;
- stretch the root canvas/sections to the available width in the bridge;
- adapt the sentiment two-column area and market card rail in the bridge;
- keep normal mobile widths unchanged;
- do not mutate FINTECH scoring/data semantics, authentication, compliance, cookie consent, or productive provider state.

## Open-writer correlation

After PR #1300 merged, the slice was recreated from fresh `CURRENT_MAIN` so the cookie-consent changes are inherited. The remaining open PRs were rechecked and none modifies the runtime files in this fix. The existing desktop responsive adapter test remains untouched; this slice adds a separate regression test.

## Exit evidence

- explicit `fullscreen` contains no `max-w-md` constraint;
- 960..1023px viewport resolves to fullscreen and suppresses the preview chrome;
- canonical >=1024px desktop adapter remains present;
- no User-Agent detection is introduced;
- focused regression test, TypeScript/build and repository Required Checks pass on the exact PR head;
- fresh pre-merge correlation reports `behind_by=0` or synchronizes before Human/CODEOWNER merge.
