# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.7.0  
**Date:** 2026-09-06  
**Current-main reconciliation baseline:** `main@7fe061a897f669fd21ca4c46e564351e14f1c7dc`  
**Status:** ACTIVE — ALL 8 COMPLIANCE WORK PACKAGES PROCESSED LOCALLY; CONTINUOUS / EXTERNAL GATES PRESERVED  
**Primary Project Value Chain ownership:** none (`[]`)

## Mission and ownership boundary

`CAPITAL-AI-COMP` owns applicability, requirement/control mapping, evidence-based assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment. It owns no productive `PVC-*` stage, does not implement foreign remediation and does not replace Human/Legal Review.

Project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Missing evidence, unresolved legal scope and foreign-owner gaps never become PASS by inference.

## 2026-09-06 closeout objective

This work item intentionally consolidates the remaining locally executable roadmap work into one bounded Compliance branch. It does **not** collapse foreign Primary-Owner remediation, Security verification or Human/Legal decisions into Compliance.

The objective is to leave the eight canonical work packages in one of four truthful states:

- `DONE_ON_MAIN` — bounded result already Human-merged;
- `EXECUTED_CONTINUOUS` — the current review cycle was executed and the workstream remains continuous by design;
- `EXECUTED_HELD` — Compliance completed its local assessment/routing work and is waiting for external evidence or a competent decision;
- `RESOLVED_ON_MAIN` — a prior finding has returned adequate current-main evidence and no longer requires Compliance-owned follow-up.

## Current-main correlation — 2026-09-06

1. `/AGENTS.md` v2.7.1 and `main@7fe061a897f669fd21ca4c46e564351e14f1c7dc` are the current execution baseline.
2. Human-merged PR #761 placed the COMP-04 READY_NOW assessment baseline on `main`: 23/23 `READY_NOW` requirements are assessed.
3. Human-merged Governance PR #762 changed only `docs/projects/governance/COMPONENT_ARCHITECTURE_MATRIX.md`, `docs/projects/governance/ROADMAP.md` and `docs/projects/governance/TASK_REGISTER.md`; the closeout branch was resynchronized with that merge and retains no changed-file overlap.
4. Open PRs #763 (Frontend), #764 (SEO) and #765 (Security) are foreign-project work and have no changed-file overlap with the nine Compliance closeout files. Their semantic scopes do not transfer productive ownership to Compliance.
5. `CAPITAL-AI-OPS` still has an active foreign coordination writer for its own Operations roadmap/work-package paths. Compliance does not modify those paths and treats Operations recovery evidence as a return dependency only.
6. Official-source recheck on 2026-09-06 confirms the already-recorded AI Act consolidated surface dated 27 July 2026 and Regulation (EU) 2026/1744 timing changes. The DORA source remains Regulation (EU) 2022/2554. Current German DDG/TDDDG source pages remain available, including 2026 amendments. This read-only source check does not create a new repository Authority or a new legal-applicability conclusion.
7. No current evidence supports inventing a new `REQ-COMP-*` input, a new `AUTH-*`/`CTRL-*`, a second Compliance registry or a new productive PVC stage.

## Active assessment universe

Active inputs: **37**. Retired historical inputs excluded: **2** (`REQ-COMP-026`, `REQ-COMP-027`).

| Queue | Count | Current state |
|---|---:|---|
| `READY_NOW` | **23** | **23/23 ASSESSED on main** |
| `EVIDENCE_OR_OWNER_HELD` | **7** | **7/7 reviewed in COMP-06; external evidence/owner return still required** |
| `LEGAL_OR_SCOPE_HELD` | **7** | **7/7 reviewed in COMP-01/05/07/08; competent Human/Legal scope decision still required where applicable** |
| **Total active** | **37** | **fully partitioned; no silent PASS** |

## Work-package closeout state

| WP | Workstream | State after this work item | Exit condition / retained gate |
|---|---|---|---|
| `COMP-01` | Applicability | `EXECUTED_CONTINUOUS` | 37 active inputs remain partitioned; legal ambiguity stays `UNKNOWN` / `REQUIRES_LEGAL_REVIEW`; official-source recheck does not promote applicability. |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` | 37 active requirement/assessment inputs remain current; 2 NIST-derived IDs remain retired/historical and excluded. |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN` | 37/37 inputs mapped to existing Authority/Controls/ADR/ESS and current `PVC-*` owner surfaces without creating duplicate authority. |
| `COMP-04` | Assessment | `DONE_ON_MAIN` | 23/23 `READY_NOW` assessed with one approved status, named evidence and explicit limitation; PR #761 is current-main evidence. |
| `COMP-05` | Findings | `EXECUTED_CURRENT` | findings are re-normalized against current main; stale resolved findings are terminalized; open findings remain evidence-/owner-/legal-gated. |
| `COMP-06` | Evidence | `EXECUTED_HELD` | all 7 evidence/owner-held requirements were rechecked; missing provider, Human, contract, recovery and end-to-end trace/provenance evidence remains explicit. |
| `COMP-07` | Remediation Handoff | `EXECUTED_HELD` | current handoffs use `PVC-*` ownership and `execute_foreign_work=false`; external implementation/decision is not claimed complete. |
| `COMP-08` | Continuous Compliance | `EXECUTED_CONTINUOUS` | current-main, official-source and material-return impact review executed; future material fact/authority/evidence changes re-trigger the flow. |

