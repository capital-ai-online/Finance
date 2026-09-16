# FE News UI Strangler — Newsticker

**Date:** 2026-09-16  
**Project:** CAPITAL-AI-FE  
**Project folder:** `docs/projects/frontend/`  
**Primary Owner:** CAPITAL-AI-FE  
**Productive PVC ownership:** none; presentation consumer only  
**Initial baseline:** `main@360347948cd4a05e00432ccdd06e1c60442916e7`  
**Final resync baseline:** `main@54ebcc122400f17cd2c33ab47edd703df9055179`

## Objective

Migrate the already-remediated `Newsticker` presentation implementation out of the legacy `src/components/` compatibility zone into the canonical `src/features/news/ui/` vertical slice without changing its authenticated news transport, canonical score contract, verified quote/context contracts, DATA/FINTECH authority or user-visible semantics.

## Before

- Productive implementation: `src/components/Newsticker.tsx`.
- `src/features/news/ui/index.ts` re-exported the legacy implementation back into the feature namespace.
- The legacy file therefore still owned hooks, API calls, auth transport, evidence projection and rendering logic.
- Regression tests inspected the legacy path directly and thereby reinforced the temporary location.

## After

- Canonical implementation: `src/features/news/ui/Newsticker.tsx`.
- Canonical namespace: `src/features/news/ui/index.ts -> ./Newsticker`.
- Legacy bridge: `src/components/Newsticker.tsx` contains only deprecated value/type re-exports.
- Regression gates inspect the canonical implementation and explicitly assert that the compatibility bridge contains no hooks, API paths, auth transport, provider, DATA or scoring logic.

## Preserved contracts

The migration intentionally preserves the already-merged contract corrections from the prior Frontend/Orchestrator work:

- Crypto canonical scoring uses authenticated `POST /api/crypto/score` with `{ symbol, asset_name }`.
- Crypto provenance is projected from `CanonicalScoreResult.integrity.providers` and `.integrity.evidence`.
- Traditional asset score context uses authenticated `/api/registry/assets/:symbol/verified-context`.
- Verified quote paths remain evidence-backed and missing values remain missing.
- Product news uses `fetchAuthenticatedNews()` for `/api/news` and therefore preserves the existing Supabase bearer-session transport and server entitlement boundary.
- No synthetic headlines, quotes, scores, volume or momentum values are introduced.
- No IAM, entitlement, DATA, FINTECH, provider or server contract is changed.

## Architecture result

This slice implements the `FRONTEND_ARCH.md` strangler direction:

```text
application consumers
  -> src/features/news/ui/index.ts
  -> src/features/news/ui/Newsticker.tsx
  -> existing authenticated/API contracts

legacy compatibility only
  src/components/Newsticker.tsx
  -> re-export canonical feature implementation
```

No second Newsfeed implementation or parallel Frontend root is introduced.

## Final current-main / writer correlation

The implementation began on `main@360347948cd4a05e00432ccdd06e1c60442916e7`. Before Human/CODEOWNER handoff, PR #1027 was Human-merged and advanced current main to `54ebcc122400f17cd2c33ab47edd703df9055179`.

The #1027 main delta changes only:

- `tests/unit/publicLandingCockpitRecovery.test.ts`
- `docs/projects/frontend/evidence/FE_PUBLIC_COCKPIT_CI_REGRESSION_2026-09-16.md`

It has no changed-file overlap with this News UI slice. The branch was therefore rematerialized on the new current-main baseline instead of assuming the old merge base.

Relevant open FE writers at final resync:

- PR #1023 — Auth/session/bootstrap performance; no `Newsticker` or `src/features/news/ui/**` changed-file overlap.
- PR #1026 — public Enterprise Scorer first-paint; no News UI changed-file overlap.

Open GOV PR #1022 proposes a future Trust Root change but remains unmerged and therefore non-authorizing on this baseline. If it or another authority-bearing change merges before the Human merge decision, authority and main correlation must be repeated.

## Validation state

The original exact #1028 head passed hosted CI, Governance and Container Security after the canonical trusted-main production-baseline block was corrected. Those results bind the prior exact head only and are not reused as PASS after resync.

After this current-main rematerialization, hosted checks for the new exact PR head are **PENDING / NOT RUN until GitHub runs them**. `NOT RUN` is never reported as PASS.

Source-level regression coverage in the branch includes:

- `tests/unit/newsUiStrangler.test.ts`
- `tests/unit/frontendOrchestratorGraphicalWiring.test.ts`
- `tests/unit/audit4EnterpriseHardening.test.ts`
- `tests/unit/audit4PseudoMetricGate.test.ts`

## Exit gate

PASS when:

1. `Newsticker` has exactly one productive implementation under `src/features/news/ui/`;
2. the feature namespace exports that local implementation;
3. `src/components/Newsticker.tsx` is a logic-free compatibility bridge;
4. auth/news/score/evidence semantics are unchanged;
5. regression tests bind the canonical path and the bridge invariant;
6. final PR head contains then-current main and open writers show no unresolved changed-file, semantic, authority or ownership conflict;
7. hosted checks for the final exact head pass before Human/CODEOWNER merge.

## Next bounded migration

The remaining entries in `src/features/news/ui/index.ts` (`RealtimeAiNewsfeed`, `MarketSentiment`, `SentimentDashboard`) remain explicit legacy compatibility exports. They are not silently migrated in this slice; each must be re-correlated and moved only when its own contracts and tests are resolved.
