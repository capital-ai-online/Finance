# CAPITAL-AI Compliance Roadmap

**Project ID:** `CAPITAL-AI-COMP`  
**Role:** `CROSS_CUTTING_COMPLIANCE`  
**Document ID:** `DOC-COMP-ROADMAP-2026-08-31`  
**Document role:** roadmap / non-authorizing projection  
**Version:** 1.8.4  
**Date:** 2026-09-10  
**Current-main reconciliation baseline:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`  
**Status:** ACTIVE — ALL 8 COMPLIANCE WORK PACKAGES PROCESSED LOCALLY; CURRENT RETURNS REASSESSED / EXTERNAL GATES PRESERVED  
**Primary Project Value Chain ownership:** none (`[]`)

## Mission and ownership boundary

`CAPITAL-AI-COMP` owns applicability, requirement/control mapping, evidence-based assessment, findings, evidence sufficiency, regulatory traceability, remediation handoff and continuous reassessment. It owns no productive `PVC-*` stage, does not implement foreign remediation and does not replace Human/Legal Review.

Project ownership resolves only through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Missing evidence, unresolved legal scope and foreign-owner gaps never become PASS by inference.

## Local closeout and current reassessment objective

Human-merged PR #768 completed the bounded locally executable Compliance closeout. The 2026-09-10 reassessment consumes material current-main Documentary and DATA returns without collapsing foreign Primary-Owner remediation, Security verification or Human/Legal decisions into Compliance.

The eight canonical work packages remain in truthful states:

- `DONE_ON_MAIN` — bounded result Human-merged;
- `EXECUTED_CONTINUOUS` — the current review cycle was executed and the workstream remains continuous by design;
- `EXECUTED_HELD` — Compliance completed its local assessment/routing work and is waiting for external evidence or a competent decision;
- `RESOLVED_ON_MAIN` — a finding has adequate current-main evidence and no longer requires an active Compliance remediation handoff.

## Current-main correlation — 2026-09-10

1. `/AGENTS.md` v2.9.0 and `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a` are the current execution baseline.
2. `CAPITAL-AI-COMP` remains cross-cutting with no productive `PVC-*` ownership; current project folder is `docs/projects/compliance/`.
3. Human-merged PR #761 retains the COMP-04 READY_NOW assessment baseline: 23/23 `READY_NOW` requirements are assessed.
4. Human-merged PR #768 consolidated the original locally executable COMP-01..08 closeout and remains the implementation baseline for that bounded cycle.
5. Governance PR #775 established the Governance/PVC-05 decision for `COMP-GAP-008`: **NO REGISTRY CHANGE REQUIRED UNDER CURRENT CONTRACT**.
6. Documentary PR #838, merged as `96119f958cacbf35614747380a066b87fdb1ee40`, synchronized Document Registry/Hygiene with the current `AUTH-GOV-DOCUMENT-LIFECYCLE` policy surface.
7. Documentary PR #866, merged as `12ca12017916990e83ed213be781574c61808949`, returned the bounded `GOV-DOC-005` implementation. Markdown documentation under `docs/` is accepted directly; only documentation outside `docs/` requires an exact registered exception. Compliance artifacts remain canonically placed under `docs/compliance/**` with stable `DOC-*` identities.
8. Compliance independently reassesses the returned Governance/Documentary evidence as adequate for the bounded internal finding: **`COMP-GAP-008` is `RESOLVED_ON_MAIN`**. `REQ-COMP-011` is promoted to bounded `COMPLIANT`. `REQ-COMP-035` remains `PARTIALLY_COMPLIANT` because external record-keeping duties are regime-/scope-specific and are not decided by repository lifecycle evidence.
9. DATA PRs #811/#812/#817/#822/#824 plus Human-merged PR #827 materially advance `REQ-COMP-033/034`. Current `ValidatedDataInput/1.0.0` composes provider-input validation, capability freshness, provenance lineage and the Data Quality gate with fail-closed status semantics.
10. DATA evidence for identity/freshness remains `EVIDENCE_READY`, not Security-verified. Correction-version lineage is also retained as a DATA architecture residual.
11. `REQ-COMP-033` therefore remains held: the DATA persistence/freshness return is consumed, but current OPS roadmap still marks `OPS-18` EventMesh/Traceability as `PARTIAL`, and independent Security evidence for relevant evidence-identity/freshness semantics remains open.
12. `REQ-COMP-034` remains held: DATA upstream is materially implemented and composed, but current FINTECH roadmap retains FIN-12 `PARTIAL — UPSTREAM EXIT COMPOSED / FINTECH MAPPING OPEN`, FIN-17 `PARTIAL / OPEN` and FIN-20 `PARTIAL / OPEN`. Exact feature/model/score/rank/trace lineage is not yet reproducible end to end.
13. `COMP-GAP-007` / `REQ-COMP-032` remains open. The recovery harness is implemented on main, while measured operational backup/restore/integrity/RPO/RTO evidence and independent Security verification remain pending.
14. `src/platform/Compliance` remains the already implemented ADR-0012 / ESS-0006 technical boundary. No current finding or roadmap item authorizes a new local Compliance runtime/validator path; `CODE_DELTA_REQUIRED = NO` for this reassessment.
15. No current evidence supports inventing a new `REQ-COMP-*` input, a new `AUTH-*`/`CTRL-*`, a second Compliance registry or a new productive PVC stage.

## Active assessment universe

Active inputs: **37**. Retired historical inputs excluded: **2** (`REQ-COMP-026`, `REQ-COMP-027`).

| Queue | Count | Current state |
|---|---:|---|
| `READY_NOW` | **23** | **23/23 ASSESSED; current Documentary return reassessed** |
| `EVIDENCE_OR_OWNER_HELD` | **7** | **7/7 reviewed; current DATA return consumed while external gates remain** |
| `LEGAL_OR_SCOPE_HELD` | **7** | **7/7 reviewed; competent Human/Legal scope decision still required where applicable** |
| **Total active** | **37** | **fully partitioned; no silent PASS** |

## Work-package closeout state

| WP | Workstream | Current state | Exit condition / retained gate |
|---|---|---|---|
| `COMP-01` | Applicability | `EXECUTED_CONTINUOUS` | 37 active inputs remain partitioned; legal ambiguity stays `UNKNOWN` / `REQUIRES_LEGAL_REVIEW`. |
| `COMP-02` | Requirements | `DONE_ON_MAIN / CONTINUOUS` | 37 active requirement/assessment inputs remain current; 2 NIST-derived IDs remain retired/historical and excluded. |
| `COMP-03` | Control Mapping | `DONE_ON_MAIN` | 37/37 inputs mapped to existing Authority/Controls/ADR/ESS and current `PVC-*` owner surfaces without duplicate authority; current Documentary/DATA return states are reflected. |
| `COMP-04` | Assessment | `DONE_ON_MAIN / CURRENT RETURN REASSESSED` | 23/23 `READY_NOW` remain assessed; `REQ-COMP-011` is now bounded `COMPLIANT` after adequate current-main Documentary/Governance return evidence. |
| `COMP-05` | Findings | `EXECUTED_CURRENT` | `COMP-GAP-008` terminalized as `RESOLVED_ON_MAIN`; other open findings remain evidence-/owner-/legal-gated. |
| `COMP-06` | Evidence | `EXECUTED_HELD` | DATA current return is consumed as positive upstream evidence; OPS/Security/FINTECH end-to-end gates remain open. |
| `COMP-07` | Remediation Handoff | `EXECUTED_HELD` | stale `COMP-GAP-008` DOC/GOV handoffs are terminalized; active handoffs retain current `PVC-*` ownership and `execute_foreign_work=false`. |
| `COMP-08` | Continuous Compliance | `EXECUTED_CONTINUOUS` | current-main impact review executed through Documentary #838/#866 and DATA #827 without false closure of remaining gates. |

## COMP-04 READY_NOW result — current reassessment

| Assessment | Count | Requirements |
|---|---:|---|
| `COMPLIANT` | **9** | `001`, `003`, `004`, `006`, `007`, `008`, `011`, `012`, `029` |
| `PARTIALLY_COMPLIANT` | **11** | `002`, `005`, `009`, `010`, `013`, `014`, `015`, `016`, `030`, `035`, `036` |
| `NON_COMPLIANT` | **0** | none demonstrated in this bounded set |
| `NOT_APPLICABLE` | **3** | `024`, `025`, `028` — binding-authority scope only |

`COMPLIANT` is bounded to the stated evidence scope only and is not a certification, blanket legal-compliance statement or permanent future-state claim.

`REQ-COMP-011` changed from `PARTIALLY_COMPLIANT` to bounded `COMPLIANT` because its retained internal Documentary/Governance return gate is now satisfied by current-main evidence. `REQ-COMP-035` does not inherit that promotion: external records/retention duties remain conditional on applicable legal/regulatory scope and evidence.

## Current finding state after COMP-05 re-correlation

| Finding | Current state | Compliance conclusion / gate |
|---|---|---|
| `COMP-GAP-001` QM project structure absent | `RESOLVED_ON_MAIN` | `docs/projects/quality-management/` exists; structural presence does not activate proposed authority. |
| `COMP-GAP-002` ADR-0007 lifecycle/authority ambiguity | `RESOLVED_ON_MAIN` | PR #755 plus #758 establish stable historical/non-authorizing treatment. |
| `COMP-GAP-003` ESS-0006 stale semantics | `RESOLVED_ON_MAIN` | PR #757 establishes bounded ESS-0006 component semantics. |
| `COMP-GAP-004` vendor/transfer evidence | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal plus actual provider/domain owner must return flow-specific contractual/transfer evidence. |
| `COMP-GAP-005` Human AI-literacy evidence | `EVIDENCE_MISSING` | control specification exists; attributable Human training/acknowledgement evidence is still not established. |
| `COMP-GAP-006` DORA entity/activity scope | `NOT_ASSESSED / LEGAL_REVIEW` | no competent entity/business applicability decision is inferred from FinTech functionality. |
| `COMP-GAP-007` measured recovery | `EVIDENCE_MISSING / OPEN` | recovery harness exists, but operational backup/restore execution, measured RPO/RTO/integrity and Security verification remain pending. |
| `COMP-GAP-008` document-registry treatment | `RESOLVED_ON_MAIN` | Governance #775 plus Documentary #838/#866 establish the current internal lifecycle/registry/path treatment; Compliance reassessment finds no remaining bounded remediation for this finding. |

No P0 finding is demonstrated by current evidence.

## COMP-06 held-set result

### EVIDENCE_OR_OWNER_HELD — 7

- `REQ-COMP-017`: provider/vendor role, DPA/subprocessor/transfer/TIA evidence remains flow-specific and incomplete.
- `REQ-COMP-019`: customer-facing/generated-content transparency evidence remains incomplete across all material output surfaces.
- `REQ-COMP-021`: Human AI-literacy completion/acknowledgement evidence remains absent; Compliance does not fabricate records.
- `REQ-COMP-031`: complete binding customer/provider/partner contract universe and effective versions remain unestablished.
- `REQ-COMP-032`: the OPS recovery harness is implemented, but measured operating backup/restore/integrity/RPO/RTO evidence and independent Security verification remain missing; status remains `EVIDENCE_MISSING`.
- `REQ-COMP-033`: DATA evidence identity/freshness and the composed `ValidatedDataInput` exit are positive returned evidence. The requirement remains held because `OPS-18` end-to-end transport/traceability is still `PARTIAL` and independent Security evidence remains open.
- `REQ-COMP-034`: DATA provider validation, freshness, provenance and DQ are composed fail-closed upstream. The requirement remains held because FIN-12/FIN-17/FIN-20 leave feature/score/rank/end-to-end lineage incomplete; correction-version lineage also remains an explicit DATA residual.

### LEGAL_OR_SCOPE_HELD — 7

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain `NOT_ASSESSED` or scope-held exactly where Human/Legal classification is required. Engineering facts and source-text updates are inputs only; they do not substitute a competent legal decision.

## COMP-07 routing invariant

All current remediation handoffs use the canonical `PVC-*` namespace and the Primary Owner resolved from `docs/projects/README.md` / `PROJECT_VALUE_CHAIN.md`. Historical `VC-*` marker text is migration history only and is not current ownership authority.

The split Documentary/Governance handoff for `COMP-GAP-008` is terminal after current-main return evidence and independent Compliance reassessment. No new Registry mutation is requested. Active foreign returns remain for vendor/legal, Operations recovery/traceability, Security verification, FINTECH downstream lineage, Human training evidence and other scope-specific obligations.

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

For this 2026-09-10 reassessment:

- implemented code boundary reviewed: `src/platform/Compliance/**`;
- new local Compliance code backlog found: **none**;
- required code delta: **none**;
- required documentation/evidence delta: **current-main baseline, Documentary #838/#866 return reassessment, `COMP-GAP-008` terminalization, DATA #811/#812/#817/#822/#824/#827 return consumption, and precise retention of OPS/Security/FINTECH gates for `REQ-COMP-033/034`**.

## Roadmap completion condition

The **bounded local roadmap closeout remains complete**. The 2026-09-10 reassessment removes stale local projection state rather than reopening a Compliance runtime backlog:

- Governance #775 and Documentary #838/#866 provide adequate current-main evidence to close `COMP-GAP-008` for the bounded internal lifecycle/registry treatment;
- current DATA returns are consumed as positive upstream evidence for `REQ-COMP-033/034`;
- `REQ-COMP-033/034` remain held where end-to-end OPS/Security/FINTECH evidence is still incomplete;
- `COMP-GAP-007` and Human/Legal/evidence-held findings remain explicit;
- no productive PVC ownership or foreign implementation authority moves to Compliance.

The overall Compliance function is intentionally **not terminal**: COMP-01, COMP-02 and COMP-08 remain continuous, and externally held findings remain open until adequate owner/legal/evidence returns are independently reassessed. Finalizing this roadmap means eliminating stale or locally actionable backlog, not falsely closing external dependencies.
