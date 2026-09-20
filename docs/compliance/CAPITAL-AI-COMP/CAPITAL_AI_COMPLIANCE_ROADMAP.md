# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.8.6  
**Date:** 2026-09-16  
**Current-main reconciliation baseline:** `main@7e083b6c99327884fbc4169525bf8646519d06a7`  
**Status:** ACTIVE — ALL 8 COMPLIANCE WORK PACKAGES PROCESSED LOCALLY; PR #973 TERMINAL / REQ-COMP-033 PARTIALLY_COMPLIANT / SIX HELD INPUTS RE-PRIORITIZED  
**Primary Project Value Chain ownership:** none (`[]`)

## Mission and ownership boundary

`CAPITAL-AI-COMP` owns applicability, requirement/control mapping, evidence-based assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment. It owns no productive `PVC-*` stage, does not implement foreign remediation and does not replace Human/Legal Review.

Project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Missing evidence, unresolved legal scope and foreign-owner gaps never become PASS by inference.

## Local closeout and current reassessment objective

Human-merged PR #768 completed the bounded locally executable Compliance closeout. Human-merged PR #973 (`merge aaf246511cc75c525a56ec13728504ee5516b6c3`) subsequently consumed the returned OPS/PVC-18 traceability and independent Security evidence for `REQ-COMP-033`. This current-main pass terminalizes the stale pre-merge projection for that work and re-prioritizes the six remaining evidence/owner-held inputs without collapsing foreign Primary-Owner remediation, Security verification or Human/Legal decisions into Compliance.

The eight canonical work packages remain in truthful states:

- `DONE_ON_MAIN` — bounded result Human-merged;
- `EXECUTED_CONTINUOUS` — the current review cycle was executed and the workstream remains continuous by design;
- `EXECUTED_HELD` — Compliance completed its local assessment/routing work and is waiting for external evidence or a competent decision;
- `RESOLVED_ON_MAIN` — a finding has adequate current-main evidence and no longer requires an active Compliance remediation handoff.

## Current-main correlation — 2026-09-16

