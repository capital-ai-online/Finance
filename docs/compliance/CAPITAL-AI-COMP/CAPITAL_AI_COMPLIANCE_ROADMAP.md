# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.8.5  
**Date:** 2026-09-16  
**Current-main reconciliation baseline:** `main@f6fccf64f78a1a29c3f98a9aa3adc8634d51b80d`  
**Status:** ACTIVE — ALL 8 COMPLIANCE WORK PACKAGES PROCESSED LOCALLY; REQ-COMP-033 CURRENT RETURNS REASSESSED / REMAINING EXTERNAL GATES PRESERVED  
**Primary Project Value Chain ownership:** none (`[]`)

## Mission and ownership boundary

`CAPITAL-AI-COMP` owns applicability, requirement/control mapping, evidence-based assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment. It owns no productive `PVC-*` stage, does not implement foreign remediation and does not replace Human/Legal Review.

Project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Missing evidence, unresolved legal scope and foreign-owner gaps never become PASS by inference.

## Local closeout and current reassessment objective

Human-merged PR #768 completed the bounded locally executable Compliance closeout. The 2026-09-16 reassessment consumes the now-returned OPS/PVC-18 traceability and independent Security evidence for `REQ-COMP-033` without collapsing foreign Primary-Owner remediation, Security verification or Human/Legal decisions into Compliance.

The eight canonical work packages remain in truthful states:

- `DONE_ON_MAIN` — bounded result Human-merged;
- `EXECUTED_CONTINUOUS` — the current review cycle was executed and the workstream remains continuous by design;
- `EXECUTED_HELD` — Compliance completed its local assessment/routing work and is waiting for external evidence or a competent decision;
- `RESOLVED_ON_MAIN` — a finding has adequate current-main evidence and no longer requires an active Compliance remediation handoff.

## Current-main correlation — 2026-09-16

1. `/AGENTS.md` Control Plane `2.11.0` and `main@f6fccf64f78a1a29c3f98a9aa3adc8634d51b80d` are the current execution baseline; no open Pull Requests were present at branch creation.
2. `CAPITAL-AI-COMP` remains cross-cutting with no productive `PVC-*` ownership; current project folder is `docs/projects/compliance/`.
3. Human-merged PR #761 retains the original COMP-04 `READY_NOW` assessment baseline; this reassessment adds one previously held input (`REQ-COMP-033`) to the currently assessed set.
4. Human-merged PR #768 consolidated the original locally executable COMP-01..08 closeout and remains the implementation baseline for that bounded cycle.
5. Governance PR #775 plus Documentary PR #838/#866 continue to support the already terminal `COMP-GAP-008` disposition; this reassessment does not reopen it.
6. DATA PRs #811/#812/#817/#822/#824 plus Human-merged PR #827 remain positive upstream evidence for `REQ-COMP-033/034`. Current `ValidatedDataInput/1.0.0` composes provider-input validation, capability freshness, provenance lineage and the Data Quality gate with fail-closed status semantics.
7. Human-merged OPS PR #937 (`merge 8203e17940287cdd4ba0bd630f43c84bb701e96c`) supplies bounded `STRICT_IDENTITY_CORRELATION`: source-owned evidence identity, evidence reference, correlation, source timestamp and fresh provenance must match or the strict record fails closed.
8. Human-merged OPS PR #939 (`merge 51981a7eb8ced509f5acedc165e1dab7fb7f5eeb`) binds the productive Traceability → EventMesh returned event into that strict projection. Exact PR-head CI, Governance and Container Security concluded `success` on head `bc7a3ba9baab06fbbd52b144b0f4ef8652316f66`.
9. Human-merged Security PR #956 (`merge 8b2fc1805bdbf27523460ec41243ee32cb7e7609`) independently verifies the unchanged DATA `evidence-identity-freshness/1.0.0` contract through positive and fail-closed negative cases. Exact PR-head CI, Governance and Container Security concluded `success` on head `c730ca539dc7a14c39d3066190105405390bd646`.
10. The former `REQ-COMP-033` return blockers — OPS-18 productive transport/source binding and independent Security evidence-identity/freshness verification — are therefore satisfied for the bounded repository path and are terminalized as active handoffs.
11. `REQ-COMP-033` is reassessed as **`PARTIALLY_COMPLIANT`**. The evidenced chain is `DATA evidence identity/freshness → independent Security verification → Traceability run → EventMesh returned event → exact identity/correlation/timestamp binding → fail-closed operational trace projection`. The remaining limitation is exhaustive coverage: current evidence does not prove every protected action, every compliance-relevant event, every provider/runtime event or every future state.
12. `REQ-COMP-034` remains held. DATA upstream is materially implemented and composed; FIN-17 backend/consumer ranking work is no longer treated as the missing predecessor, while FIN-12 feature-contract mapping and FIN-20 exact end-to-end lineage remain open. Correction-version lineage remains an explicit DATA residual where applicable.
13. `COMP-GAP-007` / `REQ-COMP-032` remains open. The recovery harness is implemented on main, while measured operational backup/restore/integrity/RPO/RTO evidence and independent Security verification remain pending.
14. `src/platform/Compliance` remains the already implemented ADR-0012 / ESS-0006 technical boundary. No current finding or roadmap item authorizes a new local Compliance runtime/validator path; `CODE_DELTA_REQUIRED = NO` for this reassessment.
15. No current evidence supports inventing a new `REQ-COMP-*` input, a new `AUTH-*`/`CTRL-*`, a second Compliance registry, a new Audit/EventMesh plane or a new productive PVC stage.

