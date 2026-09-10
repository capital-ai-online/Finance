# CAPITAL-AI-COMP — Project Roadmap

**Project:** `CAPITAL-AI-COMP`  
**Project folder:** `docs/projects/compliance/`  
**Primary Productive PVC ownership:** `[]`  
**Role:** cross-cutting Compliance assessment and regulatory traceability  
**Status:** ACTIVE EXECUTION PROJECTION — LOCAL ROADMAP BACKLOG CONSOLIDATED / CURRENT RETURNS REASSESSED  
**Detailed roadmap:** `docs/compliance/CAPITAL-AI-COMP/CAPITAL_AI_COMPLIANCE_ROADMAP.md`  
**Current correlation baseline:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Correlation date:** `2026-09-10`  
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

The detailed V2.1 model has exactly eight workstreams. Human-merged PR #768 consolidated their locally executable remainder on main; the current return-reassessment baseline is `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`:

| WP | State |
|---|---|
| `COMP-01` Applicability | `EXECUTED_CONTINUOUS` |
| `COMP-02` Requirements | `DONE_ON_MAIN / CONTINUOUS` |
| `COMP-03` Control Mapping | `DONE_ON_MAIN` |
| `COMP-04` Assessment | `DONE_ON_MAIN` — 23/23 READY_NOW assessed; current Documentary return reassessed |
| `COMP-05` Findings | `EXECUTED_CURRENT` — `COMP-GAP-008` resolved by current-main evidence |
| `COMP-06` Evidence | `EXECUTED_HELD` — current DATA return consumed; external gates retained |
| `COMP-07` Remediation Handoff | `EXECUTED_HELD` — stale Documentary/Governance handoff terminalized; active foreign gates preserved |
| `COMP-08` Continuous Compliance | `EXECUTED_CONTINUOUS` — material returns re-correlated through 2026-09-10 |

`EXECUTED_HELD` is a truthful completion of the local Compliance step, not closure of an external dependency. Provider/legal evidence, Human AI-literacy evidence, measured OPS recovery evidence, OPS traceability transport, independent Security verification and FINTECH downstream lineage remain with their competent owners/gates.

### Current return reassessment — 2026-09-10

- PR #768 remains the Human/CODEOWNER-merged local COMP closeout; its exact PR-head CI, Governance and Container Security evidence remains retained historical implementation evidence.
- Governance PR #775 established that the `COMP-GAP-008` shared-registry surface requires **no Document Registry mutation under the current contract**.
- Documentary PR #838, merged as `96119f958cacbf35614747380a066b87fdb1ee40`, synchronized Document Registry/Hygiene with `docs/governance/control-plane/DOCUMENT_LIFECYCLE_POLICY.md`.
- Documentary PR #866, merged as `12ca12017916990e83ed213be781574c61808949`, returned the bounded `GOV-DOC-005` implementation: Markdown under `docs/` is accepted directly; only documentation outside `docs/` requires an exact registered exception. Current Compliance artifacts live canonically under `docs/compliance/**` and retain stable `DOC-*` identities.
- Compliance therefore reassesses **`COMP-GAP-008` as `RESOLVED_ON_MAIN`** for the bounded internal document-placement/identity/lifecycle treatment. This does not convert regime-specific external record-keeping obligations into PASS; `REQ-COMP-035` remains `PARTIALLY_COMPLIANT` for that separate scope limitation.
- DATA PRs #811/#812/#817/#822/#824 plus Human-merged #827 materially advance `REQ-COMP-033/034`: evidence identity/freshness, DQ, provenance, capability freshness and provider-input validation are implemented and composed into `ValidatedDataInput/1.0.0`.
- The DATA return is consumed as `EVIDENCE_READY`, not as end-to-end closure. `REQ-COMP-033` remains held because OPS-18 EventMesh/Traceability coverage is `PARTIAL` and independent Security evidence remains open.
- `REQ-COMP-034` remains held because FINTECH still records FIN-12 `PARTIAL — UPSTREAM EXIT COMPOSED / FINTECH MAPPING OPEN`, FIN-17 `PARTIAL / OPEN` and FIN-20 `PARTIAL / OPEN`; exact DATA→feature→score→rank→trace lineage is not yet reproducible end to end.
- `COMP-GAP-007` / `REQ-COMP-032` remains open: the recovery harness is on main, but measured operating backup/restore/integrity/RPO/RTO evidence and independent Security verification remain incomplete.
- `src/platform/Compliance` remains the implemented ADR-0012 / ESS-0006 technical boundary. No current Compliance roadmap item authorizes a new local runtime/validator path; `CODE_DELTA_REQUIRED = NO` for this reassessment slice.

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
| `CAPITAL-AI-GOV` | `COMP-GAP-008` Governance/PVC-05 return consumed; no shared Document Registry mutation required under current contract |
| `CAPITAL-AI-DOC` | `COMP-GAP-008` Documentary/PVC-03 return consumed through PR #838/#866; no active remediation handoff remains for this finding |
| `CAPITAL-AI-SEC` | supplies independent Security evidence/findings; `S1-R2-11` and recovery verification remain relevant open gates |
| `CAPITAL-AI-QM` | supplies independent Quality evidence/findings where compliance-relevant |
| `CAPITAL-AI-OPS` | owns `PVC-08` recovery/continuity execution evidence and `PVC-18` traceability transport; both retain open evidence gates |
| `CAPITAL-AI-DATA` | current DATA-10..14 / PR #827 upstream evidence has been consumed as `EVIDENCE_READY`; correction-version lineage and Security verification remain explicit residuals |
| `CAPITAL-AI-FINTECH` | owns `PVC-12..17`; FIN-12/FIN-17/FIN-20 must complete downstream feature/rank/end-to-end lineage evidence |
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

The bounded Compliance roadmap closeout remains **complete** because:

- all eight local workstream steps have been processed;
- Human-merged PR #768 placed the consolidated closeout on main and its exact-head hosted checks passed;
- Governance #775 plus Documentary #838/#866 have now been independently consumed to resolve `COMP-GAP-008` without inventing a registry mutation;
- current DATA-10..14/#827 evidence has been consumed as a positive upstream return without falsely promoting open OPS/Security/FINTECH end-to-end gates to PASS;
- no locally actionable Compliance-owned stale finding/handoff remains intentionally preserved as current in this reassessment slice;
- external evidence/legal/foreign-owner dependencies remain explicit rather than falsely closed;
- no productive PVC ownership or foreign implementation authority moved to Compliance.

Continuous Compliance itself remains active by design; future material changes re-trigger `COMP-08` and the affected upstream workstreams.
