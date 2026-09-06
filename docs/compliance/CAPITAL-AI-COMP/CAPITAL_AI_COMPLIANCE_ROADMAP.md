# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.8.3  
**Date:** 2026-09-06  
**Current-main reconciliation baseline:** `main@dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67`  
**Status:** ACTIVE — ALL 8 COMPLIANCE WORK PACKAGES PROCESSED LOCALLY ON MAIN; CONTINUOUS / EXTERNAL GATES PRESERVED  
**Primary Project Value Chain ownership:** none (`[]`)

## Mission and ownership boundary

`CAPITAL-AI-COMP` owns applicability, requirement/control mapping, evidence-based assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment. It owns no productive `PVC-*` stage, does not implement foreign remediation and does not replace Human/Legal Review.

Project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Missing evidence, unresolved legal scope and foreign-owner gaps never become PASS by inference.

## 2026-09-06 closeout objective

Human-merged PR #768 completed the bounded locally executable Compliance closeout and placed that state on main. This did **not** collapse foreign Primary-Owner remediation, Security verification or Human/Legal decisions into Compliance.

The eight canonical work packages remain in truthful states:

- `DONE_ON_MAIN` — bounded result Human-merged;
- `EXECUTED_CONTINUOUS` — the current review cycle was executed and the workstream remains continuous by design;
- `EXECUTED_HELD` — Compliance completed its local assessment/routing work and is waiting for external evidence or a competent decision;
- `RESOLVED_ON_MAIN` — a prior finding has returned adequate current-main evidence and no longer requires Compliance-owned follow-up.

## Current-main correlation — 2026-09-06 post-merge

1. `/AGENTS.md` v2.8.0 and `main@dbdb1d5ed2c93c857ab9de1329b9d4dcbba2fd67` are the current execution baseline.
2. Human-merged PR #761 placed the COMP-04 READY_NOW assessment baseline on main: 23/23 `READY_NOW` requirements are assessed.
3. Human-merged PR #768 consolidated the remaining locally executable COMP-01..08 closeout state and produced merge commit `e61cb294e368135861c95911b8edfeee8b0de471`.
4. Exact PR-head `3f127cb8751d114e60672c9793b1dd6ea60cf33a` hosted checks completed successfully: PR CI, Governance and Container Security.
5. Human-merged Governance PR #775 completed the Governance/PVC-05 decision for `COMP-GAP-008`: **NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT**. `docs/governance/document-registry.json` remains unchanged by design, not because implementation was skipped.
6. The remaining `COMP-GAP-008` dependency is the Documentary/PVC-03 lifecycle return plus subsequent Compliance reassessment; Compliance does not execute that foreign work.
7. Human-merged OPS PR #776 implemented the recurring encrypted backup / isolated restore evidence harness for `OPS-08-SEC-07`, but its own evidence record remains `EXECUTION_EVIDENCE_PENDING / SECURITY_UNVERIFIED`. Required scheduled runs, encrypted-artifact operating evidence, isolated restore drill, measured RPO/RTO and independent Security verification are not yet established; `REQ-COMP-032` and `COMP-GAP-007` therefore remain held/open.
8. Human-merged FINTECH PR #777 consolidated the FinTech roadmap. DATA `ValidatedDataInput/1.0.0` is present upstream, but FIN-12 is still `PARTIAL — UPSTREAM CONTRACT IMPLEMENTED`, FIN-20 is `PARTIAL / OPEN`, and the tested fail-closed DATA→financial-feature mapping plus exact input-to-rank lineage remain incomplete; `REQ-COMP-034` therefore remains held/incomplete.
9. Current DATA roadmap still marks DATA-10 Evidence Management as `READY / SECURITY EVIDENCE WORK OPEN`, while provenance/freshness/DQ remain active requirements; no DATA-side return on current main justifies promotion of `REQ-COMP-033` or `REQ-COMP-034`.
10. `src/platform/Compliance` remains the already implemented ADR-0012 / ESS-0006 technical boundary. Current roadmap/finding state contains no authorized new local runtime or validator work item; `CODE_DELTA_REQUIRED = NO` for this sync.
11. Official-source recheck on 2026-09-06 confirms the already-recorded AI Act consolidated surface dated 27 July 2026 and Regulation (EU) 2026/1744 timing changes. The DORA source remains Regulation (EU) 2022/2554. Current German DDG/TDDDG source pages remain available, including 2026 amendments. This read-only source check does not create a new repository Authority or a new legal-applicability conclusion.
12. No current evidence supports inventing a new `REQ-COMP-*` input, a new `AUTH-*`/`CTRL-*`, a second Compliance registry or a new productive PVC stage.

