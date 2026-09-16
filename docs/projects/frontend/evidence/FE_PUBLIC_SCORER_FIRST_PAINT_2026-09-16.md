# FE Public Enterprise Scorer — First-Paint Recovery Evidence

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Owner:** `CAPITAL-AI-FE`  
**Final current-main baseline:** `main@7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Branch:** `agent/frontend-public-scorer-first-20260916`

## Objective

Keep the unauthenticated Enterprise Scorer and assessment-tool cockpit immediately recognizable on `/` while moving only the heavy active analysis runtime out of the first browser paint.

## Current-main findings

- `/` already renders the public LandingPage with `PublicAnalysisWorkbench` for unauthenticated users.
- `PublicAnalysisWorkbench` already defaults to `enterprise-scorer` and fixes the public symbol to `BTC`.
- The compact sideboard already starts collapsed on desktop (`88px`) and expands to `300px`.
- The active `PublicCryptoScoringPreview` ultimately mounts the canonical `CryptoScoringEnterprise`; no second scorer is required or permitted.
- The landing page placed a large product/capability surface before the analysis workbench, reducing first-screen recognizability on mobile.
- Human merge of PR #1019 advanced `main` during execution. The package was rematerialized from the resulting current main; #1019 Newsfeed transport is included in the branch baseline and is not modified by this package.

## Implemented boundary

1. The public analysis workbench is now the first main-content section below the sticky header.
2. Its shell, active-tool identity, BTC fixation and sideboard render immediately.
3. The heavy selected tool runtime is not mounted during the first render.
4. `requestAnimationFrame` followed by a zero-delay task activates the selected runtime directly after the first paint.
5. Any tool interaction activates runtime immediately rather than waiting for the scheduled activation.
6. Existing lazy imports remain canonical; no legacy scorer, parallel dispatcher, synthetic score or anonymous Supabase session is introduced.
7. Login-required and disabled tool boundaries remain unchanged.

## Provider / runtime evidence

### Render readback

At the time of the performance readback, production service `Finance` (`srv-d91o1o9o3t8c73edi55g`) was live on commit `1780264d567f307c31fab149433969a8c359bcd1`, not this branch/current-main state. In the read window 2026-09-16T16:10Z..17:10Z:

- instance count remained `1`;
- CPU usage remained very low (roughly 0.0015..0.0032 CPU in returned samples);
- memory was roughly 63..78 MB;
- HTTP latency series returned no data for the generic query.

This does **not** prove browser performance improvement and does not identify server saturation as a demonstrated cause.

### PostHog readback

The connected PostHog project returned `0` `$pageview` and `0` `$web_vitals` events for the last 30 days. Therefore PostHog currently provides **no field-performance baseline** for LCP/FCP/INP/CLS and is not used as proof that this branch improves real-user performance.

## Supabase / URL configuration

No Supabase/Auth mutation is part of this package. The public landing remains `/` on `https://capital-ai.online/`; the existing Supabase project remains `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`, `eu-west-1`). A separate exact redirect allow-list hardening may add `https://capital-ai.online/` because the Google OAuth client code emits `${window.location.origin}/`; that provider mutation is not required by this rendering change and is not performed here.

## Validation semantics

A focused source-contract test is added at `tests/unit/publicLandingFirstPaint.test.ts`.

Pre-PR executable Vitest / TypeScript / production build: `NOT RUN` in this connector execution. This is not a PASS claim; hosted exact-head validation remains post-PR according to repository cost controls.

## Exit-gate state

Repository implementation: `MATERIALIZED_ON_CURRENT_MAIN_BASED_BRANCH`  
First-screen browser/mobile verification: `NOT RUN`  
Production verification: `NOT RUN`  
DATA/FINTECH/IAM/Entitlement authority change: `NONE`
