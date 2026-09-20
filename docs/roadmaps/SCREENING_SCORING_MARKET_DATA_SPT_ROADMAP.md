# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** `SC-MD-SPT-0001`  
**Version:** `1.3.0`  
**Status:** ACTIVE — CANONICAL FINANCIAL VALUE-CHAIN AUTHORITY  
**Stand:** 2026-08-31  
**Current-state rule:** exact `main`/production SHAs are validation-time evidence, not permanent document authority  
**Last observed synchronization baseline:** `main@1f55340d89178fb5c1ab735242f42c263918b692`  
**Owner:** SvenKulessa

## 1. Purpose

`SC-MD-SPT-0001` is the Single Point of Trust for the CAPITAL-AI Screening / Scoring / Market-Data technical financial value chain. It consolidates Market Data, Evidence, Data Quality, Scoring, Ranking/Eligibility, delivery and read-only cross-cutting Quality/Traceability/Documentary projections without creating a second runtime, scoring, evidence, governance or documentation authority.

The repository's organizational Project Value Chain uses the separate qualified `PVC-*` namespace defined by `docs/projects/PROJECT_VALUE_CHAIN.md`. Project routing does not renumber or supersede the technical `VC-*` stages in this roadmap.

## 2. Authority model

| Domain | Canonical authority / implementation | Boundary |
|---|---|---|
| Asset catalog / provenance | ADR-0032 | catalog metadata is not verified financial evidence |
| Provider data plane | ADR-0041 + ESS-0016 | provider-neutral acquisition, provenance, freshness, rate-limit/cache/resilience controls |
| Verified display | `verified-asset-display/1.0.0` | read-only presentation/research projection; never execution-price or scoring authority |
| Scoring | ADR-0087 + `ScoringModelRegistry` + `ScoringDispatcher` | only productive multi-asset scoring exit |
| FinTech Core workflow composition | ADR-0099 | workflow/OrderIntent/Risk/Paper composition; cannot replace ADR-0087 scoring authority |
| CAPITAL-AI-FINTECH project execution | `docs/projects/fintech/ROADMAP.md` | Primary Project Owner for organizational `PVC-09..17`; reuses technical authorities and does not renumber this SPT |
| DeFiLlama | ADR-0100 | evidence-only; no direct score/dispatcher bypass |
| Ranking / eligibility | canonical Ranking contracts/services | consumes canonical score/evidence; no caller-provided rank authority |
| Quality | ESS-0005 + `FintechValueChainQualityProjection` | read-only structural/evidence validation; non-authorizing |
| Event / Traceability / Supervisor | existing ESS/EventMesh/Traceability/Supervisor authorities | evidence, audit and observation; no score mutation |
| Documentary | ESS-0010/0012 + ADR-0097 | read-only documentation/evidence sidecar at technical VC-17; no financial runtime authority |
| Vocabulary | ESS-0017 + ADR-0078 | read-only wording/concept projection across all 18 technical stages |
| Release/deployment | existing Release/DevelopmentChain authorities | separate from financial decision path |

## 3. Canonical 18-stage technical value chain

The machine-readable Quality projection projects this technical financial chain into exactly 18 stages:

```text
VC-01  Request Intake
  ↓
VC-02  Identity / Access
  ↓
VC-03  Entitlement / Usage Gate
  ↓
VC-04  Asset Discovery / Universal Asset Identity
  ↓
VC-05  Orchestration / Runtime Guard
  ↓
VC-06  Market-Data / Evidence Acquisition
  ↓
VC-07  Data Validation / Provenance / DQ
  ↓
VC-08  Verified Display / Research Lane
  ↓
VC-09  Classification + Feature Contract
  ↓
VC-10  ScoringModelRegistry
  ↓
VC-11  ScoringDispatcher
  ↓
VC-12  Domain Executor Adapter
  ↓
VC-13  CanonicalScoreResult + execution lineage
  ↓
VC-14  Confidence / DQ Composite
  ↓
VC-15  Ranking Comparability Gate
  ↓
VC-16  Ranking / Eligibility / SLO
  ↓
VC-17  EventMesh / Traceability / Supervisor
  ↓
VC-18  API / UI / Alerts / downstream evidence
```

This technical numbering remains current. Historical evidence recorded under older stage numbers remains immutable historical evidence and is not rewritten.

### Organizational project ownership

Current main separately defines:

- `PVC-09..17` -> `CAPITAL-AI-FINTECH`;
- `PVC-09..17` -> `CAPITAL-AI-FINTECH`;
- `PVC-18` -> `CAPITAL-AI-OPS`.

This qualified project namespace resolves the earlier V2 project-number ambiguity. No technical SPT or Quality stage renumbering is required merely to express project ownership.

## 4. Financial-runtime invariants

1. **One productive scoring path**  
   `ScoringModelRegistry -> ScoringDispatcher -> registered Domain Executor -> CanonicalScoreResult`.

2. **No Demo / no fabricated evidence**  
   Missing, stale or invalid-provenance data may become `DATA_UNAVAILABLE`, `NOT_COMPUTABLE`, degraded or denied; it must never become synthetic evidence, an invented score, a neutral filler or a fabricated PASS.

