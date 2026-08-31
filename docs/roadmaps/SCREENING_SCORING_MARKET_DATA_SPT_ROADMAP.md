# Screening · Scoring · Market Data — Single Point of Trust Roadmap

**Document ID:** `SC-MD-SPT-0001`  
**Version:** `1.3.0`  
**Status:** ACTIVE — CANONICAL FINANCIAL VALUE-CHAIN AUTHORITY  
**Stand:** 2026-08-31  
**Current-state rule:** exact `main`/production SHAs are validation-time evidence, not permanent document authority  
**Last observed synchronization baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Owner:** SvenKulessa

## 1. Purpose

`SC-MD-SPT-0001` is the Single Point of Trust for the CAPITAL-AI Screening / Scoring / Market-Data financial value chain. It consolidates Market Data, Evidence, Data Quality, Scoring, Ranking/Eligibility, delivery and the read-only cross-cutting Quality/Traceability/Documentary projections without creating a second runtime, scoring, evidence, governance or documentation authority.

Historical PR numbers and SHAs remain traceability evidence only. In particular, PR #458 is historical lineage and no longer defines the current repository baseline.

## 2. Authority model

| Domain | Canonical authority / implementation | Boundary |
|---|---|---|
| Asset catalog / provenance | ADR-0032 | catalog metadata is not verified financial evidence |
| Provider data plane | ADR-0041 + ESS-0016 | provider-neutral acquisition, provenance, freshness, rate-limit/cache/resilience controls |
| Verified display | `verified-asset-display/1.0.0` | read-only presentation/research projection; never execution-price or scoring authority |
| Scoring | ADR-0087 + `ScoringModelRegistry` + `ScoringDispatcher` | only productive multi-asset scoring exit |
| FinTech Core workflow composition | ADR-0099 | workflow/OrderIntent/Risk/Paper composition; cannot replace ADR-0087 scoring authority |
| CAPITAL-AI-FINTECH V2 ownership projection | `docs/fintech/CAPITAL-AI-FINTECH/ROADMAP.md` | target primary owner for Feature Engineering -> Ranking execution; reuses current authorities and does not silently renumber current VC stages |
| DeFiLlama | ADR-0100 | evidence-only; no direct score/dispatcher bypass |
| Ranking / eligibility | canonical Ranking contracts/services | consumes canonical score/evidence; no caller-provided rank authority |
| Quality | ESS-0005 + `FintechValueChainQualityProjection` | read-only structural/evidence validation; non-authorizing |
| Event / Traceability / Supervisor | existing ESS/EventMesh/Traceability/Supervisor authorities | evidence, audit and observation; no score mutation |
| Documentary | ESS-0010/0012 + ADR-0097 | read-only documentation/evidence sidecar at VC-17; no financial runtime authority |
| Vocabulary | ESS-0017 + ADR-0078 | read-only wording/concept projection across all 18 stages |
| Release/deployment | existing Release/DevelopmentChain authorities | separate from financial decision path |

## 3. Canonical 18-stage value chain

The current machine-readable Quality projection is authoritative only for structural/evidence validation and projects this financial chain into exactly 18 stages:

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

This numbering supersedes the older 14-stage projection as **current state**. Historical evidence recorded under older stage numbers remains immutable historical evidence and is not rewritten.

### V2 ownership migration projection

`CAPITAL-AI-FINTECH-V2` defines a target department projection in which target VC-12..VC-17 cover Feature Engineering through Ranking/Decision Support and target VC-18 is handed to CAPITAL-AI-OPS. Those target labels do **not** overwrite the current stage IDs above in this FinTech-only change because the current Quality projection and other cross-project consumers still encode the present semantics.

The correlated migration record is `docs/fintech/CAPITAL-AI-FINTECH/mappings/VALUE_CHAIN_OWNERSHIP.md`. Canonical renumbering requires synchronized DATA/QM/OPS/SPT updates and must not be performed as an isolated FinTech mutation.

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
   Meme/DeFi research models remain non-executable challengers until a separately governed promotion satisfies existing Evidence/DQ/model-validation requirements.

6. **Presentation does not mutate finance**  
   UI, PDF, Social Media, Vocabulary and Documentary surfaces may project states but cannot modify score, confidence, ranking, eligibility, OrderIntent, settlement, release or deployment decisions.

7. **Quality is read-only**  
   Quality may detect broken artifact/evidence connections and hot-path dependency violations but cannot authorize a financial result, merge or production mutation.

## 5. Verified Display / Research lane

VC-08 is intentionally separated from the canonical scoring lane. `verified-asset-display/1.0.0` may expose verified provider/evidence context for deterministic research such as Buffett analysis, but:

- it is `executionPriceEligible=false`;
- it does not create `CanonicalScoreResult`;
- it cannot bypass entitlement or provider provenance controls;
- manual model assumptions must remain labeled assumptions;
- missing fundamentals or market evidence never become invented values.

## 6. FinTech Core relationship

