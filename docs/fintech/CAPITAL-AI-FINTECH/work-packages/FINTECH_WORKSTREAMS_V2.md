# CAPITAL-AI-FINTECH — V2 Workstreams

Baseline: `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

## FIN-12 — Feature Engineering

**Goal:** make FINTECH ownership of financial feature semantics explicit while consuming validated DATA inputs only.

Current reuse:
- registry descriptors already bind feature-contract versions;
- research and productive models already separate feature contracts.

Open work:
- map each productive model to exact upstream validated-data requirements;
- define/confirm deterministic normalization/versioning rules;
- preserve missing-feature fail-closed behavior;
- close `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09..VC-11]`.

Exit: explicit DATA input contract + feature contract traceability, no DATA authority leakage.

## FIN-13 — Scoring Models

**Goal:** keep one model lifecycle inventory and no hidden asset-specific productive authorities.

Current reuse:
- 10 registry descriptors;
- four canonical champion descriptors;
- six research/challenger descriptors.

Open work:
- resolve documentation/version drift where present;
- preserve explicit promotion gates for challengers;
- maintain model/feature/result lineage.

Exit: every productive model is registered, versioned, tested and uniquely scoped.

## FIN-14 — Scoring Orchestration

**Goal:** preserve one registry/dispatcher execution chain.

Current state:
- one `ScoringModelRegistry`;
- one productive `ScoringDispatcher`;
- domain orchestrators remain bounded research/enrichment or composition roles.

Exit: no productive score path bypasses Registry -> Dispatcher -> Executor.

## FIN-15 — Domain Executors

**Goal:** one explicit executor responsibility for every productive asset scope.

Mapped scopes:
- verified crypto technical;
- traditional stock/forex/index;
- commodity evidence;
- sovereign benchmark yield bond scope.

Exit: all productive asset classes resolve to one registered executor; unsupported scopes fail closed.

## FIN-16 — Canonical Scoring

**Goal:** preserve the single CanonicalScoreResult family and score/evidence lineage.

Current state:
- current contract `scoring-integrity/1.1.0`;
- legacy `1.0.0` boundary retained for selected models;
- unavailable scores remain null.

Open work:
- any future contract evolution must be explicit/versioned and consumer-compatible;
- do not reinterpret missing evidence as zero.

Exit: one canonical result contract family, deterministic status/lineage behavior, compatibility tests preserved.

## FIN-17 — Ranking / Decision Support

**Goal:** establish one productive FINTECH ranking authority and remove business ranking from consumers.

Reusable components:
- current crypto `ranking.service.ts`;
- `cross-asset-ranking/1.0.0` contracts;
- `CrossAssetRanking.ts` deterministic cohort/comparability logic.

Current gap:
- `RankingBoard.tsx` creates Top/Worst ordering locally;
- cross-asset ranking impact remains intentionally disabled.

FinTech actions:
1. define the single productive result boundary using existing ranking contracts/services;
2. preserve current crypto behavior until compatibility is proven;
3. do not create a second ranking engine;
4. provide FE-consumable rank/order metadata.

Foreign action:
- `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]` remove local business ordering in a separate FE PR.

Exit: one backend FINTECH ranking authority; FE presentation only.

## FIN-18 — Asset Class Inventory

**Goal:** maintain repository-derived support only.

Current scoreable classes:
`crypto`, `stock`, `forex`, `commodity`, `index`, `bond`.

Bond remains limited to supported government benchmark yield instruments. ETF/Fund/REIT are not introduced as independent scoreable classes without explicit contracts.

Exit: asset catalog/UAI/model/executor mappings agree.

## FIN-19 — Provider Capability Mapping

**Goal:** map financial model/feature capability requirements without taking provider ingress authority from DATA.

Current reuse:
- one `ProviderMatrix`;
- existing provider adapters and research-evidence suppliers.

Open work:
- map model/feature requirement -> canonical DATA capability contract -> eligible upstream provider capability;
- avoid assuming commercial entitlement or runtime health;
- coordinate provider-ingress changes with DATA/SEC.

Exit: capability matrix complete, no direct provider bypass in productive FINTECH scoring execution.

## FIN-20 — Scoring Evidence

**Goal:** complete score-to-input/model/executor/ranking traceability.

Required lineage:
- asset identity;
- validated input/evidence references;
- feature contract/version;
- model ID/version;
- registry/dispatcher version;
- executor key;
- CanonicalScoreResult contract/status;
- ranking contract/cohort/exclusions where applicable;
- trace/correlation identity.

Cross-project destinations:
- OPS for EventMesh/Traceability transport;
- QM for read-only quality validation;
- COMP for applicability/assessment evidence.

Exit: evidence is sufficient to explain why an asset was scored/ranked or excluded without reconstructing hidden frontend/provider logic.

## Priority summary

| Priority | Item | Reason |
|---|---|---|
| P1 | FIN-17 ranking consolidation | current FE-local ordering conflicts with V2 boundary |
| P1 | VC numbering migration coordination | current SPT/QM semantics conflict with V2 labels |
| P1 | DATA validated-input contract | prevents provider/DQ boundary ambiguity |
| P2 | FIN-19 capability completeness | static provider inventory exists, semantic capability equivalence needs mapping |
| P2 | QM exact structure/source | required before structural parity can be VERIFIED |
| P3 | automated drift checks | useful after ownership/contracts stabilize |