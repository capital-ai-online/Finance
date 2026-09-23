# FIN-SENT-01 — Attested Market Sentiment Feature Projection — 2026-09-23

## Authority and routing

- Trust root: `/AGENTS.md@CURRENT_MAIN`
- execution baseline: `main@f4b00e7c04e3b4c68a84d9c70936da692be3f570`
- Project: `CAPITAL-AI-FINTECH`
- Owner/PVC: `CAPITAL-AI-FINTECH / PVC-09..14`
- Branch: `fintech/sentiment-feature-attestation-20260923`
- Human direction: convert existing provider evidence into a complete sentiment feature contract and expose an attested projection for the graphical Market Sentiment consumer.

## Resolved current state

The public Market Sentiment component is already merged and reads verified GDELT / cryptocurrency.cv article evidence. The visual is intentionally fail-closed: headline sentiment is deterministic heuristic presentation metadata and does not create a FINTECH score.

The existing `crypto-sentiment-research/0.1.0` evaluator requires, per score-bearing observation:

- polarity;
- intensity;
- novelty;
- credibility;
- bot probability;
- age/recency;
- source weight;
- mention intensity;
- regime adjustment;
- evidence references.

Current GDELT and cryptocurrency.cv article metadata attest source, provider, publication time, headline/description and stable evidence references. They do **not** attest the complete scoring vector above. In particular no current provider adapter establishes bot probability, governed source weight, credibility or regime adjustment. Those values must not be fabricated or replaced with neutral defaults.

## Implementation

This slice introduces `sentiment-feature-contract/1.0.0` and `market-sentiment-projection/1.0.0`.

The contract separates:

1. raw verified provider observations;
2. explicit per-feature attestations with numeric value, evidence references and derivation method;
3. an explicit `scoreCandidate` promotion bit owned by the governed upstream adapter;
4. the existing `crypto-sentiment-research/0.1.0` evaluator;
5. a frontend-shaped projection with `READY | NOT_COMPUTABLE | SOURCE_UNAVAILABLE`.

A numeric value can be emitted only when at least one score candidate is complete and all required fields are valid and evidence-backed. Raw news/headline heuristic items are always `scoreCandidate=false`.

The existing `/api/news` router exposes a new read-only `GET /api/news/sentiment-projection` endpoint. It reuses the existing GDELT and cryptocurrency.cv providers and returns the attestation state together with the Market Sentiment projection. No second provider gateway, scoring engine, dispatcher or canonical score authority is introduced.

## Current evidence result

With the providers currently available on `CURRENT_MAIN`, the endpoint is expected to return real provider evidence and an explicit `NOT_COMPUTABLE` score state because the full feature vector is not yet attested.

This is intentional. A transition to `READY` is mechanically possible only after a governed provider/evidence adapter supplies all required fields. The existing headline heuristic cannot satisfy that gate.

## Frontend handoff

The merged Frontend component already accepts an upstream `MarketSentimentProjection` via its `projections` input and gives such a projection precedence over its evidence-only fallback.

After this FINTECH slice is Human/CODEOWNER merged, a separate `CAPITAL-AI-FE` consumer slice may bind the endpoint to that existing input. Frontend must not calculate or complete missing financial features locally.

## Coordination hygiene

Two historical claims touching `src/features/news/newsRoutes.ts` were still marked active even though their associated PRs are Human-merged:

- `CRYPTO-EVIDENCE-PROVIDER-ADAPTERS-2026-08-22` → PR #488 merged;
- `NEWSFEED-PROVIDER-FILTER-INTEGRITY-2026-08-25` → PR #529 merged.

This slice releases those stale locks before modifying the shared news route.

The separate FE claim from PR #1323 remains foreign-owner coordination drift and is not mutated in this FINTECH package.

## Non-goals

- no headline-heuristic-to-score promotion;
- no synthetic `50 / Neutral` fallback;
- no invented credibility, bot-probability, source-weight or regime values;
- no new external provider or paid entitlement;
- no ScoringDispatcher or CanonicalScoreResult replacement;
- no ranking, trading or execution authority;
- no Frontend file mutation in this FINTECH slice;
- no generated 30-day history.

## Exit evidence

- complete versioned Sentiment feature-attestation contract exists;
- every numeric scoring field requires explicit evidence refs and derivation method;
- malformed/out-of-range attestations fail closed;
- future timestamps fail closed;
- raw GDELT / cryptocurrency.cv observations remain context-only;
- existing research evaluator is reused rather than duplicated;
- read-only FINTECH projection endpoint exists on the canonical news router;
- current incomplete provider evidence produces `NOT_COMPUTABLE`, not a fabricated value;
- unit regressions cover complete, incomplete, unavailable and invalid evidence states;
- FE handoff is explicit and dependency-gated on Human/CODEOWNER merge.
