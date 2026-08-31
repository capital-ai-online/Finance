# CAPITAL-AI FinTech — V2 Scoring & Ranking Roadmap

Status: `ACTIVE — CONSOLIDATION / MIGRATION`  
Project: `CAPITAL-AI-FINTECH`  
Role: `PRIMARY_VALUE_CHAIN_OWNER`  
Baseline: `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## 1. Purpose

Consolidate the complete financial-scoring department from validated DATA input through financial features, model registry/dispatch, bounded asset-class executors, canonical score production and ranking/decision-support inputs.

This roadmap is an execution/ownership projection. It does not supersede higher authority (`AGENTS.md`, accepted ADR/ESS, runtime contracts) and does not grant production/model/provider promotion authority.

## 2. Scope

### FINTECH owns

- financial feature contracts and deterministic feature engineering;
- scoring models and registry metadata;
- the single productive ScoringModelRegistry;
- the single productive ScoringDispatcher;
- bounded scoring orchestration;
- asset-class Domain Executors;
- CanonicalScoreResult production;
- ranking/comparability/eligibility business logic and decision-support inputs;
- asset-class provider capability requirements, not ingestion authority.

### FINTECH consumes

`CAPITAL-AI-DATA` validated data/evidence/DQ output through explicit contracts.

### FINTECH hands off

- EventMesh/Traceability transport -> `CAPITAL-AI-OPS`;
- score/rank presentation -> `CAPITAL-AI-FE`;
- structural quality projection -> `CAPITAL-AI-QM`;
- credential/API security requirements -> `CAPITAL-AI-SEC`;
- regulatory applicability/compliance assessment -> `CAPITAL-AI-COMP`.

## 3. Canonical scoring chain

```text
Validated Data Input
  -> Feature Contract
  -> ScoringModelRegistry
  -> ScoringDispatcher
  -> Domain Executor
  -> CanonicalScoreResult
  -> Ranking / Decision Support
```

Rules:

1. provider support never grants score authority;
2. DATA validation/provenance/DQ cannot be bypassed;
3. Dispatcher selects registered productive models and never invents a model;
4. Domain Executors cannot redefine global score semantics;
5. unavailable evidence remains non-computable, never `0`/neutral filler;
6. Ranking consumes canonical results and verified comparability/governance evidence;
7. Frontend renders results only.

## 4. Current repository execution inventory

### Scoring

Current productive path:

```text
UniversalAssetIdentity
 -> ScoringModelRegistry
 -> ScoringDispatcher
 -> registered executor
 -> CanonicalScoreResult
