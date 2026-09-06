# CAPITAL-AI-COMP — Project Roadmap

**Project:** `CAPITAL-AI-COMP`  
**Project folder:** `docs/projects/compliance/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Compliance assessment and regulatory traceability  
**Status:** ACTIVE EXECUTION PROJECTION — LOCAL ROADMAP BACKLOG CONSOLIDATED / EXTERNAL GATES PRESERVED  
**Detailed roadmap:** `docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md`  
**Trust root:** `/AGENTS.md`

## Purpose

This roadmap is the thin owner-side project execution surface required by the canonical `docs/projects/` model. It does not duplicate the detailed Compliance roadmap, inventories, mappings, traceability, work packages or reports.

Detailed Compliance state remains canonical in `docs/compliance/CAPITAL-AI-COMP/**`.

## Project-surface controls

| Control | Target state | Evidence / gate |
|---|---|---|
| `COMP-PROJ-01` | Canonical `docs/projects/compliance/` navigation exists | `README.md` + `ROADMAP.md` reference existing Compliance sources |
| `COMP-PROJ-02` | No productive PVC ownership | no Compliance project artifact allocates a productive `PVC-*` stage |
| `COMP-PROJ-03` | Authority separation remains intact | mapped requirements reference existing `AUTH-*` / `CTRL-*` / ADR / ESS rather than creating duplicates |
| `COMP-PROJ-04` | Remediation remains owner-routed | findings identify the affected Primary Owner / `PVC-*` where determinable and required return evidence |
| `COMP-PROJ-05` | Evidence-based assessment remains fail-closed | missing/stale required evidence cannot be assessed as PASS |

## Current detailed-roadmap state

The detailed V2.1 model has exactly eight workstreams. The current closeout consolidates their locally executable remainder into one coherent Compliance work item:

| WP | State |
|---|---|
| `COMP-01` Applicability | `EXECUTED_CONTINUOUS` |
| `COMP-02` Requirements | `DONE_ON_MAIN / CONTINUOUS` |
| `COMP-03` Control Mapping | `DONE_ON_MAIN` |
| `COMP-04` Assessment | `DONE_ON_MAIN` — 23/23 READY_NOW assessed by Human-merged PR #761 |
| `COMP-05` Findings | `EXECUTED_CURRENT` |
| `COMP-06` Evidence | `EXECUTED_HELD` |
| `COMP-07` Remediation Handoff | `EXECUTED_HELD` |
| `COMP-08` Continuous Compliance | `EXECUTED_CONTINUOUS` |

`EXECUTED_HELD` is a truthful completion of the local Compliance step, not closure of the external dependency. Provider/legal evidence, Human AI-literacy evidence, OPS recovery evidence, Documentary/Governance registry work and DATA/FINTECH/traceability evidence remain with their competent owners/gates.

## Execution invariants

- Compliance maps and assesses; it does not redefine repository authority.
- Productive remediation remains with the affected Primary Owner.
- Legal applicability and accepted-risk decisions remain Human/Legal/Owner-controlled where required.
- Security verification remains Security-owned; Quality verification remains QM-owned.
- Technical financial-chain identifiers and organizational `PVC-*` routing remain separate namespaces.
- Current Compliance handoffs use `PVC-*`; historical `VC-*` markers are migration history only.
- Merge, deployment and protected external mutations retain their existing Human/Owner and repository gates.

## Current project dependencies

| Target | Relationship |
|---|---|
| `CAPITAL-AI-GOV` | consumes canonical authority/control identities; owns shared Governance-registry decisions |
| `CAPITAL-AI-DOC` | owns Documentary lifecycle/registry implementation where applicable |
| `CAPITAL-AI-SEC` | supplies independent Security evidence/findings where compliance-relevant |
| `CAPITAL-AI-QM` | supplies independent Quality evidence/findings where compliance-relevant |
| `CAPITAL-AI-OPS` | owns `PVC-08` recovery/continuity evidence and `PVC-18` traceability transport portions |
| `CAPITAL-AI-DATA` / `CAPITAL-AI-FINTECH` | return provenance/lineage/quality/scoring-chain evidence within their productive scopes |
| Human/Legal Owner | decides legal applicability, role/classification and accepted-risk questions where required |

## Validation

For project-surface changes, the smallest sufficient validation is:

1. current `/AGENTS.md` and current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no second Compliance or Governance authority introduced;
5. all references target existing Compliance/project artifacts;
6. shared Governance-owned registry paths are not modified by this owner branch;
7. branch synchronized with current `main` before PR readiness;
8. current/historical `PVC-*` vs `VC-*` semantics do not conflict;
9. PR creation separately approved for the exact main/head snapshot and intended title.

Documentation-only project-surface work does not by itself require a pre-PR Runtime build; hosted repository checks after PR creation remain authoritative for merge readiness.

## Completion condition

The bounded Compliance roadmap closeout is complete after Human merge when:

- the detailed roadmap and project surface agree that all eight local workstream steps have been processed;
- no locally actionable stale finding/handoff remains mislabeled as current;
- external evidence/legal/foreign-owner dependencies remain explicit rather than falsely closed;
- no productive PVC ownership or foreign implementation authority has moved to Compliance;
- required hosted checks for the exact PR head have passed.

Continuous Compliance itself remains active by design; future material changes re-trigger `COMP-08` and the affected upstream workstreams.
