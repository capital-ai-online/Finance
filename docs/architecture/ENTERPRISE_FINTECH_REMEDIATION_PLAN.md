# CAPITAL-AI Enterprise FinTech Remediation Plan

**Status:** Draft / implementation backlog  
**Scope:** Findings derived from the repository Enterprise FinTech architecture review and `ARCH-AUDIT-0002`.  
**Target:** Raise the production codebase from Defined/Managed maturity toward measurable Enterprise readiness without masking unavailable financial data.

## 1. Governing principles

1. **No fabricated financial evidence.** Missing, stale, unverified or insufficient market data MUST produce an explicit unavailable/degraded state, never a plausible default score, expected return, volatility, risk classification or pattern.
2. **Evidence before score.** Every externally visible score MUST be traceable to source data, observation time, data-quality status, scoring/model version and calculation evidence.
3. **Deterministic core.** Quantitative scoring remains deterministic and testable. Generative AI/RAG may enrich evidence and interpretation but MUST NOT silently replace deterministic financial calculations.
4. **Fail closed for privileged/security controls.** Security-critical controls must not degrade to permissive behavior.
5. **Runtime controls, not dashboard simulations.** Circuit breakers, health state, quality gates and supervisor actions must be backed by server/runtime behavior.
6. **Production handoff boundary.** Changes requiring Stripe, Supabase or Render configuration are documented as production handoff actions and are not silently changed by application-development work.

## 2. P0 — Scoring and data integrity

### P0.1 Remove fabricated scoring fallbacks

Audit all production paths, including `src/components/CryptoEnterpriseEvaluator.tsx`, registry endpoints and scoring services. Replace fixed fallback values such as score/expected-return/volatility/risk defaults with typed states such as:

- `DATA_UNAVAILABLE`
- `SOURCE_UNAVAILABLE`
- `INSUFFICIENT_HISTORY`
- `STALE_DATA`
- `SCORE_NOT_COMPUTABLE`

**Acceptance:** No UI/API path presents a numeric financial assessment unless its required source observations are present and validated.

### P0.2 Establish canonical MarketData -> Feature -> Score pipeline

Introduce explicit contracts between acquisition, normalization, feature engineering and scoring. A score result must carry at minimum:

- asset identifier
- source/provider identifiers
- observed/retrieved timestamps
- data-quality status
- feature/calculation version
- scoring model/version
- confidence/coverage where applicable
- evidence/provenance references

**Acceptance:** A score can be reconstructed from recorded inputs and versioned calculation logic.

### P0.3 Data-quality gate

Before scoring, validate freshness, completeness, numeric validity, provider identity and minimum history requirements. Reject or degrade invalid observations rather than substituting synthetic values.

## 3. P1 — Financial Intelligence / RAG Evidence Layer

Create an evidence-oriented retrieval layer rather than a generic chatbot RAG feature.

Required capabilities:

- document/source registry
- ingestion and normalization contracts
- retrieval metadata and timestamps
- source quality/ranking
- temporal validity
- evidence IDs and provenance
- structured AI output schemas
- model/prompt version attribution
- separation of retrieved evidence from generated interpretation

RAG output may contribute to sentiment, event-risk, macro and qualitative analysis only through explicit, versioned scoring contracts.

## 4. P1 — Scoring validation framework

Add automated tests covering:

- unit tests for deterministic scoring functions
- integration tests for provider -> normalization -> scoring
- contract tests for external provider adapters
- data-quality tests
- golden-dataset regression tests
- score drift/regression thresholds
- security tests for privileged endpoints

A release MUST fail when a scoring regression violates an approved golden-data expectation or when required data lineage is absent.

## 5. P1 — Runtime resilience and Supervisor enforcement

Implement real backend/runtime controls:

- provider timeouts
- bounded retries
- exponential backoff with jitter
- circuit breaker state
- provider health registry
- fallback provider policy
- degraded-mode signaling
- data-quality events
- supervisor containment/recovery actions

The Supervisor UI must consume actual runtime state and MUST NOT represent local React state as operational infrastructure state.

## 6. P1 — Observability

Standardize structured telemetry for:

- market-data requests
- provider latency/failure
- scoring executions
- scoring/data-quality failures
- AI/RAG retrieval and generation
- IAM/security events
- supervisor interventions

Correlation IDs should connect request -> data retrieval -> feature calculation -> score -> AI evidence -> response.

## 7. P2 — Compliance-as-Code and traceability

Extend Documentary/Traceability so controls resolve through:

`Requirement -> ADR/ESS -> Implementation -> Test -> Runtime Evidence -> Audit Finding`

Machine-readable control evidence should be generated from CI/runtime where practical instead of relying only on manually maintained Markdown claims.

## 8. P2 — AI governance

Introduce governed registries for:

- AI models/providers
- prompts/system instructions
- evaluation datasets
- model/prompt versions
- approved use cases
- risk classification
- structured output schemas
- evaluation results and release gates

No model or prompt version should affect a financial assessment without attributable version metadata.

## 9. P2 — CI/CD release assurance

Required pull-request gates:

1. TypeScript/build
2. unit/integration tests
3. scoring regression suite
4. security/static checks
5. dependency vulnerability policy
6. documentary/traceability validation
7. migration/configuration handoff validation when applicable

Production promotion must be blocked on failed mandatory gates.

## 10. Production handoff items

The following require explicit environment-level validation and are not assumed correct from repository evidence alone:

- Supabase schema/RLS/migration state supporting new provenance/evidence records
- Render runtime variables, health checks and deployment policy
- Stripe configuration where billing/entitlement changes are implicated
- production secrets/key rotation
- provider credentials and quotas

Each such change must have a documented migration/rollback/verification procedure before production execution.

## 11. Definition of Done

This remediation is complete only when:

- no fabricated financial fallback reaches a user-visible score;
- all scores have reconstructable provenance and version metadata;
- deterministic scoring is covered by regression tests;
- provider failures enter explicit degraded/unavailable states;
- Supervisor operational state is runtime-backed;
- mandatory CI gates block invalid releases;
- RAG/AI evidence is attributable and separated from deterministic calculations;
- security/IAM controls retain fail-closed behavior;
- Documentary traceability connects requirements to code, tests and runtime evidence;
- environment-specific production changes have completed handoff evidence.
