# ADR-0098 — CAPITAL-AI FinTech Core Engine: Crypto Module 01

- **Authority ID:** `AUTH-ADR-FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Version:** 1.0.0
- **Date:** 2026-08-20
- **Lifecycle:** proposed
- **Owner Priority:** Chat-Prioritaet 2026-08-20
- **Roadmap:** `FT-CORE-CRYPTO-01`
- **Work Claim:** `FINTECH-CORE-CRYPTO-MODULE-01-2026-08-20`
- **Branch:** `feat/fintech-core-crypto-module-01`
- **Base:** `main@f1dff495fe792a4d4a26a3513f0525b4974bd349`
- **Supersedes:** none
- **Protected authority:** ADR-0087 / SC-2 Single Scoring Architecture

> Namespace note: ADR-0097 is already used by open PR #458. ADR-0098 is reserved by this branch subject to the mandatory final open-PR/main namespace correlation before PR creation. This ADR must be registered in the ADR registry and document registry before merge readiness.

## Context

CAPITAL-AI already has a canonical crypto research path, a deterministic classification layer and a productive scoring authority:

```text
CryptoOrchestrator
  -> research / enrichment only
  -> scoreEligible=false

ScoringModelRegistry
  -> canonical champion selection

ScoringDispatcher
  -> only productive model-execution boundary
  -> CanonicalScoreResult
```

The Owner supplied the `FinTech Enterprise Orchestration Modell` as the functional architecture source for an enterprise crypto orchestration layer. The source requires the orchestrator to control workflow and approvals rather than behave as a trading strategy. It also introduces category-specific crypto analysis and a context-sensitive pattern engine.

A new orchestration layer must therefore add financial workflow composition without reintroducing parallel scoring, authority duplication or agent-controlled financial side effects.

## Decision

CAPITAL-AI introduces a new platform boundary:

```text
src/platform/FinTechCore/
```

The first registered module is:

```text
moduleId = fintech-core.crypto
name     = Enterprise Crypto Orchestration
```

The FinTech Core Engine is a **financial workflow authority**, not a scoring model and not a Supervisor replacement.

### 1. Authority boundaries

#### FinTech Core owns

- lifecycle of a financial analysis/execution workflow,
- workflow correlation and decision versions,
- ordered invocation of category, pattern, scoring, portfolio, risk, compliance and execution adapters,
- operating-mode enforcement,
- creation of OrderIntent only after required approvals,
- orchestration-level idempotency and reconciliation requirements.

#### FinTech Core does not own

- canonical scoring model selection,
- score calculation outside ScoringDispatcher,
- IAM/AuthN/AuthZ policy,
- Compliance policy definitions,
- Quality rules,
- Supervisor governance decisions,
- GitHub/Render/Supabase mutation authority,
- exchange credentials/private keys.

### 2. Existing CryptoOrchestrator remains research-only

`src/orchestrator/cryptoOrchestrator.ts` is retained as an adapter for research/enrichment.

Its current invariant remains mandatory:

```text
mode = research-enrichment
scoreEligible = false
```

Agent-derived classification, on-chain, sentiment or risk observations cannot directly enter `CanonicalScoreResult` without a separately approved evidence-promotion contract.

### 3. ScoringDispatcher remains the only productive scoring exit

Category and pattern analysis must feed a verified feature/evidence contract and then use:

```text
ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
```

No FinTech Core class may calculate or expose an alternate productive asset score.

### 4. Existing canonical taxonomy is preserved

The current `CryptoCategory` taxonomy remains the canonical compatibility taxonomy. A separate analytical profile layer maps relevant categories onto category-specific analysis models.

Initial analysis profile identifiers:

- `layer1`
- `layer2`
- `defi`
- `rwa`
- `nft`
- `stablecoin`
- `exchange-token`
- `gamefi`
- `ai-depin`
- `meme`
- `generic`

This is intentionally a profile layer rather than a replacement classification enum.

### 5. Category-specific model contracts

Initial profile weights are configuration/evidence contracts derived from the Owner source. They are not live LLM-adjustable parameters.

Profiles with explicit source formulas are introduced as versioned research contracts. Where the source does not provide a sufficiently specific formula, the profile is marked `PENDING_EVIDENCE` rather than filled with invented weights.

In particular, the `meme` profile starts as `PENDING_EVIDENCE`.

### 6. Pattern analysis is evidence, not trading authority

The Pattern Engine may detect and evaluate patterns, but an isolated pattern cannot authorize a trade or mutate a canonical score directly.

Initial priority groups:

1. Structure Reversal — 1.00
2. Structure Continuation — 0.90
3. Breakout Structure — 0.85
4. Wedge — 0.80
5. Candlestick Reversal — 0.65
6. Candlestick Continuation — 0.60
7. Single Candle — 0.40
8. Micro Pattern — 0.25

The values are research start weights, not success probabilities.

Each Pattern Evidence record must be able to bind:

- pattern ID/group,
- direction,
- timeframe,
- pattern quality,
- context,
- volume confirmation,
- breakout quality,
- retest,
- higher-timeframe confirmation,
- market regime,
- historical edge,
- asset reliability,
- data quality,
- evidence references,
- validation/version metadata.

### 7. Pattern Reliability is asset/timeframe/regime specific

No global pattern win rate is accepted as productive evidence.

The intended reliability identity is:

```text
assetId
+ analysisProfile
+ timeframe
+ marketRegime
+ patternId
+ validationVersion
```

Research defaults from the Owner source include:

- minimum occurrences: 100
- train window: 730 days
- validation window: 180 days
- walk-forward: true
- include fees: true
- include slippage: true
- include funding: true
- regime split: bull / bear / range / high-volatility

The defaults are not immutable production risk policy. They require validation and governance before promotion.

### 8. Operating modes

FinTech Core defines the following operating modes:

- `RESEARCH`
- `PAPER`
- `GUARDED_LIVE`
- `PRODUCTION`
- `EMERGENCY`

The workflow contract stays stable across modes; side-effect policy changes by mode.

No LLM may autonomously move the system into a more permissive operating mode.

### 9. Retry and side-effect classification

Core actions are classified as either:

- `RETRY_SAFE`
- `SIDE_EFFECTING`

Research/data/scoring simulation can generally be retried when inputs and versions are stable.

Orders, withdrawals, settlement and custody actions are side-effecting. They require end-to-end idempotency, venue/client-order IDs and explicit recovery semantics before retry is allowed.

The existing generic Supervisor retry helper must not blindly wrap a live order side effect.

### 10. Durable workflow state

EventMesh remains suitable for application-local events and observability but is not sufficient as the sole authoritative financial workflow history.

A later roadmap phase introduces durable state, provisionally:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
fintech_core.order_intents
fintech_core.reconciliation_records
```

