# CV-3 / CV-7 ↔ SC-3 Meme Profile Correlation

**Date:** 2026-08-28  
**Branch:** `feat/crypto-cv3-cv7-meme-sc3-integration-2026-08-28`  
**Base:** `main@c4134a0f3a14b850a9e084b86ca96dd90c0b51b1`  
**Scope:** Integrate the CV-3/CV-7 website projection with the effective SC-3 Meme category-profile supersession.

## Source work packages

- CV-3 Factor & Model Explorer / CV-7 Meme & DeFi Research Lenses from `feat/crypto-cv3-cv7-website-2026-08-28`.
- SC-3 Meme profile supersession from `feat/crypto-meme-profile-sc3-supersession-2026-08-28`.
- Canonical SC-3 research model: `crypto-meme-integrity/0.3.0`.

## Correlation finding

The original CV-3 view model read category-profile data directly from `CRYPTO_CATEGORY_ANALYSIS_PROFILES`. That historical FT-0 registry intentionally still contains `meme.sourceStatus=PENDING_EVIDENCE` for traceability.

After the SC-3 supersession, that direct projection became semantically stale: the backend resolver already treats the effective Meme category profile as `SOURCE_DEFINED`, while the website would still render `PENDING_EVIDENCE` and no top-level weights.

The integration therefore changes the website view model to resolve the effective profile through `resolveEffectiveCryptoCategoryAnalysisProfile(...)` while retaining `resolveCryptoAnalysisProfile(...)` as the canonical category-to-profile binding authority.

## Effective Meme profile projected by CV-3

Top-level SC-3 research/configuration weights:

- liquidity: 0.25
- marketStructure: 0.20
- sentiment: 0.18
- narrative: 0.15
- distribution: 0.12
- exchangeAccess: 0.10

Hard-gate identities:

- buySimulationSuccess
- sellSimulationSuccess
- liquidityLockWithinPolicy
- transferTaxWithinPolicy
- contractIntegrityVerified
- manipulationEvidenceWithinPolicy
- independentMarketConfirmations

CV-7 continues to expose the detailed `crypto-meme-integrity@0.3.0` feature groups, evidence sources, hard gates and anti-correlation rules.

## Authority and security boundary

- `ScoringModelRegistry -> ScoringDispatcher` remains the only productive score authority.
- The Meme model remains `lifecycle=challenger`, `scoreEligible=false` and research-only.
- No browser-side productive scoring, execution eligibility, persistence authority, provider mutation or new API is introduced.
- Missing or unverified hard-gate evidence remains fail-closed; the UI does not manufacture PASS/default values.
- Historical FT-0 contracts are not rewritten; supersession is explicit and traceable.

## Main synchronization correlation

The integration branch was created directly from `main@c4134a0f3a14b850a9e084b86ca96dd90c0b51b1` after reviewing the 18 commits merged since the two source branches were created. Those main changes affect CI/governance, authentication/passkeys, CORS, news and security surfaces; none modify the integrated Crypto profile, resolver, CV-3/CV-7 view-model or UI files.

## Validation

Regression coverage verifies:

1. DeFi remains unchanged and research-only.
2. Meme now projects `SOURCE_DEFINED`, the six SC-3 top-level weights and effective hard gates.
3. Meme CV-7 still exposes `crypto-meme-integrity@0.3.0` as `scoreEligible=false`.
4. Unknown assets remain fail-closed with no invented weights.
5. The FinTech Core resolver resolves Meme through the supersession while preserving `SCORING_DISPATCHER_ONLY`.

No costly GitHub CI was intentionally triggered before pull-request creation.
