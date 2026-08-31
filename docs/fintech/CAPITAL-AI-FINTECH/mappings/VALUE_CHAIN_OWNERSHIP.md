# CAPITAL-AI-FINTECH — Value Chain Ownership Mapping

Baseline: `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`  
Target: `CAPITAL-AI-FINTECH-V2 v2.1`

## Current canonical projection

| Current ID | Current meaning |
|---|---|
| VC-09 | Classification + Feature Contract |
| VC-10 | ScoringModelRegistry |
| VC-11 | ScoringDispatcher |
| VC-12 | Domain Executor Adapter |
| VC-13 | CanonicalScoreResult + lineage |
| VC-14 | Confidence / DQ Composite |
| VC-15 | Ranking comparability gate |
| VC-16 | Ranking / Eligibility / SLO |
| VC-17 | EventMesh / Traceability / Supervisor |
| VC-18 | Delivery surfaces |

## V2 target ownership

| V2 ID | V2 target meaning | Target owner | Reuse | Status |
|---|---|---|---|---|
| VC-12 | Feature Engineering | CAPITAL-AI-FINTECH | versioned feature contracts | TARGET |
| VC-13 | Scoring Models | CAPITAL-AI-FINTECH | existing model registry entries | TARGET |
| VC-14 | Scoring Orchestration | CAPITAL-AI-FINTECH | existing Registry + Dispatcher | TARGET |
| VC-15 | Domain Analysis / Domain Executor | CAPITAL-AI-FINTECH | existing executor adapters | TARGET |
| VC-16 | Canonical Scoring | CAPITAL-AI-FINTECH | existing CanonicalScoreResult | TARGET |
| VC-17 | Ranking / Decision Support | CAPITAL-AI-FINTECH | existing ranking contracts/services | TARGET / PARTIAL |
| VC-18 | EventMesh / Traceability | CAPITAL-AI-OPS | current EventMesh/Traceability/Supervisor | TARGET / HANDOFF |

## Upstream

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09..VC-11]`

DATA remains owner of canonical ingress, evidence/provenance and DQ. FINTECH consumes an explicit validated-data input contract and does not absorb DATA runtime.

## Frontend

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]`

Current `RankingBoard.tsx` locally orders READY score rows for Top/Worst display. V2 target state requires FE to consume FINTECH-produced rank/order information rather than own ranking business logic.

## Operations

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]`

EventMesh/Traceability transport remains OPS-owned.

## Quality

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-12..VC-18]`

The read-only Quality projection currently uses different stage semantics. FINTECH does not edit the foreign QM runtime projection in this PR.

## Security

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEC | VC-12..VC-17]`

Security requirements remain external to FINTECH execution ownership.

## Compliance

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-COMP | VC-12..VC-17]`

Compliance applicability and assessment remain external to FINTECH execution ownership.

## Migration rule

V2 stage numbering becomes canonical only after correlated SPT, DATA, QM and OPS projections agree. Until then, current canonical stage IDs remain authoritative and V2 labels are a target migration projection.