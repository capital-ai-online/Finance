# CAPITAL-AI Enterprise FinTech Remediation Plan

**Status:** Active remediation / synchronized after PR #27  
**Scope:** Findings derived from `ARCH-AUDIT-0002`, the merged follow-up work in PR #27 and `ARCH-AUDIT-0003`.  
**Current PROD baseline:** `main` at merge commit `d3d63def40f1fa79970bec04a4fe246541c72cb4` (PR #27).  
**Target:** Raise the production codebase toward measurable Enterprise readiness without masking unavailable financial data.

## 0. Baseline synchronization — 2026-08-02

PR #27 was merged into `main` while this remediation branch was open. The merged work materially changes the remaining backlog:

- Enterprise Traceability Matrix is implemented and has Event-Bus publication plus a generic validator base.
- A first real RAG layer exists under `src/services/rag/` with document loading, embeddings, retrieval and vector storage.
- Anthropic -> OpenAI -> Gemini routing is implemented for the relevant text/structured AI paths.
- CI, 187 tests, health/metrics/logging and runtime Supervisor capabilities are present in the current production baseline.
- `ARCH-AUDIT-0003` raises the measured Enterprise score from 35/100 to 59/100.
- New finding `AUD3-F-001` identifies a remaining independent symbol-hash scoring/trading-setup path in `src/components/CryptoScoringEnterprise.tsx`.

The remediation branch has no overlapping changed files with PR #27. GitHub CI already validated the virtual merge of the P0 changes against the post-PR-#27 `main` baseline. The branch history therefore does not need a destructive force-rebase merely to obtain integration confidence.

## 1. Governing principles

1. **No fabricated financial evidence.** Missing, stale, unverified or insufficient market data MUST produce an explicit unavailable/degraded state, never a plausible default score, expected return, volatility, risk classification, chart pattern or trading setup.
2. **Evidence before score.** Every externally visible score MUST be traceable to source data, observation time, data-quality status, scoring/model version and calculation evidence.
3. **Deterministic core.** Quantitative scoring remains deterministic and testable. Generative AI/RAG may enrich evidence and interpretation but MUST NOT silently replace deterministic financial calculations.
4. **Fail closed for privileged/security controls.** Security-critical controls must not degrade to permissive behavior.
5. **Runtime controls, not dashboard simulations.** Circuit breakers, health state, quality gates and supervisor actions must be backed by server/runtime behavior.
6. **Production handoff boundary.** Changes requiring Stripe, Supabase or Render configuration are documented as production handoff actions and are not silently changed by application-development work.

## 2. P0 — Scoring and data integrity — IMPLEMENTED

### P0.1 Remove fabricated scoring fallbacks

Implemented on `agent/enterprise-fintech-remediation`:

- fixed browser fallback values removed from `CryptoEnterpriseEvaluator.tsx`;
- explicit `DATA_UNAVAILABLE`, `SOURCE_UNAVAILABLE`, `INSUFFICIENT_HISTORY`, `STALE_DATA` and `SCORE_NOT_COMPUTABLE` states introduced;
- registry bootstrap values are no longer exposed as verified scoring evidence;
- public crypto scoring does not accept unverifiable caller-provided financial scores as trusted evidence;
- missing evidence produces unavailable state rather than an artificial numeric zero.

### P0.2 Canonical MarketData -> Feature -> Score -> Evidence contract

Implemented through `src/types/scoringIntegrity.ts` and `src/services/scoringIntegrity.ts` with provider/source identity, timestamps, data-quality state, feature/scoring versions and evidence references.

### P0.3 Data-quality gate

Implemented fail-closed before user-visible scoring. Invalid/missing evidence is rejected or degraded instead of being replaced with synthetic values.

### P0 validation

GitHub Actions CI run #47 against the virtual merge with the post-PR-#27 `main` baseline passed:

- `tsc --noEmit`
- Vitest
- production build (Vite + esbuild)
- deployment-readiness check

## 3. P1 — AUD3-F-001 legacy scoring propagation — IMPLEMENTED ON BRANCH

`ARCH-AUDIT-0003` found an independent legacy path in `src/components/CryptoScoringEnterprise.tsx` that still created stock/forex/index scores and trading setups from a symbol hash.

Remediation decision:

- the legacy hash-based surface is removed;
- the public component contract is preserved through a compatibility adapter;
- the adapter delegates to the P0-hardened `CryptoEnterpriseEvaluator`;
- no symbol-derived score, chart pattern, entry range, stop-loss or take-profit is produced when provenance-backed data is unavailable.

This intentionally favors reduced functionality over fabricated financial evidence until equivalent provenance-backed asset-class adapters exist.

## 4. P1 — Financial Intelligence / RAG Evidence Layer — PARTIALLY IMPLEMENTED BY PR #27

PR #27 already introduced the first real implementation:

- document loading and chunking;
- embedding providers with explicit failure instead of fabricated vectors;
- vector storage/retrieval;
- real consumers in the chat assistant and document-hygiene classification;
- Anthropic/OpenAI/Gemini model routing for applicable reasoning paths.

Remaining Enterprise work:

- governed source/document registry with source-quality policy;
- explicit temporal-validity/freshness rules;
- evidence IDs propagated into financial-analysis outputs;
- model/prompt version attribution at every AI-derived financial output;
- retrieval evaluation (precision/recall or curated relevance set);
- explicit contract preventing RAG interpretation from silently becoming deterministic score input.

## 5. P1 — Scoring validation framework — NEXT

Required expansion beyond the current unit-test baseline:

- golden-dataset regression tests for deterministic scoring;
- provider -> normalization -> feature -> score integration tests;
- contract tests for provider adapters;
- explicit data-quality test matrix;
- score drift/regression thresholds;
- provenance-presence assertions for user-visible score responses.

A release MUST fail when an approved golden-data expectation is violated or required score lineage is absent.

## 6. P1 — Runtime resilience and Supervisor enforcement — PARTIALLY IMPLEMENTED

PR #27/current `main` includes a real Supervisor with routing/execution control and retry behavior. The market-data provider chain still requires a standardized resilience layer:

- provider timeouts;
- bounded retries;
- exponential backoff with jitter;
- circuit breaker state;
- provider health registry;
- fallback-provider policy;
- explicit degraded-mode signaling tied to data quality.

## 7. P1 — Observability — PARTIALLY IMPLEMENTED

Current `main` has structured logging, metrics and runtime health capabilities. Remaining work is end-to-end correlation across:

`request -> provider retrieval -> normalization -> feature calculation -> score -> evidence/RAG -> response`

Required telemetry dimensions include provider identity/latency, data-quality rejection, scoring model/version, evidence IDs and Supervisor intervention.

## 8. P2 — Compliance-as-Code and traceability — PARTIALLY IMPLEMENTED BY PR #27

Traceability now resolves real ESS/ADR/component/test relationships and publishes build events. Remaining work is to extend it toward:

`Requirement -> ADR/ESS -> Implementation -> Test -> Runtime Evidence -> Audit Finding`

Machine-readable runtime/CI evidence should replace manual claims where technically possible.

## 9. P2 — AI governance

Introduce governed registries for:

- AI models/providers;
- prompts/system instructions;
- evaluation datasets;
- model/prompt versions;
- approved use cases;
- risk classification;
- structured output schemas;
- evaluation results and release gates.

No model or prompt version should affect a financial assessment without attributable version metadata.

## 10. P2 — CI/CD release assurance — PARTIALLY IMPLEMENTED

GitHub Actions currently performs TypeScript, unit tests, production build and deployment-readiness validation. Remaining release gates should cover:

1. golden-dataset/scoring regression suite;
2. provenance/evidence contract validation;
3. security/static checks and dependency vulnerability policy;
4. traceability generation/validation;
5. migration/configuration handoff validation when applicable.

## 11. Production handoff items

The following require explicit environment-level validation and are not assumed correct from repository evidence alone:

- Supabase schema/RLS/migration state supporting provenance/evidence persistence;
- Render runtime variables, health checks and deployment policy;
- Stripe configuration where billing/entitlement changes are implicated;
- production secrets/key rotation;
- external data/AI provider credentials and quotas;
- real RAG index build against configured embedding providers.

Each environment change requires migration/rollback/verification evidence before production execution.

## 12. Definition of Done

This remediation is complete only when:

- no fabricated financial fallback reaches a user-visible score or trading setup;
- all scores have reconstructable provenance and version metadata;
- deterministic scoring is protected by golden-dataset regression tests;
- provider failures enter explicit degraded/unavailable states;
- Supervisor operational state is runtime-backed;
- mandatory CI gates block invalid releases;
- RAG/AI evidence is attributable and separated from deterministic calculations;
- security/IAM controls retain fail-closed behavior;
- Documentary/Traceability connects requirements to code, tests and runtime evidence;
- environment-specific production changes have completed handoff evidence.