3. **Catalog ≠ Evidence**  
   Metadata discovery and Universal Asset Identity cannot by themselves satisfy evidence/scoring eligibility.

4. **Provider evidence is not scoring authority**  
   DeFiLlama and every other provider remain upstream of Evidence/DQ and the existing Scoring Registry/Dispatcher boundary.

5. **Research/challenger ≠ productive champion**  
   Research/challenger models remain non-executable until a separately governed promotion satisfies existing Evidence/DQ/model-validation requirements.

6. **Presentation does not mutate finance**  
   UI, PDF, Social Media, Vocabulary and Documentary surfaces may project states but cannot modify score, confidence, ranking, eligibility, OrderIntent, settlement, release or deployment decisions.

7. **Quality is read-only**  
   Quality may detect broken artifact/evidence connections and hot-path dependency violations but cannot authorize a financial result, merge or production mutation.

8. **Project routing is non-authorizing**  
   `PVC-*` ownership selects the project responsible for work; it does not replace ADR/ESS/technical contract authority.

## 5. Verified Display / Research lane

Technical VC-08 is intentionally separated from the canonical scoring lane. `verified-asset-display/1.0.0` may expose verified provider/evidence context for deterministic research, but it is not execution-price or scoring authority and cannot bypass entitlement, provenance or DQ controls.

## 6. FinTech relationship

FinTech Core composes financial workflows downstream/adjacent to the canonical scoring/evidence authorities. ADR-0087 remains productive scoring authority and ADR-0099 remains workflow-composition authority.

`docs/projects/fintech/ROADMAP.md` is the canonical organizational execution roadmap for CAPITAL-AI-FINTECH. It owns project work across `PVC-09..17` while reusing this technical SPT, ADR-0087 and current runtime contracts.

Provider/data ingress and DQ for `PVC-09..11` are FINTECH-owned under the former DATA-surface supersession; EventMesh/Traceability project ownership remains OPS; Frontend remains a consumer; Quality, Security and Compliance remain cross-cutting.

Security requirements from CAPITAL-AI-SEC PR #631 are integrated in `docs/projects/fintech/SECURITY_HANDOFFS.md`. Security owns findings and independent verification; FINTECH implements only concrete FINTECH-owned remediation and cannot self-set Security VERIFIED/CLOSED.

## 7. Meme / DeFi and DeFiLlama

Current Meme/DeFi research scoring remains inside the research/challenger boundary. DeFiLlama remains ADR-0100 evidence-only. Provider evidence must pass identity, provenance, freshness and DQ contracts before score eligibility.

## 8. Quality, Vocabulary and Documentary projections

### Quality

`src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` is the machine-readable structural projection of the technical 18-stage SPT chain. The new organizational `PVC-*` namespace does not require that technical projection to be renumbered.

### Vocabulary

`src/platform/Vocabulary` remains a read-only wording/concept projection with no financial-decision or mutation authority.

### Documentary

Documentary remains attached at technical `VC-17-EVENT-TRACEABILITY-SUPERVISOR` as a read-only documentation/evidence sidecar and cannot import/call financial hotpaths for mutation.

## 9. Delivery surfaces and ranking consumer boundary

Technical VC-18 includes API, UI, alerts and downstream evidence/export surfaces. Delivery may expose canonical results and provenance but cannot recalculate or replace upstream authority decisions.

The current `RankingBoard` still performs local READY-score ordering for Top/Worst display. Organizationally Ranking / Decision Support is FINTECH `PVC-17`; the FE-side cleanup is recorded as a separate structured cross-project dependency in `docs/projects/fintech/CROSS_PROJECT_DEPENDENCIES.md`. This does not reinterpret technical VC-17 as Ranking.

## 10. Version and current-state synchronization

- platform version authority: `package.json#version`;
- exact current Main/production SHA: resolved at validation/evidence time;
- this roadmap version describes semantic technical financial-chain state, not Git commit identity;
- project-routing ownership is defined separately by `docs/projects/PROJECT_VALUE_CHAIN.md`;
- Quality/Vocabulary/Documentary manifests reference this SPT by stable ID rather than copying independent technical authority.

A change to technical stage semantics must update this document and applicable machine-readable consumers in the same governed change or explicitly fail validation as drift. A project-ownership change in `PVC-*` does not itself constitute a technical stage-semantic change.

## 11. Historical disposition

Former PR baselines and older stage bindings remain Git/evidence history, not current authority. The initial CAPITAL-AI-FINTECH V2 branch-local target-VC project labels are retained only as historical migration context; current project ownership uses `PVC-*`.

## 12. Definition of Done for homogeneous financial changes

A change is value-chain-ready only when:

- no second Scoring Registry/Dispatcher/Evidence/DQ/Queue/Governance architecture is introduced;
- new provider/runtime behavior is mapped to an existing authority or an explicit new bounded authority when genuinely required;
- current technical Quality projection and SPT agree;
- project routing uses qualified `PVC-*` without overloading technical `VC-*`;
- missing/stale evidence fails closed;
- Security requirements remain independently verifiable where applicable;
- current `main` and open PRs are re-correlated immediately before PR creation;
- hosted CI validates the exact remote PR head where required;
- Human/CODEOWNER performs the merge decision.