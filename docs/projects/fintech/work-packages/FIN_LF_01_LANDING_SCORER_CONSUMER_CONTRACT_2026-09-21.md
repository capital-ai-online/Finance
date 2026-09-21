# FIN-LF-01 — Landing Scorer Consumer Contract

**Project:** `CAPITAL-AI-FINTECH`  
**Canonical project folder:** `docs/projects/fintech/`  
**Canonical identity:** `FIN-LF-01`  
**Primary owner:** `CAPITAL-AI-FINTECH`  
**PVC relationship:** `PVC-09..PVC-17` (productive FINTECH chain; Frontend remains presentation-only)  
**Correlation baseline:** `main@bf1e8c654332cbc1a01f20a3e9cb5fc6d330ca7f`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`  
**Status:** `HELD / PREPARATION_ONLY / LF-01_DEPENDENCY`

## Purpose

Prepare the smallest FINTECH-owned consumer contract required for the future landing Enterprise Scorer without activating a productive landing integration before the shared graphical baseline is complete.

This package does not authorize Frontend mutation, billing/entitlement policy, IAM changes, provider activation, scoring execution from the landing page, or any second scoring/data authority.

## Shared dependency

Productive landing scoring is blocked on:

- `LF-01_STATIC_VISUAL_LANDING_PASS`;
- then `LF-02_AUTH_PROFILE_PASS`;
- then `LF-03_PRICING_ENTITLEMENTS_PASS`;
- `SEC_REVIEW_READY`;
- `QM_VALIDATION_READY`.

At correlation time, FE PR #1195 is open and its exact head is not LF-01 PASS because `build-and-test` fails. OPS PR #1200 is a foreign-owner routing/lifecycle correlation writer and does not transfer Frontend or FINTECH authority.

## Existing authority to reuse

The future landing scorer must consume the existing FINTECH scoring chain:

`provider/data ingress -> evidence/provenance/freshness -> Data Quality -> Feature Contract -> ScoringModelRegistry -> ScoringDispatcher -> Domain Executor -> CanonicalScoreResult`.

Current-main evidence identifies `POST /api/crypto/score` as the existing verified Crypto scoring boundary. Any exact route used at LF-04 activation must be freshly re-correlated; this document does not create a new endpoint.

`/api/landing/quick-analysis` is a separate public AI quick-analysis surface and must not be treated as canonical score authority.

## Minimal future consumer contract

When LF-04 becomes dependency-ready, the landing consumer may request only a bounded canonical score and must preserve:

- BTC as the only asset available to a free/no-paid landing consumer;
- server-authoritative entitlement/access decisions;
- FINTECH `ScoringDispatcher` as the only productive scoring execution authority;
- `CanonicalScoreResult` score/status semantics;
- Data Quality/integrity projection;
- evidence/provenance identifiers where present in the canonical result;
- explicit unavailable/not-computable/error states;
- no synthetic score fallback;
- no browser-local scoring, ranking, eligibility, entitlement or provider authority.

Paid multi-asset selection is a later consumer capability and must use existing registry/dispatcher/domain contracts rather than a landing-specific scoring path.

## Pre-gate scope allowed now

Before `LF-01_STATIC_VISUAL_LANDING_PASS`, FINTECH may:

1. preserve this contract and its dependencies;
2. verify that current canonical scoring/evidence/DQ contracts remain sufficient;
3. record an owner-correct handover if a required Frontend, OPS, SEC, COMP or QM change is discovered.

FINTECH must not activate a landing scoring request, add provider initialization to root render, or modify the Frontend presentation surface under this package.

## Dependencies and handovers

- **CAPITAL-AI-FE:** produce and evidence `LF-01_STATIC_VISUAL_LANDING_PASS`; later consume the FINTECH contract without creating domain authority.
- **CAPITAL-AI-OPS:** provide runtime/deployment/traceability evidence where required; no scoring authority transfer.
- **CAPITAL-AI-SEC:** independently review scoring API/auth/input/output boundaries before LF-04.
- **CAPITAL-AI-QM:** independently validate the phase evidence and before/after behavior.
- **CAPITAL-AI-COMP:** assess public financial-information claims/disclosures and evidence requirements.
- **Entitlement/IAM owners:** preserve server-authoritative access decisions; FINTECH does not invent browser-local tier truth.

## Exit evidence

This package may move from `HELD` to implementation only when evidence includes:

- fresh `current_main_sha`;
- `LF-01_STATIC_VISUAL_LANDING_PASS`;
- `LF-02_AUTH_PROFILE_PASS`;
- `LF-03_PRICING_ENTITLEMENTS_PASS`;
- exact canonical scoring route/contract identity;
- `FINTECH_CONTRACT_READY`;
- `SEC_REVIEW_READY`;
- `QM_VALIDATION_READY`;
- no conflicting FINTECH/FE writer or semantic-authority overlap.

LF-04 implementation exit additionally requires exact-head tests proving BTC-only free/no-paid behavior, canonical score/evidence/DQ/error semantics, no synthetic fallback, and no duplicate scoring/provider/ranking authority.

## Acceptance criteria

- The work remains non-productive while the shared landing gate is closed.
- The future landing consumer is defined as a consumer of the one canonical FINTECH scoring chain.
- BTC-only free/no-paid semantics are explicit without moving entitlement authority into Frontend.
- The public quick-analysis endpoint is not confused with canonical scoring.
- Foreign-owner work is represented as handover/dependency, not implemented here.
- Historical evidence is preserved and no second control plane or task authority is created.