## COMP-04 READY_NOW result retained

| Assessment | Count | Requirements |
|---|---:|---|
| `COMPLIANT` | **8** | `001`, `003`, `004`, `006`, `007`, `008`, `012`, `029` |
| `PARTIALLY_COMPLIANT` | **12** | `002`, `005`, `009`, `010`, `011`, `013`, `014`, `015`, `016`, `030`, `035`, `036` |
| `NON_COMPLIANT` | **0** | none demonstrated in this bounded set |
| `NOT_APPLICABLE` | **3** | `024`, `025`, `028` — binding-authority scope only |

`COMPLIANT` is bounded to the stated evidence scope only and is not a certification, blanket legal-compliance statement or permanent future-state claim.

## Current finding state after COMP-05 re-correlation

| Finding | Current state | Compliance conclusion / gate |
|---|---|---|
| `COMP-GAP-001` QM project structure absent | `RESOLVED_ON_MAIN` | `docs/projects/quality-management/` now exists on current main. Its own lifecycle/authority remains governed by its project artifacts and applicable ADRs; structural presence does not activate proposed authority. |
| `COMP-GAP-002` ADR-0007 lifecycle/authority ambiguity | `RESOLVED_ON_MAIN` | Human-merged PR #755 plus #758 establish stable historical/non-authorizing treatment. |
| `COMP-GAP-003` ESS-0006 stale semantics | `RESOLVED_ON_MAIN` | Human-merged PR #757 establishes bounded ESS-0006 v1.1.0 component semantics. |
| `COMP-GAP-004` vendor/transfer evidence | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal plus actual provider/domain owner must return flow-specific contractual/transfer evidence. |
| `COMP-GAP-005` Human AI-literacy evidence | `EVIDENCE_MISSING` | control specification exists; attributable Human training/acknowledgement evidence is still not established. |
| `COMP-GAP-006` DORA entity/activity scope | `NOT_ASSESSED / LEGAL_REVIEW` | no competent entity/business applicability decision is inferred from FinTech functionality. |
| `COMP-GAP-007` measured recovery | `EVIDENCE_MISSING / OPEN` | `CAPITAL-AI-OPS / PVC-08` retains S1-R2-07 measured backup/restore/RPO/RTO evidence work; Compliance waits for return evidence. |
| `COMP-GAP-008` document-registry treatment | `PARTIALLY_COMPLIANT / OPEN` | canonical placement and `DOC-*` identities exist; any shared document-registry mutation remains Documentary/Governance-owned. |

No P0 finding is demonstrated by current evidence.

## COMP-06 held-set result

### EVIDENCE_OR_OWNER_HELD — 7

- `REQ-COMP-017`: provider/vendor role, DPA/subprocessor/transfer/TIA evidence remains flow-specific and incomplete.
- `REQ-COMP-019`: customer-facing/generated-content transparency evidence remains incomplete across all material output surfaces.
- `REQ-COMP-021`: Human AI-literacy completion/acknowledgement evidence remains absent; Compliance does not fabricate records.
- `REQ-COMP-031`: complete binding customer/provider/partner contract universe and effective versions remain unestablished.
- `REQ-COMP-032`: Operations still records S1-R2-07 measured backup/restore/RPO/RTO evidence as open.
- `REQ-COMP-033`: end-to-end protected-action / compliance-event traceability coverage and freshness remain incompletely evidenced.
- `REQ-COMP-034`: end-to-end DATA→FINTECH provenance/lineage/quality evidence remains dependent on actual DATA/FINTECH owner returns; the fail-closed ownership boundary is preserved.

### LEGAL_OR_SCOPE_HELD — 7

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` or scope-held exactly where Human/Legal classification is required. Engineering facts and source-text updates are inputs only; they do not substitute a competent legal decision.

## COMP-07 routing invariant

All current remediation handoffs must use the canonical `PVC-*` namespace and the Primary Owner resolved from `docs/projects/README.md` / `PROJECT_VALUE_CHAIN.md`. Historical `VC-*` marker text is migration history only and is not current ownership authority.

Compliance may record or refresh handoffs for vendor/legal, Operations recovery, Documentary/Governance registry treatment, Agent Client, DATA or FINTECH evidence returns, but it does not execute those foreign changes.

## COMP-08 continuous trigger

Re-run the sequence when a material feature, AI model, data source, provider, market/country, user type, processing purpose, deployment model, external integration, Authority/Control, legal-source version or evidence-freshness fact changes:

```text
Change
→ COMP-08 impact review
→ COMP-01 applicability delta
→ COMP-02 requirement delta
→ COMP-03 control/owner/PVC impact
→ COMP-06 evidence impact
→ COMP-04 reassessment
→ COMP-05 finding if needed
→ COMP-07 handoff if foreign remediation is needed
```

This is a reassessment flow, not a second technical orchestrator.

## Roadmap completion condition

The **bounded local roadmap closeout is complete** when the closeout branch is synchronized with then-current `main`, the Compliance-only documentation changes pass required exact-head hosted checks after authorized PR creation, and the PR is Human/CODEOWNER-merged.

The overall Compliance function is intentionally **not terminal**: COMP-01, COMP-02 and COMP-08 remain continuous, and externally held findings remain open until adequate owner/legal/evidence returns are independently reassessed. Finalizing this roadmap therefore means eliminating stale or locally actionable backlog, not falsely closing external dependencies.
