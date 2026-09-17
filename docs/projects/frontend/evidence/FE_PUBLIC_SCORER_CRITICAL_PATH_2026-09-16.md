# FE Public Scorer Critical Path — 2026-09-16

**Project:** `CAPITAL-AI-FE`  
**Project folder:** `docs/projects/frontend/`  
**Primary Owner:** `CAPITAL-AI-FE`  
**Productive PVC:** `N/A — cross-cutting Frontend presentation / perceived performance`  
**Work item:** `FE Public Scorer Critical Path`  
**Baseline:** `main@28579c54f2bf70fd79330c96bad4551dd29b64b8`  
**Production at start:** Render `Finance` live on the same commit `28579c54f2bf70fd79330c96bad4551dd29b64b8`  
**Status:** `IMPLEMENTED_ON_BRANCH / HOSTED_VALIDATION_PENDING`

## Objective

Continue the automated perceived-performance remediation after merged and deployed PR #1023 without reintroducing click gates, viewport activation, sleeps or arbitrary delay timers. The public Enterprise Scorer remains directly visible on the unauthenticated landing page, while its heavy implementation is removed from the landing first-paint module graph.

## Current-main finding

`PublicCryptoScoringPreview.tsx` statically imported `CryptoScoringEnterprise.tsx`. The canonical scorer itself statically imports Motion, Recharts, `EnterpriseAnalysisPanels`, `EnterpriseBinanceQuickAnalysis` and the surrounding scorer UI graph. Because `PublicAnalysisWorkbench` defaults to the Enterprise Scorer, entering the public workbench can make this complete graph part of the first scorer render path even before the browser has painted the lightweight public scorer frame.

The scorer additionally starts the canonical `/api/crypto/score` request from its own mount/symbol effect. That request behavior and every FINTECH scoring/data contract remain outside this bounded bundle-split change.

## Implemented remediation

`src/features/crypto/ui/PublicCryptoScoringPreview.tsx` now:

1. imports `CryptoScoringEnterpriseProps` as a type-only dependency;
2. resolves the canonical scorer implementation with top-level `React.lazy(() => import(...))`;
3. renders an immediate lightweight first-paint shell with the selected public symbol;
4. schedules scorer activation through `requestAnimationFrame` and a React `startTransition`, so the browser receives one paint opportunity before parsing/rendering the heavy scorer graph;
5. uses `Suspense` for the same lightweight shell while the dynamic chunk resolves;
6. preserves `EnterpriseScorerPresentationProvider mode="public-preview"` and the exact canonical `CryptoScoringEnterprise` implementation;
7. introduces no `setTimeout`, sleep, `IntersectionObserver`, user click gate, alternate score calculation or synthetic result.

## Best-practice correlation

The implementation follows the existing React-supported client code-splitting primitives `React.lazy`, `Suspense` and `startTransition`. No new dependency is required; the repository's existing React/Vite stack is reused.

## Authority / security boundary

This slice changes only public Frontend composition and loading behavior. It does **not** change:

- `/api/crypto/score` route or scoring dispatch;
- FINTECH model, ranking, eligibility, data-quality or scoring authority;
- Supabase AuthN/AuthZ, onboarding or MFA;
- entitlements or subscription authority;
- Render, Supabase, Stripe, credentials, secrets or provider configuration.

The fallback shell carries no score, recommendation, ranking or synthetic financial value.

## Validation truth

Pre-PR TypeScript, Vitest and production build are **NOT RUN** on the connector surface. Cost-bearing repository validation remains intentionally post-Draft-PR under the current lifecycle.

Focused regression coverage in `tests/unit/publicScorerCriticalPath.test.ts` guards:

- type-only static scorer dependency;
- dynamic canonical scorer import;
- automatic first-paint progression without timer/click/IntersectionObserver;
- retained public-preview presentation provider;
- retained Suspense shell and canonical scorer component.

Existing `publicLandingRoute.test.ts` continues to protect the direct-visible public workbench contract. This work does not restore a retired activation state.

## Historical activation boundary

This evidence is not an active task source. `historical/non-terminal != active`. The branch/status recorded here cannot create, preserve, restore or continue work by itself. Any future execution requires a currently active canonical identity from `CURRENT_MAIN` or fresh Human/Owner direction in the current interaction.

## Exit gate

This bounded slice is ready for Human review only when the exact PR head proves:

- current `main` is the branch merge-base and open-writer correlation is clean;
- the public scorer wrapper no longer statically imports the heavy scorer implementation at runtime;
- direct landing/workbench visibility remains intact;
- focused and existing Frontend regression tests pass;
- TypeScript and production build pass;
- Governance/Security hosted checks pass;
- no server/scoring/provider authority changed.

## Historical successor finding

A separate FE-consumer risk was identified in the original evidence: `CryptoScoringEnterprise.loadEvaluation()` can perform scorer/verified-score fetches without per-request cancellation or stale-response suppression. That observation is evidence only. It MUST NOT become a successor task from this document or from the former branch state. A future remediation requires a fresh current-main canonical work-item identity or fresh Human/Owner direction.