FinTech Core composes financial workflows downstream/adjacent to the canonical scoring/evidence authorities and currently includes FT-0 through FT-6B on `main`.

Protected relationships:

- ADR-0087 remains productive scoring authority;
- ADR-0099 remains FinTech Core workflow-composition authority;
- FT-5 Risk/Compliance decision records remain deterministic approval evidence;
- FT-6B OrderIntent binding remains PAPER-only and exact-decision-bound;
- `GUARDED_LIVE` / `PRODUCTION` expose no real-execution capability before the separate FT-7 architecture/security decision;
- existing persistence/queue authorities are reused rather than duplicated.

### CAPITAL-AI-FINTECH V2 relationship

`docs/fintech/CAPITAL-AI-FINTECH/ROADMAP.md` consolidates execution ownership for financial Feature Engineering, Scoring Models, Scoring Orchestration, Domain Executors, Canonical Scoring and Ranking/Decision Support. It is subordinate to the current authorities above and reuses rather than replaces them.

The project explicitly records foreign-domain work through `[CROSS_PROJECT_HANDOFF -> ...]` markers. Provider/data ingress and DQ remain DATA responsibilities; EventMesh/Traceability transport remains OPS; Frontend is a consumer only; Quality remains read-only.

## 7. Meme / DeFi and DeFiLlama

Current Meme/DeFi 0.3.0 research scoring is permitted only inside the existing research/challenger boundary. Effective feature/weight fingerprint lineage and correlation groups prevent silent additive double-counting.

DeFiLlama remains ADR-0100 evidence-only. TVL/fees/revenue evidence must pass existing identity, provenance, freshness and DQ contracts before any future score eligibility. No provider can directly emit a productive score or OrderIntent approval.

## 8. Quality, Vocabulary and Documentary projections

### Quality

`src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` is the machine-readable structural projection of these 18 stages. Its contract is read-only and explicitly non-authorizing. V2 stage-number migration is an explicit CAPITAL-AI-QM handoff and is not performed in this FinTech-only change.

### Vocabulary

`src/platform/Vocabulary` v1.8.0 projects governed wording/concepts across all 18 stages. It has `financialDecisionAuthority=false` and `mutationAuthority=false`; Documentary consumes the Vocabulary snapshot one-way.

### Documentary

Documentary is attached at `VC-17-EVENT-TRACEABILITY-SUPERVISOR` as `read-only-documentation-evidence-sidecar`. It is **not VC-19** and cannot import/call financial hotpaths for mutation.

ADR-0097 maintenance, semantic freshness and Archive Retention operate only on repository documentation/change evidence. Archive retention may classify bounded generated/transient duplicates for Owner review/deletion planning but cannot autonomously delete authorities/evidence or mutate financial runtime.

## 9. Delivery surfaces

VC-18 includes API, UI, alerts and downstream evidence/export surfaces. Delivery may expose canonical financial results and provenance but cannot recalculate or replace upstream authority decisions.

The current `RankingBoard` still performs local READY-score ordering for display. Under the V2 target boundary this is recorded as `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FE | VC-17]`; it is not silently accepted as a second productive ranking authority and is not modified in the FinTech project PR.

AI-generated explanatory content, where used, is analysis/presentation only. Retrieval context alone does not prove claim-level grounding or citation completeness and cannot become financial evidence.

## 10. Version and current-state synchronization

- platform version authority: `package.json#version`;
- exact current Main/production SHA: resolved at validation/evidence time;
- this roadmap version describes semantic financial-chain state, not Git commit identity;
- DevelopmentChain current state is projected separately by `docs/architecture/ROADMAP.md`;
- Quality/Vocabulary/Documentary manifests must reference this SPT by stable ID rather than copy independent stage authorities.

A merge that changes stage semantics must update this document and the machine-readable projection/consumers in the same governed change or explicitly fail validation as drift. The V2 FinTech branch intentionally records the stage-semantic migration as pending because foreign project changes are prohibited in the same PR.

## 11. Historical disposition

The former PR-#458 baseline, its Verified Display implementation details and older VC-13/14-stage Documentary bindings remain available through Git history/evidence. They are historical lineage, not current authority.

The current ADR-0097 namespace belongs to the Documentary Maintenance Agent Control Loop. Any older abandoned draft that temporarily used ADR-0097 for a different feature is non-authorizing historical branch state and may not be used as a competing current ADR identity.

## 12. Definition of Done for homogeneous value-chain changes

A change is value-chain-ready only when:

- no second Scoring Registry/Dispatcher/Evidence/DQ/Queue/Governance architecture is introduced;
- new provider/runtime behavior is mapped to an existing authority or an explicit new bounded ADR when genuinely required;
- current Quality projection and component manifests agree on 18 stages;
- Documentary remains VC-17 sidecar until a separately synchronized target-stage migration changes that current contract;
- Vocabulary remains read-only projection;
- missing/stale evidence fails closed;
- current `main` and open PRs are re-correlated immediately before PR creation;
- hosted CI validates the exact remote PR head;
- Human/CODEOWNER performs the merge decision.