## Active assessment universe

Active inputs: **37**. Retired historical inputs excluded: **2** (`REQ-COMP-026`, `REQ-COMP-027`).

| Queue | Count | Current state |
|---|---:|---|
| `CURRENTLY_ASSESSED` | **24** | original 23 `READY_NOW` inputs plus returned `REQ-COMP-033`; current returns reassessed |
| `EVIDENCE_OR_OWNER_HELD` | **6** | remaining held inputs reviewed; `REQ-COMP-033` removed from this queue after returned evidence |
| `LEGAL_OR_SCOPE_HELD` | **7** | competent Human/Legal scope decision still required where applicable |
| **Total active** | **37** | fully partitioned; no silent PASS |

## Work-package closeout state

| WP | Workstream | Current state | Exit condition / retained gate |
|---|---|---|---|
| `COMP-01` | Applicability | `EXECUTED_CONTINUOUS` | 37 active inputs remain partitioned; legal ambiguity stays `UNKNOWN` / `REQUIRES_LEGAL_REVIEW`. |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` | 37 active requirement/assessment inputs remain current; 2 NIST-derived IDs remain retired/historical and excluded. |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN / CURRENT RETURNS CORRELATED` | 37/37 inputs mapped to existing Authority/Controls/ADR/ESS and current `PVC-*` owner surfaces without duplicate authority; `REQ-COMP-033` OPS/Security return state is current. |
| `COMP-04` | Assessment | `DONE_ON_MAIN / CURRENT RETURN REASSESSED` | 24 current inputs are assessed; `REQ-COMP-033` is bounded `PARTIALLY_COMPLIANT`. |
| `COMP-05` | Findings | `EXECUTED_CURRENT` | `COMP-GAP-008` remains `RESOLVED_ON_MAIN`; no new finding is invented solely from `REQ-COMP-033`'s remaining exhaustive-coverage limitation. |
| `COMP-06` | Evidence | `EXECUTED_HELD` | 6 evidence/owner-held inputs remain; OPS #937/#939 and Security #956 are consumed for `REQ-COMP-033`. |
| `COMP-07` | Remediation Handoff | `EXECUTED_HELD` | stale `REQ-COMP-033` OPS/Security return gates are terminalized; other active handoffs retain current `PVC-*` ownership. |
| `COMP-08` | Continuous Compliance | `EXECUTED_CONTINUOUS` | current-main impact review consumed the returned OPS/Security evidence without false blanket closure. |

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
| `COMP-GAP-007` measured recovery | `EVIDENCE_MISSING / OPEN` | recovery harness exists, but operational backup/restore execution, measured RPO/RTO/integrity and Security verification remain pending. |
| `COMP-GAP-008` document-registry treatment | `RESOLVED_ON_MAIN` | Governance #775 plus Documentary #838/#866 establish the current internal lifecycle/registry/path treatment; Compliance reassessment finds no remaining bounded remediation for this finding. |