## Active assessment universe

Active inputs: **37**. Retired historical inputs excluded: **2** (`REQ-COMP-026`, `REQ-COMP-027`).

| Queue | Count | Current state |
|---|---:|---|
| `READY_NOW` | **23** | **23/23 ASSESSED on main** |
| `EVIDENCE_OR_OWNER_HELD` | **7** | **7/7 reviewed in COMP-06; external evidence/owner return still required** |
| `LEGAL_OR_SCOPE_HELD` | **7** | **7/7 reviewed in COMP-01/05/07/08; competent Human/Legal scope decision still required where applicable** |
| **Total active** | **37** | **fully partitioned; no silent PASS** |

## Work-package closeout state

| WP | Workstream | State after Human merge | Exit condition / retained gate |
|---|---|---|---|
| `COMP-01` | Applicability | `EXECUTED_CONTINUOUS` | 37 active inputs remain partitioned; legal ambiguity stays `UNKNOWN` / `REQUIRES_LEGAL_REVIEW`; official-source recheck does not promote applicability. |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` | 37 active requirement/assessment inputs remain current; 2 NIST-derived IDs remain retired/historical and excluded. |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN` | 37/37 inputs mapped to existing Authority/Controls/ADR/ESS and current `PVC-*` owner surfaces without creating duplicate authority. |
| `COMP-04` | Assessment | `DONE_ON_MAIN` | 23/23 `READY_NOW` assessed with one approved status, named evidence and explicit limitation; PR #761 is current-main evidence. |
| `COMP-05` | Findings | `EXECUTED_CURRENT` | findings are re-normalized against current main; stale resolved findings are terminalized; open findings remain evidence-/owner-/legal-gated. |
| `COMP-06` | Evidence | `EXECUTED_HELD` | OPS #776 and FINTECH #777 were reassessed as new returns; their implementation progress does not satisfy the remaining measured/operational/end-to-end evidence gates. |
| `COMP-07` | Remediation Handoff | `EXECUTED_HELD` | current handoffs use `PVC-*` ownership and `execute_foreign_work=false`; external implementation/decision is not claimed complete. |
| `COMP-08` | Continuous Compliance | `EXECUTED_CONTINUOUS` | current-main, official-source and material-return impact review executed through Governance #775, OPS #776 and FINTECH #777 without false closure. |

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
| `COMP-GAP-001` QM project structure absent | `RESOLVED_ON_MAIN` | `docs/projects/quality-management/` now exists on current main. Structural presence does not activate proposed authority. |
| `COMP-GAP-002` ADR-0007 lifecycle/authority ambiguity | `RESOLVED_ON_MAIN` | Human-merged PR #755 plus #758 establish stable historical/non-authorizing treatment. |
| `COMP-GAP-003` ESS-0006 stale semantics | `RESOLVED_ON_MAIN` | Human-merged PR #757 establishes bounded ESS-0006 v1.1.0 component semantics. |
| `COMP-GAP-004` vendor/transfer evidence | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal plus actual provider/domain owner must return flow-specific contractual/transfer evidence. |
| `COMP-GAP-005` Human AI-literacy evidence | `EVIDENCE_MISSING` | control specification exists; attributable Human training/acknowledgement evidence is still not established. |
| `COMP-GAP-006` DORA entity/activity scope | `NOT_ASSESSED / LEGAL_REVIEW` | no competent entity/business applicability decision is inferred from FinTech functionality. |
| `COMP-GAP-007` measured recovery | `EVIDENCE_MISSING / OPEN` | PR #776 implements the OPS/PVC-08 evidence harness, but operational backup/restore execution, measured RPO/RTO and Security verification remain pending. |
| `COMP-GAP-008` document-registry treatment | `PARTIALLY_COMPLIANT / OPEN` | Governance/PVC-05 decision is resolved by PR #775 with no registry change required; Documentary/PVC-03 lifecycle return and subsequent Compliance reassessment remain open. |

