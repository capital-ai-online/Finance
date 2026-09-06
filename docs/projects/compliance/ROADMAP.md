# CAPITAL-AI-COMP — Project Roadmap

**Project:** `CAPITAL-AI-COMP`  
**Project folder:** `docs/projects/compliance/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Compliance assessment and regulatory traceability  
**Status:** ACTIVE EXECUTION PROJECTION — LOCAL ROADMAP BACKLOG CONSOLIDATED ON MAIN / EXTERNAL GATES PRESERVED  
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

The detailed V2.1 model has exactly eight workstreams. Human-merged PR #768 consolidated their locally executable remainder on main; current correlation baseline is `main@dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67`:

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

`EXECUTED_HELD` is a truthful completion of the local Compliance step, not closure of the external dependency. Provider/legal evidence, Human AI-literacy evidence, measured OPS recovery evidence, Documentary lifecycle work and DATA/FINTECH end-to-end lineage evidence remain with their competent owners/gates.

### Post-merge implementation and evidence correlation

- PR #768 is Human/CODEOWNER-merged as `e61cb294e368135861c95911b8edfeee8b0de471`.
- Exact PR-head checks for `3f127cb8751d114e60672c9793b1dd6ea60cf33a` completed successfully: CI, Governance and Container Security.
- Human-merged PR #775 completed the Governance/PVC-05 decision for `COMP-GAP-008`: **NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT**. `docs/governance/document-registry.json` remains unchanged by design.
- Documentary/PVC-03 lifecycle treatment remains a separate foreign-owner return; Compliance reassesses `COMP-GAP-008` only when that return/evidence arrives.
- Human-merged OPS PR #776 implemented the `OPS-08-SEC-07` recovery evidence harness. Its own evidence record remains `EXECUTION_EVIDENCE_PENDING / SECURITY_UNVERIFIED`: scheduled backup runs, encrypted-artifact operating evidence, isolated restore drill, measured RPO/RTO and independent Security verification are not yet established. Therefore `COMP-GAP-007` / `REQ-COMP-032` remain evidence-held.
- Human-merged FINTECH PR #777 consolidated the FinTech roadmap. DATA `ValidatedDataInput/1.0.0` exists upstream, but FIN-12 remains `PARTIAL — UPSTREAM CONTRACT IMPLEMENTED` and FIN-20 remains `PARTIAL / OPEN`; the tested DATA→FINTECH feature mapping and exact score-to-rank lineage are not complete. Therefore `REQ-COMP-034` remains held/incomplete.
- No DATA-owned current-main change since the PR #775 baseline closes DATA-10/11 provenance/evidence obligations; current DATA roadmap still treats Evidence Management security evidence as open and provenance as an active requirement.
- `src/platform/Compliance` remains the implemented ADR-0012 / ESS-0006 technical boundary (scanner, router, store and evidence helpers).
- No current Compliance roadmap item or active finding authorizes a new local runtime/validator path. `CODE_DELTA_REQUIRED = NO` for this post-merge sync.

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
| `CAPITAL-AI-GOV` | Governance/PVC-05 side of `COMP-GAP-008` decided by PR #775: no Document Registry change required under current contract |
| `CAPITAL-AI-DOC` | owns remaining Documentary lifecycle treatment/evidence for `COMP-GAP-008` where applicable |
| `CAPITAL-AI-SEC` | supplies independent Security evidence/findings, including recovery-evidence verification where compliance-relevant |
| `CAPITAL-AI-QM` | supplies independent Quality evidence/findings where compliance-relevant |
| `CAPITAL-AI-OPS` | owns `PVC-08` recovery/continuity execution evidence and `PVC-18` traceability transport portions |
| `CAPITAL-AI-DATA` | owns `PVC-09..11` provider ingress, evidence identity, freshness, DQ and provenance upstream |
| `CAPITAL-AI-FINTECH` | owns `PVC-12..17`; must complete fail-closed DATA→feature mapping and exact scoring/ranking lineage evidence |
| Human/Legal Owner | decides legal applicability, role/classification and accepted-risk questions where required |

## Validation

For project-surface changes, the smallest sufficient validation is:

1. current `/AGENTS.md` and current `main` correlated;
2. open PR / writer / work-claim overlap checked;
3. project folder and branch slug match `docs/projects/README.md`;
4. no second Compliance or Governance authority introduced;
5. all references target existing Compliance/project artifacts;
6. Governance-owned registry paths and foreign OPS/DATA/FINTECH implementation paths are not modified by this owner branch;
7. branch synchronized with current `main` before PR readiness;
8. current/historical `PVC-*` vs `VC-*` semantics do not conflict;
9. PR creation separately approved for the exact main/head snapshot and intended title.

Documentation-only project-surface work does not by itself require a pre-PR Runtime build; hosted repository checks after PR creation remain authoritative for merge readiness.

## Completion condition

The bounded Compliance roadmap closeout is **complete on main** because:

- the detailed roadmap and project surface agree that all eight local workstream steps have been processed;
- Human-merged PR #768 placed the consolidated closeout on main and its exact-head CI, Governance and Container Security checks passed;
- Human-merged PR #775 has been consumed as the Governance decision return for `COMP-GAP-008` without inventing a registry mutation;
- Human-merged PRs #776 and #777 have been reassessed as foreign evidence returns without falsely promoting pending operational recovery or DATA→FINTECH lineage evidence to PASS;
- no locally actionable Compliance-owned stale finding/handoff remains mislabeled as current;
- external evidence/legal/foreign-owner dependencies remain explicit rather than falsely closed;
- no productive PVC ownership or foreign implementation authority moved to Compliance.

Continuous Compliance itself remains active by design; future material changes re-trigger `COMP-08` and the affected upstream workstreams.