No P0 finding is demonstrated by current evidence.

## COMP-06 held-set result

### EVIDENCE_OR_OWNER_HELD — 6

- `REQ-COMP-017`: provider/vendor role, DPA/subprocessor/transfer/TIA evidence remains flow-specific and incomplete.
- `REQ-COMP-019`: customer-facing/generated-content transparency evidence remains incomplete across all material output surfaces.
- `REQ-COMP-021`: Human AI-literacy completion/acknowledgement evidence remains absent; Compliance does not fabricate records.
- `REQ-COMP-031`: complete binding customer/provider/partner contract universe and effective versions remain unestablished.
- `REQ-COMP-032`: the OPS recovery harness is implemented, but measured operating backup/restore/integrity/RPO/RTO evidence and independent Security verification remain missing; status remains `EVIDENCE_MISSING`.
- `REQ-COMP-034`: DATA provider validation, freshness, provenance and DQ are composed fail-closed upstream. FIN-12 feature-contract mapping and FIN-20 exact end-to-end lineage remain open; correction-version lineage remains an explicit DATA residual where applicable.

`REQ-COMP-033` is no longer in this held set. Its prior OPS/Security return gates were independently returned and reassessed; its current bounded status is `PARTIALLY_COMPLIANT`.

### LEGAL_OR_SCOPE_HELD — 7

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` or scope-held exactly where Human/Legal classification is required. Engineering facts and source-text updates are inputs only; they do not substitute a competent legal decision.

## COMP-07 routing invariant

All current remediation handoffs use the canonical `PVC-*` namespace and the Primary Owner resolved from `docs/projects/README.md` / `PROJECT_VALUE_CHAIN.md`. Historical `VC-*` marker text is migration history only and is not current ownership authority.

The former active `REQ-COMP-033` OPS/PVC-18 transport return and Security verification gates are terminal after Human-merged #937/#939/#956 and independent Compliance reassessment. No new OPS/Security remediation is created from the remaining exhaustive-coverage limitation. A future concrete uncovered surface must be correlated to its actual owner before any remediation is assigned.

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

For this 2026-09-16 reassessment:

- implemented code boundary reviewed: `src/platform/Compliance/**`;
- new local Compliance code backlog found: **none**;
- required code delta: **none**;
- required documentation/evidence delta: **current-main baseline, OPS #937/#939 return consumption, Security #956 return consumption, `REQ-COMP-033` bounded `PARTIALLY_COMPLIANT` assessment and terminalization of the stale OPS/Security return gates**.

## Roadmap completion condition

The **bounded local roadmap closeout remains complete**. The 2026-09-16 reassessment removes stale local projection state rather than reopening a Compliance runtime backlog:

- OPS #937/#939 and Security #956 provide adequate returned repository evidence to remove the previously held OPS/Security gates for `REQ-COMP-033`;
- `REQ-COMP-033` is bounded `PARTIALLY_COMPLIANT`, not blanket PASS, because exhaustive all-surface runtime/provider coverage is not proven;
- `REQ-COMP-034` remains held for FIN-12/FIN-20 and any independently proven DATA residuals;
- `COMP-GAP-007` and Human/Legal/evidence-held findings remain explicit;
- no productive PVC ownership or foreign implementation authority moves to Compliance.

The overall Compliance function is intentionally **not terminal**: COMP-01, COMP-02 and COMP-08 remain continuous, and externally held findings remain open until adequate owner/legal/evidence returns are independently reassessed. Finalizing this roadmap means eliminating stale or locally actionable backlog, not falsely closing external dependencies.