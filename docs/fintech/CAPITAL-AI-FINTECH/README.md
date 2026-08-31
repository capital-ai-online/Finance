# CAPITAL-AI-FINTECH

Status: `ACTIVE — V2 OWNERSHIP CONSOLIDATION`  
Project role: `PRIMARY_VALUE_CHAIN_OWNER` for the financial scoring/ranking domain  
Repository baseline: `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`  
Trust root: `/AGENTS.md`

## Purpose

CAPITAL-AI-FINTECH is the bounded execution and ownership project for financial feature engineering, model selection, productive scoring orchestration, asset-class domain execution, canonical score production and ranking/decision-support inputs.

It does **not** become a second governance, DATA, Evidence, Data-Quality, Security, Compliance, EventMesh or Frontend authority.

## Canonical financial execution chain

```text
Validated Data Input
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
  -> Ranking / Decision Support
```

Current productive authorities are reused:

- `src/platform/Scoring/ScoringModelRegistry.ts` — one model registry;
- `src/platform/Scoring/ScoringDispatcher.ts` — one productive scoring dispatcher;
- `src/types/scoringIntegrity.ts` — CanonicalScoreResult contract;
- `src/platform/Ranking/CrossAssetRanking.ts` and `src/services/ranking.service.ts` — existing ranking contracts/services, to be consolidated without a second ranking engine.

## Ownership boundary

### FINTECH-owned target capabilities

- Financial Feature Contracts and Feature Engineering;
- Scoring Models and model lifecycle projection;
- ScoringModelRegistry;
- ScoringDispatcher;
- Scoring Orchestration;
- Domain Executors / asset-class analysis;
- CanonicalScoreResult production;
- Ranking / Decision Support inputs;
- provider-capability requirements for supported asset classes.

### Foreign authorities retained

- `CAPITAL-AI-DATA`: canonical ingress, UAI/data acquisition, Evidence, provenance and Data Quality;
- `CAPITAL-AI-OPS`: EventMesh / Traceability runtime transport and operations;
- `CAPITAL-AI-FE`: presentation only; no score/rank calculation authority;
- `CAPITAL-AI-QM`: read-only quality projection/validation;
- `CAPITAL-AI-SEC`: credential/API/security controls;
- `CAPITAL-AI-COMP`: regulatory/compliance applicability and assessment.

## Current-state versus V2 target VC projection

V2.1 introduces a target semantic ownership projection for VC-12..VC-17. The current canonical `SC-MD-SPT-0001` and `FintechValueChainQualityProjection` use different stage semantics: current VC-12 is Domain Executor, current VC-13 is CanonicalScoreResult and current VC-17 is EventMesh/Traceability/Supervisor.

Therefore V2 target labels are **not silently written over current canonical stage IDs**. Migration requires coordinated cross-project handoffs and synchronized SPT/QM/OPS projections.

See:

- `ROADMAP.md`;
- `mappings/VALUE_CHAIN_OWNERSHIP.md`;
- `inventories/FINTECH_EXECUTION_INVENTORY.md`;
- `handoffs/CROSS_PROJECT_HANDOFFS.md`;
- `work-packages/FINTECH_WORKSTREAMS_V2.md`;
- `reports/FINTECH_V2_VALIDATION_2026-08-31.md`.

## Non-negotiable invariants

1. one ScoringModelRegistry;
2. one productive ScoringDispatcher;
3. one CanonicalScoreResult contract;
4. one productive Ranking authority;
5. no synthetic/neutral score fallback;
6. missing/stale/invalid evidence fails closed;
7. no Frontend-local scoring or ranking business logic;
8. provider-specific logic cannot bypass DATA ingress/DQ boundaries;
9. research/challenger models remain non-productive until explicit governed promotion;
10. cross-project work is recorded as handoff and implemented in the owning project/PR.

## Structure note

The repository contains no exact `CAPITAL-AI-QM` project path/name on this baseline. Exact structural parity is therefore not claimed. This project uses the requested common project pattern (`README`, `ROADMAP`, `work-packages`, `inventories`, `mappings`, `handoffs`, `reports`) and records QM parity as an open cross-project validation item rather than fabricating a source structure.