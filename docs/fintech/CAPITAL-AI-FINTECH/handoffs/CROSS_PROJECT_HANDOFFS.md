# CAPITAL-AI-FINTECH — Cross-Project Handoffs

Baseline: `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

This file records foreign-domain work only. It does not authorize or implement changes outside CAPITAL-AI-FINTECH.

## DATA

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DATA | VC-09..VC-11]`

### Purpose

Provide the explicit validated-data input boundary consumed by FINTECH Feature Engineering while retaining UAI/data acquisition, Evidence, provenance, freshness and Data Quality authority in DATA.

### Required outcome

- one canonical ingress contract for FINTECH;
- provider-specific ingestion remains upstream of the FINTECH boundary;
- provenance/freshness/DQ decisions remain attached to inputs;
- failed DQ cannot become a valid feature/score;
- no direct provider bypass from FINTECH model/executor code.

### FINTECH dependency

FIN-12 and FIN-19 cannot be marked fully VERIFIED until this boundary is explicit and correlated with current DATA ownership.

---

## OPS

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-18]`

### Purpose

Move the V2 target EventMesh / Traceability stage semantics to OPS ownership without moving scoring/ranking authority out of FINTECH.

### Required outcome

- existing EventMesh/Traceability/Supervisor runtime remains reused;
- FINTECH emits traceable scoring/ranking result evidence into existing transport contracts;
- operations health/incident behavior remains OPS-owned;
- target V2 VC-18 semantics become synchronized with the canonical SPT and QM projection before being declared canonical.

---

## Frontend

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]`

### Current evidence

`src/features/screening/ui/RankingBoard.tsx` currently filters/sorts READY score rows in the browser and derives Top/Worst lists.

### Required outcome

- browser consumes FINTECH-produced ranking/order metadata;
- browser does not calculate rank scores, comparability or business eligibility;
- unavailable/non-computable scores remain unavailable and are not inserted into ranking as neutral values;
- existing presentation, availability and design-token behavior is preserved.

### Dependency

FINTECH must first settle the single productive ranking result boundary under FIN-17. FE implementation belongs in a separate CAPITAL-AI-FE PR.

---

## Quality

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-QM | VC-12..VC-18]`

### Current evidence

`FintechValueChainQualityProjection` currently defines:

- VC-12 Domain Executor;
- VC-13 CanonicalScoreResult;
- VC-14 Confidence/DQ;
- VC-15 Ranking comparability;
- VC-16 Ranking/Eligibility/SLO;
- VC-17 EventMesh/Traceability/Supervisor;
- VC-18 Delivery.

This differs from V2 target numbering.

### Required outcome

After SPT/ownership migration is accepted, update the read-only Quality projection so stage names/owners/runtime references match the canonical target without creating Quality decision authority.

The exact `CAPITAL-AI-QM` project path is not present on the baseline; structural parity therefore remains unverified.

---

## Security

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-SEC | VC-12..VC-17]`

### Required outcome

- security controls for provider/API/secret access remain SEC-owned;
- FINTECH documentation contains no credentials;
- model/ranking execution preserves existing authorization and secure external-data boundaries.

---

## Compliance

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-COMP | VC-12..VC-17]`

### Required outcome

- regulatory applicability and compliance assessment remain COMP-owned;
- FINTECH supplies model ID/version, feature-contract, score lineage and ranking lineage needed for assessment;
- no roadmap statement is treated as proof of legal applicability or regulatory compliance.

## Handoff status summary

| Target | Status | Blocks |
|---|---|---|
| CAPITAL-AI-DATA | OPEN | FIN-12 full verification, provider/data boundary completion |
| CAPITAL-AI-OPS | OPEN | canonical V2 VC-18 projection |
| CAPITAL-AI-FE | OPEN | removal of frontend-local ranking |
| CAPITAL-AI-QM | OPEN | canonical V2 stage-number quality projection / exact structure parity |
| CAPITAL-AI-SEC | REFERENCE REQUIRED | future provider/model runtime changes |
| CAPITAL-AI-COMP | REFERENCE REQUIRED | model/ranking compliance assessment |

Foreign implementation remains outside this branch by design.