The database design is not applied in FT-0/FT-1.

### 11. Existing Supabase primitives are reused first

Current production already contains:

- `outbox_jobs`
- `agent_audit_events`
- `score_snapshots`
- `ai_governance_evaluations`
- `pgmq 1.5.1`

No second queue architecture is introduced now.

`outbox_jobs` remains the first candidate for asynchronous durable application work. `pgmq` may be evaluated later for convergence or specialized queue workloads, but only under a separate architecture decision if it would replace rather than duplicate an existing authority.

### 12. Render remains unchanged in the foundation phase

FT-0 through FT-2 do not require a new Render service, background worker, preview environment or environment-variable mutation.

The existing Docker web service remains untouched until a runtime requirement is proven.

### 13. Open-source strategy

#### TA-Lib

TA-Lib is the preferred later proof-of-concept candidate for standard technical indicators/candlestick primitives because it has a permissive BSD-3-Clause license and current maintenance activity.

It is **not** added during FT-0/FT-1 because:

- current contract work does not require runtime pattern detection,
- native C/Docker binding changes would widen the blast radius,
- CAPITAL-AI still needs its own context, regime, evidence, reliability and governance layer.

#### technicalindicators

Not selected as Enterprise Core dependency for now because the public npm release is materially stale despite good TypeScript fit and MIT licensing.

#### Tulip Indicators

Not selected for now due to LGPL/licensing review needs and native binding overhead relative to the current phase.

### 14. Regulatory and audit implications

The architecture is designed to support durable and attributable records of financial services, decisions, orders and transactions. This aligns with the need for reconstructable records and operational controls required for a regulated crypto-service environment.

This ADR does not state that CAPITAL-AI is itself licensed as a CASP and does not replace legal/compliance review.

## Alternatives considered

### A. Promote CryptoOrchestrator to master scoring/trading orchestrator

**Rejected.** It would collapse the existing research-only boundary and risk bypassing ADR-0087/SC-2.

### B. Put category/pattern formulas directly into ScoringDispatcher

**Rejected.** The dispatcher is an execution boundary, not a feature-acquisition or technical-analysis engine. This would mix evidence generation and score authority.

### C. Create separate scoring engines per category exposed directly to routes

**Rejected.** This would recreate parallel productive score paths and violate the Single Dispatcher architecture.

### D. Introduce Kafka/NATS/Temporal immediately

**Rejected for FT-0/FT-1.** The current scale and phase do not justify a new distributed control plane before the domain contracts, idempotency semantics and durable data model are proven.

### E. Introduce Supabase Queues/pgmq immediately alongside outbox_jobs

**Rejected for now.** `pgmq` is available, but running a second queue authority in parallel would add operational ambiguity. Reuse/convergence must precede duplication.

## Consequences

### Positive

- clear first FinTech Core module boundary,
- preserves existing scoring/data-integrity guarantees,
- category-specific analysis without taxonomy fork,
- pattern analysis becomes testable and evidence-driven,
- future execution is constrained by explicit risk/compliance/order-intent gates,
- durable workflow and audit requirements are designed in before live trading.

### Negative / Cost

- additional contracts and versioning overhead,
- category-specific evidence acquisition is substantially broader than current technical scoring,
- Pattern Reliability requires significant historical data and backtesting infrastructure,
- live execution remains intentionally blocked for multiple roadmap phases,
- later durable workflow persistence introduces schema/migration governance work.

## Implementation sequence

1. FT-0 contracts and tests.
2. FT-1 CoreEngine/CoreModuleRegistry/WorkflowContext/OperatingMode.
3. FT-2A classification/profile resolution.
4. FT-2B verified category feature contracts.
5. FT-2C Pattern Engine and reliability validation.
6. FT-3 durable workflow persistence.
7. FT-4 paper workflow.
8. FT-5 risk/compliance gates.
9. FT-6 OrderIntent/reconciliation.
10. FT-7 guarded live.
11. FT-8 enterprise hardening.
12. FT-9 DeFi/DEX/cross-chain expansion.

## Validation obligations

Before PR creation:

- final `main` sync,
- open-PR ADR namespace correlation,
- direct and semantic file-overlap analysis,
- TypeScript/unit/contract checks where locally available,
- no expensive GitHub CI before PR,
- no Supabase/Render production mutation for FT-0/FT-1.

Before guarded live:

- deterministic replay,
- idempotency/crash recovery tests,
- negative risk/compliance tests,
- data-quality/staleness failure tests,
- audit reconstruction,
- reconciliation tests,
- kill-switch/emergency runbook,
- human approval policy,
- security/compliance review.

## Status

`PROPOSED` — initial contract implementation is allowed; production scoring/execution behavior remains unchanged until subsequent explicitly gated roadmap phases.
