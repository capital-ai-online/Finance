# CAPITAL-AI — Quality Management

**Project ID:** `CAPITAL-AI-QM`  
**Prompt:** `CAPITAL-AI-QM-V2` v2.1  
**Role:** `CROSS_CUTTING_QUALITY_ASSURANCE`  
**Lifecycle:** `PROPOSED — ACTIVATES AFTER ADR-0103 ACCEPTANCE / HUMAN MERGE`  
**Canonical project contract:** [`PROJECT_CONTRACT_V2.md`](./PROJECT_CONTRACT_V2.md)  
**Current status source:** [`docs/architecture/ROADMAP.md`](../../architecture/ROADMAP.md)  
**Local roadmap:** [`ROADMAP.md`](./ROADMAP.md) — compatibility/detail pointer only

## Live-roadmap status boundary

Current QM work state, dependencies, execution grouping and parallel-worker eligibility are maintained in the repository Live Roadmap. Project-local roadmap/work-package files do not maintain a competing active queue. Quality contracts and evidence remain local to this folder.

**Routing metadata:** Owner `CAPITAL-AI-QM` · Folder `docs/projects/quality-management/` · Label `project:CAPITAL-AI-QM` · productive PVC ownership `none`.

## Purpose

CAPITAL-AI-QM is the independent Quality/Assurance function for the repository. It observes and evaluates all 18 canonical value-chain stages, but owns **none** of them as productive Primary Owner.

QM measures quality, executes authorized Quality gates and validators, records findings/evidence/technical debt, assesses regression risk and verifies remediation. Technical remediation is implemented by the Primary Owner of the affected VC stage in that project's own branch/PR.

## Authority chain

```text
Human / Owner
  -> ADR / ESS / Contracts
  -> ADR-0096 Governance Control Plane
  -> Primary Owner / Domain Authority
  -> CAPITAL-AI-QM independent assurance
  -> ESS-0005 Quality Center / existing validators / evidence adapters
  -> Quality finding
  -> [QUALITY_HANDOFF -> TARGET_PROJECT | VC-NN]
  -> Primary Owner remediation
  -> QM verification gate
```

Normative domain authority remains at canonical locations. QM does not duplicate ADR, ESS, Data, Scoring, Ranking, Routing, Release, Runtime or Product authorities.

## Primary value-chain ownership

```text
primary_value_chain_ownership: []
executes_as_primary_owner: []
observes: VC-01 through VC-18
```

| VC | Primary Owner |
|---|---|
| VC-01 | `CAPITAL-AI-CLIENT` |
| VC-02 | `CAPITAL-AI-OPS` |
| VC-03 | `CAPITAL-AI-DOC` |
| VC-04 | `CAPITAL-AI-OPS` |
| VC-05 | `CAPITAL-AI-GOV` |
| VC-06 | `CAPITAL-AI-OPS` |
| VC-07 | `CAPITAL-AI-OPS` |
| VC-08 | `CAPITAL-AI-OPS` |
| VC-09 | `CAPITAL-AI-FINTECH` |
| VC-10 | `CAPITAL-AI-FINTECH` |
| VC-11 | `CAPITAL-AI-FINTECH` |
| VC-12 | `CAPITAL-AI-FINTECH` |
| VC-13 | `CAPITAL-AI-FINTECH` |
| VC-14 | `CAPITAL-AI-FINTECH` |
| VC-15 | `CAPITAL-AI-FINTECH` |
| VC-16 | `CAPITAL-AI-FINTECH` |
| VC-17 | `CAPITAL-AI-FINTECH` |
| VC-18 | `CAPITAL-AI-OPS` |

## Local QM scope

QM owns Quality Criteria, Quality Measurement, Quality Gates, Quality Findings, Quality Evidence, Technical Debt, Regression Assessment, Continuous Improvement Tracking and the read-only Quality Center orchestration defined by ESS-0005.

QM MUST NOT perform Market Data mutation, UAI execution, Data Quality runtime ownership, Scoring mutation, Ranking mutation, provider routing, Release approval or Production mutation.

## Eight workstreams

- `QM-01` Quality Criteria
- `QM-02` Quality Gates
- `QM-03` Quality Measurement
- `QM-04` Findings
- `QM-05` Regression
- `QM-06` Technical Debt
- `QM-07` Evidence
- `QM-08` Continuous Improvement

## Finding and handoff rule

Every confirmed finding has an affected VC stage and target project. The required cross-project marker is:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

QM may identify, specify and prioritize required remediation, but `remediation_execution_local=false`. The target project implements; QM verifies the resulting evidence.

## Canonical value-chain projection

`src/platform/Quality/ValueChain/FintechValueChainQualityProjection.ts` remains the existing 18-stage read-only sidecar. No productive hot path may gain a direct Quality dependency. Missing evidence remains `NOT_AVAILABLE`.

## Navigation

- [`PROJECT_CONTRACT_V2.md`](./PROJECT_CONTRACT_V2.md) — V2.1 ownership, handoff and PR contract.
- [`../../architecture/ROADMAP.md`](../../architecture/ROADMAP.md) — current Live Roadmap status for QM and other migrated projects.
- [`ROADMAP.md`](./ROADMAP.md) — compatibility/detail pointer; no independent executable queue.
- [`TAKEOVER_INDEX.md`](./TAKEOVER_INDEX.md) — source/referral mapping and Primary Owner routing.
- [`QUALITY_BASELINE.md`](./QUALITY_BASELINE.md) — repository/authority baseline.
- [`METRICS_AND_EVIDENCE.md`](./METRICS_AND_EVIDENCE.md) — evidence and finding schema.
- [`runbooks/`](./runbooks/) — repeatable assurance procedures.
- [`evidence/`](./evidence/) — append-only evidence guidance.

## Higher authorities retained

- `ESS-0001-CONTRACTS Chapter 12` — validator/gate/metric contracts.
- `ESS-0005` — technical Quality Center boundary.
- `ADR-0096` — Governance Control Plane and supersession rules.
- `ADR-0073` / `ADR-0047` — CI and pre-merge authority.
- `AGENTS.md` — repository-wide agent/PR execution controls.
- `ADR-0103` — proposed QM assurance coordination authority.

`QUALITY READY` or a verified finding closure is Quality evidence only; it is never merge, release, deployment or production authorization.