1. `/AGENTS.md` Control Plane `2.11.0` and `main@7e083b6c99327884fbc4169525bf8646519d06a7` are the current execution baseline. At branch creation there were zero open Pull Requests.
2. `CAPITAL-AI-COMP` remains cross-cutting with no productive `PVC-*` ownership; current project folder is `docs/projects/compliance/` and branch slug is `compliance`.
3. Human-merged PR #973 is terminal on main and replaces the stale local state `MATERIALIZED_ON_BRANCH / MERGE_PENDING` for `COMP-REQ-033`; the bounded assessment remains `REQ-COMP-033 = PARTIALLY_COMPLIANT`.
4. Human-merged PR #761 retains the original COMP-04 `READY_NOW` assessment baseline; Human-merged PR #768 remains the implementation baseline for the original bounded COMP-01..08 closeout.
5. Governance PR #775 plus Documentary PR #838/#866 continue to support the already terminal `COMP-GAP-008` disposition; this pass does not reopen it.
6. DATA PRs #811/#812/#817/#822/#824 plus Human-merged PR #827 remain positive upstream evidence for `REQ-COMP-033/034`. Current `ValidatedDataInput/1.0.0` composes provider-input validation, capability freshness, provenance lineage and the Data Quality gate with fail-closed status semantics.
7. Human-merged OPS PR #937 (`merge 8203e17940287cdd4ba0bd630f43c84bb701e96c`) supplies bounded `STRICT_IDENTITY_CORRELATION`: source-owned evidence identity, evidence reference, correlation, source timestamp and fresh provenance must match or the strict record fails closed.
8. Human-merged OPS PR #939 (`merge 51981a7eb8ced509f5acedc165e1dab7fb7f5eeb`) binds the productive Traceability → EventMesh returned event into that strict projection. Exact PR-head CI, Governance and Container Security concluded `success` on head `bc7a3ba9baab06fbbd52b144b0f4ef8652316f66`.
9. Human-merged Security PR #956 (`merge 8b2fc1805bdbf27523460ec41243ee32cb7e7609`) independently verifies the FINTECH-owned `evidence-identity-freshness/1.0.0` contract through positive and fail-closed negative cases. Exact PR-head CI, Governance and Container Security concluded `success` on head `c730ca539dc7a14c39d3066190105405390bd646`.
10. The former `REQ-COMP-033` return blockers — OPS-18 productive transport/source binding and independent Security evidence-identity/freshness verification — are satisfied for the bounded repository path and terminalized as active handoffs.
11. `REQ-COMP-033` remains **`PARTIALLY_COMPLIANT`**. The evidenced chain is `FINTECH evidence identity/freshness → independent Security verification → Traceability run → EventMesh returned event → exact identity/correlation/timestamp binding → fail-closed operational trace projection`. The remaining limitation is exhaustive coverage: current evidence does not prove every protected action, every compliance-relevant event, every provider/runtime event or every future state.
12. `REQ-COMP-034` remains held. FINTECH upstream (former DATA surface) is materially implemented and composed; FIN-17 backend/consumer ranking work is no longer treated as the missing predecessor, while FIN-12 feature-contract mapping and FIN-20 exact end-to-end lineage remain open. The existing `agent/fintech-fin12-validated-feature-contract-20260916` branch is not accepted as a current return because it is `56 behind / 3 ahead` of this baseline with merge base `683dc08b5079ee41e736b5073e52ef62c4105cf3`.
13. `COMP-GAP-007` / `REQ-COMP-032` remains open. Human-merged OPS PR #776 placed the fail-closed recovery harness on main. PR #802 attempted an additional RPO evaluator but was closed without merge; measured operational backup/restore/integrity/RPO/RTO evidence and independent Security verification remain pending.
14. `REQ-COMP-017`, `019`, `021` and `031` remain held exactly where current provider/output/training/contract evidence is incomplete; no owner, PVC, legal result or PASS is inferred from absence of evidence.
15. The seven legal/scope-held inputs `REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain separate Human/Legal gates. Engineering facts remain inputs only.
16. `src/platform/Compliance` remains the already implemented ADR-0012 / ESS-0006 technical boundary. No current finding or roadmap item authorizes a new local Compliance runtime/validator path; `CODE_DELTA_REQUIRED = NO` for this pass.
17. No current evidence supports inventing a new `REQ-COMP-*` input, a new `AUTH-*`/`CTRL-*`, a second Compliance registry, a new Audit/EventMesh plane or a new productive PVC stage.

## Active assessment universe

Active inputs: **37**. Retired historical inputs excluded: **2** (`REQ-COMP-026`, `REQ-COMP-027`).

| Queue | Count | Current state |
|---|---:|---|
| `CURRENTLY_ASSESSED` | **24** | original 23 `READY_NOW` inputs plus returned `REQ-COMP-033`; current returns reassessed |
| `EVIDENCE_OR_OWNER_HELD` | **6** | remaining held inputs re-prioritized against current main; no silent PASS |
| `LEGAL_OR_SCOPE_HELD` | **7** | competent Human/Legal scope decision still required where applicable |
| **Total active** | **37** | fully partitioned; no silent PASS |

## Work-package closeout state

| WP | Workstream | Current state | Exit condition / retained gate |
|---|---|---|---|
| `COMP-01` | Applicability | `EXECUTED_CONTINUOUS` | 37 active inputs remain partitioned; legal ambiguity stays `UNKNOWN` / `REQUIRES_LEGAL_REVIEW`. |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` | 37 active requirement/assessment inputs remain current; 2 NIST-derived IDs remain retired/historical and excluded. |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN / CURRENT RETURNS CORRELATED` | 37/37 inputs mapped to existing Authority/Controls/ADR/ESS and current `PVC-*` owner surfaces without duplicate authority; `REQ-COMP-033` OPS/Security return state is terminal/current. |
| `COMP-04` | Assessment | `DONE_ON_MAIN / CURRENT RETURN REASSESSED` | 24 current inputs are assessed; `REQ-COMP-033` is bounded `PARTIALLY_COMPLIANT`. |
| `COMP-05` | Findings | `EXECUTED_CURRENT` | `COMP-GAP-008` remains `RESOLVED_ON_MAIN`; no new finding is invented solely from `REQ-COMP-033`'s remaining exhaustive-coverage limitation. |
| `COMP-06` | Evidence | `EXECUTED_HELD` | 6 evidence/owner-held inputs remain and have explicit current-main return gates. |
| `COMP-07` | Remediation Handoff | `EXECUTED_HELD` | stale `REQ-COMP-033` OPS/Security return gates are terminalized; other active handoffs retain current `PVC-*` ownership. |
| `COMP-08` | Continuous Compliance | `EXECUTED_CONTINUOUS` | current-main impact review preserves continuous reassessment without false blanket closure. |

## COMP-04 current assessment result

| Assessment | Count | Requirements |
|---|---:|---|
| `COMPLIANT` | **9** | `001`, `003`, `004`, `006`, `007`, `008`, `011`, `012`, `029` |
| `PARTIALLY_COMPLIANT` | **12** | `002`, `005`, `009`, `010`, `013`, `014`, `015`, `016`, `030`, `033`, `035`, `036` |
| `NON_COMPLIANT` | **0** | none demonstrated in this bounded set |
| `NOT_APPLICABLE` | **3** | `024`, `025`, `028` — binding-authority scope only |
| **Total currently assessed** | **24** | bounded evidence-based assessments |

`COMPLIANT` and `PARTIALLY_COMPLIANT` are bounded to the stated evidence scope only and are not certification, blanket legal-compliance statements or permanent future-state claims.

`REQ-COMP-033` is `PARTIALLY_COMPLIANT` because the concrete repository traceability path now has owner-returned transport/source binding and independent evidence-identity/freshness verification, while exhaustive coverage of all protected actions, all compliance-relevant events and all runtime/provider states has not been established.

## Current finding state after COMP-05 re-correlation

| Finding | Current state | Compliance conclusion / gate |
|---|---|---|
| `COMP-GAP-001` QM project structure absent | `RESOLVED_ON_MAIN` | `docs/projects/quality-management/` exists; structural presence does not activate proposed authority. |
| `COMP-GAP-002` ADR-0007 lifecycle/authority ambiguity | `RESOLVED_ON_MAIN` | PR #755 plus #758 establish stable historical/non-authorizing treatment. |
| `COMP-GAP-003` ESS-0006 stale semantics | `RESOLVED_ON_MAIN` | PR #757 establishes bounded ESS-0006 component semantics; current ESS-0006 is v1.2.0. |
| `COMP-GAP-004` vendor/transfer evidence | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal plus actual provider/domain owner must return flow-specific contractual/transfer evidence. |
| `COMP-GAP-005` Human AI-literacy evidence | `EVIDENCE_MISSING` | control specification exists; attributable Human training/acknowledgement evidence is still not established. |
| `COMP-GAP-006` DORA entity/activity scope | `NOT_ASSESSED / LEGAL_REVIEW` | no competent entity/business applicability decision is inferred from FinTech functionality. |
| `COMP-GAP-007` measured recovery | `EVIDENCE_MISSING / OPEN` | recovery harness is on main through PR #776, but operational backup/restore execution, measured RPO/RTO/integrity and Security verification remain pending; PR #802 is closed without merge. |
| `COMP-GAP-008` document-registry treatment | `RESOLVED_ON_MAIN` | Governance #775 plus Documentary #838/#866 establish the current internal lifecycle/registry/path treatment; Compliance reassessment finds no remaining bounded remediation for this finding. |

No P0 finding is demonstrated by current evidence.

## COMP-06 held-set result

### EVIDENCE_OR_OWNER_HELD — 6

- `REQ-COMP-017`: `EVIDENCE_MISSING / LEGAL_REVIEW`; provider/vendor role, DPA/subprocessor/transfer/TIA evidence remains flow-specific and incomplete. Human/Legal plus the actual provider/domain owner must return exact-flow evidence before owner/PVC/legal conclusions are made.
- `REQ-COMP-019`: `EVIDENCE_OR_OWNER_HELD / SCOPE_SPECIFIC`; customer-facing/generated-content transparency evidence remains incomplete across all material output surfaces. CLIENT/PVC-01, DOC/PVC-03 and FINTECH/PVC-17 are owner routes only where the actual surface is correlated.
- `REQ-COMP-021`: `EVIDENCE_MISSING`; Human AI-literacy completion/acknowledgement evidence remains absent. The Human Owner/organizational operator is the required return source; Compliance does not fabricate records.
- `REQ-COMP-031`: `EVIDENCE_OR_OWNER_HELD / CONTRACT_UNIVERSE_UNKNOWN`; complete binding customer/provider/partner contract universe and effective versions remain unestablished. Human/Legal and affected owners are resolved only after contract correlation.
- `REQ-COMP-032`: `EVIDENCE_MISSING / OPEN`; PR #776 merged the OPS recovery harness, but measured operating backup/restore/integrity/RPO/RTO evidence and independent Security verification remain missing. PR #802 closed without merge and is not counted as current implementation evidence.
- `REQ-COMP-034`: `EVIDENCE_OR_OWNER_HELD`; FINTECH provider validation, freshness, provenance and DQ are composed fail-closed upstream. FIN-12 feature-contract mapping and FIN-20 exact end-to-end lineage remain open; correction-version lineage remains an explicit DATA residual only where independently proven. The existing FIN-12 branch is stale/diverged against current main and is not a current owner return.

`REQ-COMP-033` is no longer in this held set. Its prior OPS/Security return gates were independently returned and reassessed; PR #973 is terminal on main and its current bounded status is `PARTIALLY_COMPLIANT`.

### Current execution order for the six held inputs

This is an **execution-readiness order**, not a severity, legal-risk or materiality ranking.

| Order | Requirement | Current owner / Human return | Objective exit gate |
|---:|---|---|---|
| 1 | `REQ-COMP-032` | `CAPITAL-AI-OPS / PVC-08` returns measured scheduled backup/RPO, isolated restore/RTO and integrity evidence; `CAPITAL-AI-SEC` independently verifies | At least two successful scheduled backup evidence records; DB RPO `<= 24h`; isolated restore with integrity match; DB RTO `<= 60 min`; independent Security verification |
| 2 | `REQ-COMP-034` | `CAPITAL-AI-FINTECH / PVC-09..17` returns current-main FIN-12 and FIN-20 lineage evidence; `CAPITAL-AI-FINTECH / PVC-09..11` returns only independently proven correction-lineage residuals | Exact accepted FINTECH identity/provenance remains linked through feature→score→rank and reaches required OPS trace/evidence transport; stale branch evidence cannot satisfy the gate |
| 3 | `REQ-COMP-017` | Human/Legal + actual provider/domain owner | Exact provider role, effective DPA/contract, subprocessors, region and transfer/TIA evidence are linked to each material flow and competently interpreted where required |
| 4 | `REQ-COMP-019` | CLIENT/PVC-01, DOC/PVC-03 and/or FINTECH/PVC-17 only for actual correlated surfaces; Human/Legal where legal sufficiency is required | Material generated-output surfaces are inventoried and each applicable surface has transparency/claim-boundary evidence or owner-routed remediation |
| 5 | `REQ-COMP-021` | Human Owner / organizational operator | Dated attributable AI-literacy completion/acknowledgement evidence identifies applicable training/control version and covered Human role(s) |
| 6 | `REQ-COMP-031` | Human/Legal + affected owner after contract correlation | Complete binding contract inventory and effective versions exist for assessed scope; each material obligation is routed to actual owner/PVC or retained as a Legal gate |

### LEGAL_OR_SCOPE_HELD — 7

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` or scope-held exactly where Human/Legal classification is required. Engineering facts and source-text updates are inputs only; they do not substitute a competent legal decision. These seven items are intentionally excluded from the six-input execution order above.