```

Verified current model classes:

- `crypto` -> `crypto-technical-provenance@0.7.0`;
- `stock`, `forex`, `index` -> `traditional-scoring@2.1.0`;
- `commodity` -> `commodity-evidence-scoring@1.0.0`;
- `bond/government-benchmark-yield` -> `sovereign-benchmark-yield-scoring@1.0.0`.

Research/challenger models remain non-productive.

### Ranking

Two related current mechanisms exist:

1. `src/services/ranking.service.ts` — productive crypto rank-score/top-10 logic;
2. `src/platform/Ranking/CrossAssetRanking.ts` — evidence-aware canonical cross-asset ranking contract with `impactEnabled=false`.

Additionally, `src/features/screening/ui/RankingBoard.tsx` locally sorts READY score rows to create Top/Worst lists. Under V2 this is a foreign-domain boundary violation: ranking business logic belongs to FINTECH and the FE implementation must later consume a FINTECH-produced ordering.

No second ranking engine is created in this roadmap. FIN-17 consolidates the existing mechanisms and the FE removal is a separate handoff.

## 5. Value-chain ownership: current -> V2 target

The repository's current canonical SPT/QM projection and V2 target labels are not numerically aligned.

| Current canonical stage | Current meaning | V2 target capability | V2 owner |
|---|---|---|---|
| VC-09 | Classification + Feature Contract | VC-12 Feature Engineering | CAPITAL-AI-FINTECH target; DATA remains upstream source |
| VC-10 | ScoringModelRegistry | VC-13 Scoring Models | CAPITAL-AI-FINTECH |
| VC-11 | ScoringDispatcher | VC-14 Scoring Orchestration | CAPITAL-AI-FINTECH |
| VC-12 | Domain Executor | VC-15 Domain Analysis / Domain Executor | CAPITAL-AI-FINTECH |
| VC-13 | CanonicalScoreResult | VC-16 Canonical Scoring | CAPITAL-AI-FINTECH |
| VC-14..16 | DQ confidence/comparability/ranking | VC-17 Ranking / Decision Support | split current state; target ranking owner FINTECH, DQ remains DATA |
| VC-17 | EventMesh / Traceability / Supervisor | VC-18 EventMesh / Traceability | CAPITAL-AI-OPS target |

The target numbering becomes canonical only after correlated DATA/QM/OPS/SPT migration. This FinTech PR records the target and handoff; it does not perform foreign-domain changes.

## 6. Workstreams

| ID | Name | Current status | Exit gate |
|---|---|---|---|
| FIN-12 | Feature Engineering | PARTIAL | explicit DATA-input + feature contracts; no DQ ownership leakage |
| FIN-13 | Scoring Models | VERIFIED/PARTIAL | all productive/challenger models inventoried; lifecycle/version drift tracked |
| FIN-14 | Scoring Orchestration | VERIFIED | one Registry + one Dispatcher + bounded orchestration |
| FIN-15 | Domain Executors | VERIFIED/PARTIAL | each productive asset scope mapped to an explicit executor |
| FIN-16 | Canonical Scoring | VERIFIED | one CanonicalScoreResult; fail-closed unavailable state |
| FIN-17 | Ranking / Decision Support | PARTIAL / P1 | one FINTECH ranking authority; FE-local ordering removed via FE handoff |
| FIN-18 | Asset Class Inventory | VERIFIED | repository-defined support only |
| FIN-19 | Provider Capability Mapping | PARTIAL | requirements mapped without DATA/provider authority takeover |
| FIN-20 | Scoring Evidence | PARTIAL | score-to-feature/model/executor/evidence lineage and handoffs complete |

Details: `work-packages/FINTECH_WORKSTREAMS_V2.md`.

## 7. Asset-class model

Supported scoreable UAI classes on the baseline:

- crypto;
- stock;
- forex;
- commodity;
- index;
- bond (bounded sovereign benchmark yield scope).

ETF, fund and REIT/real-estate are not independent scoreable classes on this baseline and are not invented by this roadmap.

Every productive asset scope requires:

1. canonical identity received from upstream contracts;
2. verified DATA/evidence/DQ input;
3. versioned feature contract;
4. registered productive model;
5. explicit Domain Executor;
6. CanonicalScoreResult;
7. ranking admission only when applicable evidence/lineage/comparability gates pass.

## 8. Provider boundary

FINTECH owns **capability requirements**, e.g. price/history/fundamentals/on-chain/security/derivatives needed by a model/feature contract.

FINTECH does not own provider ingestion, credentials, canonical evidence identity or DQ. Provider-specific adapter work that occurs before canonical validated ingress belongs to DATA/SEC and is represented by a cross-project handoff.

No provider failure may silently change scoring semantics or produce synthetic/neutral evidence.

## 9. Ranking boundary

Target rule: one productive FINTECH ranking authority.

Existing reusable assets:

- `cross-asset-ranking/1.0.0` contract;
- deterministic cohort construction;
- verified comparability evidence gate;
- canonical score/model/executor lineage requirements;
- governance and operations-evidence admission gates;
- deterministic tie breaker.

Migration constraints:

- do not flip `CROSS_ASSET_RANKING_IMPACT_ENABLED` merely through documentation;
- do not create a parallel ranking implementation;
- preserve current crypto ranking behavior until a reviewed consolidation has compatibility tests;
- remove FE-local ranking only in the dedicated CAPITAL-AI-FE change after a FINTECH-owned result contract/endpoint is ready.

## 10. Mandatory cross-project handoffs

All foreign implementation is represented with the mandated marker.

- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09..VC-11]` — establish/confirm canonical validated-data input and keep provider ingestion/DQ outside FINTECH.
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]` — target EventMesh/Traceability stage ownership and synchronized stage projection.
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]` — remove client-local ranking/sorting business logic and consume FINTECH ordering only.
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-12..VC-18]` — reconcile V2 target stage numbering with the read-only quality projection.
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEC | VC-12..VC-17]` — keep provider/API/secret security controls external and referenced.
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-COMP | VC-12..VC-17]` — keep financial regulatory/compliance applicability assessment external and referenced.

See `handoffs/CROSS_PROJECT_HANDOFFS.md`.

## 11. Validation gates

The FinTech branch must prove:

- no second ScoringModelRegistry;
- no second productive ScoringDispatcher;
- no new CanonicalScoreResult contract;
- no synthetic/neutral fallback;
- every productive asset scope maps to an executor;
- existing ranking implementations are inventoried and a single target authority is designated;
- DATA/DQ boundary remains external;
- FE-local ranking is explicitly handed off, not silently accepted;
- V2 VC-numbering conflict is exposed, not overwritten;
- no foreign-project runtime implementation is included.

## 12. Definition of Done status

| Requirement | Status on this FinTech-only scope |
|---|---|
| all asset classes mapped | PASS |
| all productive scoring paths mapped | PASS |
| duplicate scoring paths removed/superseded | PASS for current productive scoring authority; historical paths superseded |
| DATA input contract explicit | PARTIAL — handoff required |
| Ranking ownership explicit | PASS target ownership / PARTIAL runtime consolidation |
| Frontend boundary explicit | PASS documentation; runtime cleanup requires FE PR |
| EventMesh handoff explicit | PASS documentation; projection migration requires OPS/QM coordination |
| VC-12..17 uniquely assigned under V2 numbering | TARGET DEFINED; NOT YET CANONICAL because current SPT/QM numbering conflicts |
| no frontend ranking duplication | NOT YET — foreign FE handoff required |

No item marked incomplete is falsely promoted to VERIFIED.