No P0 finding is demonstrated by current evidence.

## COMP-06 held-set result

### EVIDENCE_OR_OWNER_HELD — 7

- `REQ-COMP-017`: provider/vendor role, DPA/subprocessor/transfer/TIA evidence remains flow-specific and incomplete.
- `REQ-COMP-019`: customer-facing/generated-content transparency evidence remains incomplete across all material output surfaces.
- `REQ-COMP-021`: Human AI-literacy completion/acknowledgement evidence remains absent; Compliance does not fabricate records.
- `REQ-COMP-031`: complete binding customer/provider/partner contract universe and effective versions remain unestablished.
- `REQ-COMP-032`: PR #776 adds an implemented recovery evidence harness, but two successful scheduled backups, encrypted-artifact operating evidence, a successful isolated restore drill, measured RPO/RTO and independent Security verification are still missing; status remains `EVIDENCE_MISSING`.
- `REQ-COMP-033`: end-to-end protected-action / compliance-event traceability coverage and freshness remain incompletely evidenced; current DATA/OPS authority surfaces do not by themselves prove end-to-end execution evidence.
- `REQ-COMP-034`: DATA `ValidatedDataInput/1.0.0` is implemented upstream and FINTECH #777 documents the current boundary, but FIN-12/FIN-20 remain open; end-to-end DATA→FINTECH feature/score/rank provenance and lineage evidence remains incomplete.

### LEGAL_OR_SCOPE_HELD — 7

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` or scope-held exactly where Human/Legal classification is required. Engineering facts and source-text updates are inputs only; they do not substitute a competent legal decision.

## COMP-07 routing invariant

All current remediation handoffs must use the canonical `PVC-*` namespace and the Primary Owner resolved from `docs/projects/README.md` / `PROJECT_VALUE_CHAIN.md`. Historical `VC-*` marker text is migration history only and is not current ownership authority.

Compliance may record or refresh handoffs for vendor/legal, Operations recovery, Documentary lifecycle treatment, Agent Client, DATA or FINTECH evidence returns, but it does not execute those foreign changes. The Governance/PVC-05 part of `COMP-GAP-008` no longer requires a registry mutation under the current contract.

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

## Code-/document-based continuation rule

The current Compliance roadmap does not authorize code churn for its own sake. Code-based implementation proceeds only when a correlated Compliance-owned technical work item exists within the existing ADR-0012 / ESS-0006 boundary. Documentation/evidence-based implementation proceeds when the task is assessment, traceability, post-merge evidence, finding lifecycle or owner/legal handoff.

For the present post-merge sync:

- implemented code boundary reviewed: `src/platform/Compliance/**`;
- new local Compliance code backlog found: **none**;
- required code delta: **none**;
- required documentation/evidence delta: **post-merge baseline, hosted-check evidence, PR #775 Governance decision return, PR #776 recovery-harness reassessment, PR #777 DATA/FINTECH lineage reassessment and roadmap completion state**.

## Roadmap completion condition

The **bounded local roadmap closeout is complete on main**: Human-merged PR #768 placed the synchronized Compliance-only closeout on main and the exact PR-head hosted CI, Governance and Container Security checks passed. Subsequent Human-merged PRs #775, #776 and #777 are consumed as evidence/decision returns. They do not reopen a local Compliance code backlog; they narrow and clarify the remaining foreign evidence gates without falsely closing them.

The overall Compliance function is intentionally **not terminal**: COMP-01, COMP-02 and COMP-08 remain continuous, and externally held findings remain open until adequate owner/legal/evidence returns are independently reassessed. Finalizing this roadmap therefore means eliminating stale or locally actionable backlog, not falsely closing external dependencies.
