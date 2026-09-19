# FINTECH Evidence — Altcoin Pattern Research View Wiring

**Evidence-ID:** FINTECH-ALTCOIN-PATTERN-VIEW-WIRING-2026-09-20  
**Project / Owner:** CAPITAL-AI-FINTECH  
**Primary PVC:** PVC-09..17  
**Baseline:** main@8d602d5183a8414209b8dc792029a35ddb3bcbdd  
**Work package:** FINTECH-ALTCOIN-PATTERN-VIEW-WIRING-01

## Goal

Connect the already merged FINTECH altcoin pattern research assessment to the already merged Crypto Pattern Trooper through one narrow, read-only backend/view contract while preserving provenance, the 4h/1d boundary, and the existing non-authorizing flags.

## Before

- AltcoinPatternResearchScorer existed in FINTECH.
- CryptoOrchestrator could evaluate the research profile.
- CryptoPatternTrooper could render an already-authorized projection.
- No backend read model connected those two surfaces.
- No productive pattern detector is present on current main; PatternResearchEngine intentionally exposes a detector SPI only.

## After

The bounded path is:

FINTECH PatternSignalResolver / confirmation evidence
→ CryptoOrchestrator.analyzeAltcoinPatternResearch(...)
→ AltcoinPatternResearchViewProjection
→ bounded latest-projection store
→ GET /api/crypto/evidence/pattern-research/:symbol
→ CryptoPatternTrooperLive
→ CryptoPatternTrooper

The browser never submits PatternEvidence, confirmation boosts, reference scores, ranking state or execution state to this endpoint.

## Contract invariants

Every projection fixes:

- scoreEligible=false
- executionEligible=false
- canonicalScoreImpact=NONE
- authority=RESEARCH_CONTEXT_ONLY_REFERENCE_PROFILE
- UAI identity in crypto:<SYMBOL> form
- timeframe restricted to 4h or 1d
- observedAt, publishedAt and source correlationId
- exact assessment evidenceRefs preserved from FINTECH output

The API is GET-only and validates the requested symbol against the existing crypto registry before reading the projection.

## Fail-closed behavior

This slice does not implement or simulate a PatternDetector. If no server-side FINTECH orchestration call has produced an attested projection for the selected asset/timeframe, the read model returns a null lane and the frontend remains NOT_COMPUTABLE / NO ATTESTED PROJECTION.

No bootstrap pattern label, legacy assetRegistry.pattern value, caller-provided score or browser-side indicator calculation is promoted into the FINTECH research assessment.

## Best-practice / OSS check

The implementation reuses the repository's existing Express router, FINTECH contracts, UAI identity and React feature architecture. No new framework or dependency is introduced because an additional RPC/schema framework would duplicate existing boundaries for this narrow read contract.

OWASP API Security Top 10 was used as the external security benchmark for object/property/function boundaries. The route minimizes client-controlled input to a normalized registry symbol and does not accept financial research objects from the client.

## Open dependency

A real READY production research projection still depends on an owner-approved PatternDetector implementation plus exact PatternReliabilityRegistry evidence. That work is deliberately outside this wiring slice.

## Validation

Focused tests cover:

1. CryptoOrchestrator publication into the bounded read model.
2. UAI/symbol mismatch rejection.
3. 4h/1d-only projection enforcement.
4. GET-only frontend consumption.
5. preservation of evidence refs and score values without browser recomputation.
6. fail-closed rejection of authority-escalating payloads.

Hosted CI is intentionally deferred until Pull Request creation under the repository cost-control rule.