## COMP-07 routing invariant

All current remediation handoffs use the canonical `PVC-*` namespace and the Primary Owner resolved from `docs/projects/README.md` / `PROJECT_VALUE_CHAIN.md`. Historical `VC-*` marker text is migration history only and is not current ownership authority.

The former active `REQ-COMP-033` OPS/PVC-18 transport return and Security verification gates are terminal after Human-merged #937/#939/#956, PR #973 and independent Compliance reassessment. No new OPS/Security remediation is created from the remaining exhaustive-coverage limitation. A future concrete uncovered surface must be correlated to its actual owner before any remediation is assigned.

Active foreign returns remain for vendor/legal, Operations recovery, FINTECH downstream lineage, Human training evidence and other scope-specific obligations.

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

For this 2026-09-16 current-main pass:

- implemented code boundary reviewed: `src/platform/Compliance/**` under accepted ADR-0012 / active ESS-0006 v1.2.0;
- new local Compliance code backlog found: **none**;
- required code delta: **none**;
- required documentation/evidence delta: **current-main baseline update, PR #973 terminalization, explicit separation of the seven Legal/Scope gates and current execution ordering/return gates for `REQ-COMP-017`, `019`, `021`, `031`, `032`, `034`**.

## Roadmap completion condition

The **bounded local roadmap closeout remains complete**. This pass removes stale local projection state and clarifies owner-return order rather than reopening a Compliance runtime backlog:

- PR #973 is terminal on main and `REQ-COMP-033` remains bounded `PARTIALLY_COMPLIANT`, not blanket PASS;
- `REQ-COMP-032` remains held for measured OPS recovery evidence and independent Security verification;
- `REQ-COMP-034` remains held for current-main FIN-12/FIN-20 evidence and independently proven former-DATA correction-lineage residuals; stale/diverged branch work is not current evidence;
- `REQ-COMP-017`, `019`, `021` and `031` retain explicit Human/Owner/provider/contract evidence gates;
- the seven Human/Legal scope items remain separated and are never inferred from engineering facts;
- no productive PVC ownership or foreign implementation authority moves to Compliance.

The overall Compliance function is intentionally **not terminal**: COMP-01, COMP-02 and COMP-08 remain continuous, and externally held findings remain open until adequate owner/legal/evidence returns are independently reassessed. Finalizing this roadmap means eliminating stale or locally actionable backlog, not falsely closing external dependencies.