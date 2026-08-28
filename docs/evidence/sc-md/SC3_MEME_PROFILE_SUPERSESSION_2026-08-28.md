# SC-3 Meme Profile Supersession

**Document ID:** `EVID-SC3-MEME-PROFILE-SUPERSESSION-2026-08-28`  
**Date:** `2026-08-28`  
**Status:** IMPLEMENTATION IN BRANCH  
**Branch:** `feat/crypto-meme-profile-sc3-supersession-2026-08-28`  
**Base:** `main@4d8f81e5bd3f0b3d41783462ee3e985ea74b1c25`  
**Work item:** Owner-directed supersession of the stale FT-0 Meme category profile to the existing SC-3 research state.

## Supersession

The legacy FT-0 entry `fintech-core.crypto/contracts/0.1.0#meme:PENDING_EVIDENCE` is superseded for effective category-profile resolution by:

- `fintech-core.crypto/meme-profile-supersession/0.1.0`;
- source model `crypto-meme-integrity/0.3.0`;
- source status `SOURCE_DEFINED`;
- lifecycle remains research/challenger;
- productive score authority remains `ScoringModelRegistry -> ScoringDispatcher` only.

The historical FT-0 contract is not rewritten or deleted. This preserves traceability while the effective resolver uses the superseding profile.

## SC-3 top-level profile

| Factor | Weight |
|---|---:|
| liquidity | 0.25 |
| marketStructure | 0.20 |
| sentiment | 0.18 |
| narrative | 0.15 |
| distribution | 0.12 |
| exchangeAccess | 0.10 |

The weights sum to `1.00` and mirror the already implemented SC-3 Meme research evaluator. They are research/configuration metadata and MUST NOT be interpreted as a new productive canonical scorer.

## Fail-closed gates

The effective profile exposes the SC-3 gates:

- `buySimulationSuccess`;
- `sellSimulationSuccess`;
- `liquidityLockWithinPolicy`;
- `transferTaxWithinPolicy`;
- `contractIntegrityVerified`;
- `manipulationEvidenceWithinPolicy`;
- `independentMarketConfirmations`.

The last gate represents the SC-3 rule requiring at least two independent market confirmations. Missing/stale/unverified evidence remains `NOT_COMPUTABLE`/`BLOCKED`; it is never substituted with PASS, zero or a neutral score.

## Architecture and governance

No second dispatcher, registry, route-local scorer, persistence authority, execution path or production policy is introduced. `scoreAuthority` remains `SCORING_DISPATCHER_ONLY`. The supersession only corrects the stale category-profile readiness projection so the FinTech Core resolver reflects the already implemented SC-3 research state.

No new dependency or external plugin is required. Existing repository contracts are the lower-risk and lower-lock-in solution.

## Security / integrity

The change introduces no secrets, IAM changes, external mutations or new API trust boundary. Fail-closed SC-3 evidence semantics remain intact. This aligns with the repository authority boundary and with lifecycle-oriented validation/governance practices; model promotion remains separately governed.

## Validation scope

A unit regression verifies that Meme resolves as `SOURCE_DEFINED` and `analysisReady=true`, while `scoreAuthority` remains `SCORING_DISPATCHER_ONLY`. Existing Unknown fail-closed behavior remains unchanged.

Cost-incurring GitHub CI is intentionally deferred until after PR creation according to repository policy.
