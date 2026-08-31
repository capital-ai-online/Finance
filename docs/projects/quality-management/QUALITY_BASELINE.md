# CAPITAL-AI-QM — Quality Baseline

**Observed at:** 2026-08-31  
**Observed main:** `0f5d4f23841ef3824dec8447f700de0cd9614f16`  
**Open PR correlation at baseline:** no open PRs observed  
**QM branch:** `docs/qm-project-consolidation-20260831`  
**Project contract:** `CAPITAL-AI-QM-V2` v2.1

## V2 ownership baseline

CAPITAL-AI-QM is an independent cross-cutting Quality/Assurance function.

```text
primary_value_chain_ownership: []
executes_as_primary_owner: []
observes: VC-01..VC-18
remediation_execution_local: false
```

Primary Owner routing:

| VC | Owner | VC | Owner |
|---|---|---|---|
| VC-01 | `CAPITAL-AI-CLIENT` | VC-10 | `CAPITAL-AI-DATA` |
| VC-02 | `CAPITAL-AI-OPS` | VC-11 | `CAPITAL-AI-DATA` |
| VC-03 | `CAPITAL-AI-DOC` | VC-12 | `CAPITAL-AI-FINTECH` |
| VC-04 | `CAPITAL-AI-OPS` | VC-13 | `CAPITAL-AI-FINTECH` |
| VC-05 | `CAPITAL-AI-GOV` | VC-14 | `CAPITAL-AI-FINTECH` |
| VC-06 | `CAPITAL-AI-OPS` | VC-15 | `CAPITAL-AI-FINTECH` |
| VC-07 | `CAPITAL-AI-OPS` | VC-16 | `CAPITAL-AI-FINTECH` |
| VC-08 | `CAPITAL-AI-OPS` | VC-17 | `CAPITAL-AI-FINTECH` |
| VC-09 | `CAPITAL-AI-DATA` | VC-18 | `CAPITAL-AI-OPS` |

## Authority findings

| Artifact | Finding | V2 QM action |
|---|---|---|
| `ADR-0096` | Accepted Governance Control Plane and 18-stage current-state model | retain; QM remains subordinate |
| `ESS-0005` | canonical read-only Quality Center | retain/amend in place; no competing ESS or runtime |
| `ADR-0103` | proposed QM project authority | clarify as independent assurance, not foreign remediation execution |
| `ADR-0016` | historical ESS component-specification rationale | retain as history |
| `ADR-0073` / `ADR-0047` | CI topology / pre-merge gate authority | retain; QM consumes evidence only |
| `ESS-0012` | Documentation Governance authority | retain; QM verifies evidence only |
| `docs/frontend/FRONTEND_ARCH.md` | Frontend structure/presentation authority | retain; QM measures conformance/performance only |
| `FintechValueChainQualityProjection.ts` | existing 18-stage read-only projection | reuse; no new value-chain model |
| `securityPerformancePriorityRemediation.test.ts` | existing frontend performance/bundle regression evidence | reuse under `QM-05`/`QM-07` |

## Architecture plausibility result

No second Validator Registry, EventBus, Auth controller, Router/Public Shell, CI topology, release authority, Data Quality runtime, Market Data routing, UAI execution, scoring/ranking authority, frontend architecture or value-chain architecture is required for CAPITAL-AI-QM.

The consolidation is therefore an **assurance/evidence sidecar change**, not a new application architecture.

Existing responsibility split:

- Governance/lifecycle/supersession -> ADR-0096 and Governance registries;
- Quality contracts/threshold authority -> ESS-0001-CONTRACTS Chapter 12;
- Quality execution/aggregation -> ESS-0005 and `src/platform/Quality`;
- CI topology/required checks -> ADR-0073 / ADR-0047;
- Frontend presentation -> `FRONTEND_ARCH`;
- Data / Financial runtime / Scoring / Ranking -> existing domain authorities;
- technical remediation -> Primary Owner project of the affected VC stage;
- cross-cutting findings/evidence/verification -> proposed CAPITAL-AI-QM V2.

## Workstream migration result

The pre-V2 draft `QM-0..QM-9` model is replaced by:

- `QM-01` Quality Criteria;
- `QM-02` Quality Gates;
- `QM-03` Quality Measurement;
- `QM-04` Findings;
- `QM-05` Regression;
- `QM-06` Technical Debt;
- `QM-07` Evidence;
- `QM-08` Continuous Improvement.

The old `HANDED_OFF_TO_QM` execution-transfer semantics are retired before activation. V2 uses:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

QM retains finding/verification status; the target project retains remediation implementation status.

## Supersession policy

No existing active ADR needs to be superseded by ADR-0103 at this baseline. Old documents are not deleted merely because they are old. Under ADR-0096:

1. retain historical decisions for traceability;
2. supersede only an actual authority overlap;
3. require an explicit supersedes edge and impact package;
4. use suspended/historical/legacy-redirect for non-authorizing remnants;
5. never infer authority from recency alone.

Current outcome:

- retain ADR-0016 as historical design rationale;
- retain ADR-0047/ADR-0073 as CI authorities;
- retain ADR-0096 as Governance Control Plane;
- retain/amend ESS-0005 in place;
- retain ESS-0012 as Documentation Governance;
- do not introduce any new DATA/Runtime/Scoring/Release authority under QM.

## Evidence baseline

The existing Quality Center already supports mandatory validators, gates, score evidence, coverage, technical debt, documentation consistency, EventMesh publication and 18-stage value-chain projection.

A file/test/workflow's presence is not execution evidence. Any result not verified against its exact commit/runtime/environment identity is `NOT_AVAILABLE`.

Every confirmed finding must include `finding_id`, `affected_vc_stage`, `target_project`, `severity`, `evidence`, `required_remediation`, `verification_gate` and lifecycle `status`.

## Advisory state-of-the-art baseline

External standards remain review lenses only until an existing CAPITAL-AI authority explicitly adopts them. They do not create a second governance hierarchy.

| External source | Review use | Boundary |
|---|---|---|
| OWASP ASVS 5.0.0 | security-verification taxonomy | Security/domain Primary Owner performs remediation |
| NIST SP 800-218 SSDF v1.1 | secure-development benchmark | no automatic import of draft requirements |
| SLSA v1.2 | provenance/attestation crosswalk | CI/Release authorities retain topology/control |
| WCAG 2.2 | accessibility verification lens | Frontend/Compliance authorities retain policy/implementation |
| Core Web Vitals | reproducible field/lab performance evidence | external values remain advisory unless internally adopted |
| OpenTelemetry browser conventions | telemetry interoperability reference | no second telemetry/EventBus; unstable schemas remain non-normative |

## V2 validation baseline

- QM remains independent: **DESIGN PASS**.
- productive hot-path authority in QM: **NONE BY DESIGN**.
- DATA ownership in QM: **NONE**.
- VC-01..VC-18 routing: **DEFINED**.
- missing evidence semantics: **NOT_AVAILABLE PRESERVED**.
- foreign technical remediation in QM roadmap: **REMOVED BY V2 MIGRATION**.
- Quality Center mutation authority: **NONE**.

These are design/baseline findings only; they do not claim unexecuted CI/runtime checks as PASS.