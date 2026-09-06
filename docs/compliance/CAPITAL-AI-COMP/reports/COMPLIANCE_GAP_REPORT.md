# CAPITAL-AI Compliance Gap Report

**Document ID:** `DOC-COMP-GAP-REPORT-2026-08-31`  
**Role:** assessment report / non-authorizing  
**Version:** 1.3.0  
**Date:** 2026-09-06  
**Baseline:** `main@7fe061a897f669fd21ca4c46e564351e14f1c7dc`

A finding is not a certification judgment and does not transfer technical, Governance-lifecycle or legal ownership to Compliance. Current ownership uses the canonical `PVC-*` namespace from `docs/projects/PROJECT_VALUE_CHAIN.md`; historical `VC-*` labels are retained only where needed to interpret prior evidence.

| Finding | Priority | requirement | applicability | affected_project | affected_pvc | evidence | assessment | required_remediation / return evidence | legal_review_required | status |
|---|---:|---|---|---|---|---|---|---|---|---|
| COMP-GAP-001 — requested `CAPITAL-AI-QM` project structure absent | P3 | repository project-structure correlation | APPLICABLE to consolidation method | `CAPITAL-AI-QM` | N/A — cross-cutting | `docs/projects/quality-management/README.md` now exists on current main | structural evidence now present; no authority activation inferred | no Compliance remediation remains; any lifecycle/authority decision stays with current QM/Governance authority | false | RESOLVED_ON_MAIN |
| COMP-GAP-002 — ADR-0007 lifecycle/semantic ambiguity | P2 | REQ-COMP-012 / claim boundary | APPLICABLE | `CAPITAL-AI-GOV` | `PVC-05` | Human-merged PR #755 established stable historical/non-authorizing registry state; PR #758 aligned the canonical ADR document | COMPLIANT for bounded historical-authority handling | no further Compliance remediation; reopen only on contradictory current-authority evidence | false | RESOLVED_ON_MAIN |
| COMP-GAP-003 — ESS-0006 stale implementation/content assumptions | P2 | REQ-COMP-012/029/033 | APPLICABLE | `CAPITAL-AI-GOV` | `PVC-05` | Human-merged PR #757 established bounded ESS-0006 v1.1.0 semantics | COMPLIANT for bounded current component semantics | no further Compliance remediation; unrelated Security/evidence gaps stay independent | false | RESOLVED_ON_MAIN |
| COMP-GAP-004 — vendor/transfer evidence incomplete | P1 | REQ-COMP-017 | PARTIALLY_APPLICABLE | Human/Legal + actual provider/domain owner | `REQUIRES_CORRELATION` per actual provider/flow | vendor inventory and partial DPA/subprocessor/transfer evidence; flow-specific role/TIA/contract evidence remains incomplete | EVIDENCE_MISSING | return actual-provider role, contract/DPA/subprocessor/transfer/TIA and region evidence only where applicable | true where legal transfer/role interpretation is required | REMEDIATION_ASSIGNED |
| COMP-GAP-005 — Human AI-literacy evidence absent | P2 | REQ-COMP-021 | PARTIALLY_APPLICABLE | Human Owner / organizational operator; technical owner only if a separate technical gap is proven | N/A for organizational evidence | `docs/compliance/AI_LITERACY_CONTROL.md` is a control specification; attributable Human completion/acknowledgement evidence is not established | EVIDENCE_MISSING | return competent role/applicability decision plus real training/acknowledgement evidence; do not fabricate records | true where obligation/role interpretation is required | REMEDIATION_ASSIGNED |
| COMP-GAP-006 — DORA entity/activity scope unresolved | P2 | REQ-COMP-022 | REQUIRES_LEGAL_REVIEW | Human Owner / Legal | unresolved until a concrete applicable obligation is established | FinTech/product functionality is evidenced, but regulated entity/business/activity status is not | NOT_ASSESSED | determine actual legal entity/activity applicability from competent facts; create technical remediation only after a concrete obligation is established | true | LEGAL_REVIEW |
| COMP-GAP-007 — measured backup/restore evidence missing | P1 | REQ-COMP-032 | APPLICABLE | `CAPITAL-AI-OPS` + independent Security verification | `PVC-08` | current Operations/S1 surfaces still record S1-R2-07 approved RPO/RTO plus recurring encrypted off-site backup and isolated measured restore as open | EVIDENCE_MISSING | return measured backup age/RPO, isolated restore drill, measured RTO and integrity verification; remediate only in OPS/Security-owned scope if the evidence proves a defect | false | REMEDIATION_ASSIGNED |
| COMP-GAP-008 — Compliance document-registry treatment open | P2 | REQ-COMP-011/035 | APPLICABLE | `CAPITAL-AI-DOC` / `CAPITAL-AI-GOV` | `PVC-03` / `PVC-05` by actual surface | Compliance documents use canonical `docs/compliance/**` placement and stable `DOC-*` IDs; shared `document-registry.json` treatment is not established by Compliance-owned evidence | PARTIALLY_COMPLIANT | Documentary/Governance decides whether registry entries are required and returns evidence; Compliance must not mutate the shared registry in a foreign-owner branch | false | REMEDIATION_ASSIGNED |

## Priority summary — current open findings

- P0 CRITICAL: **0**
- P1 HIGH: **2** (`COMP-GAP-004`, `COMP-GAP-007`)
- P2 MEDIUM: **3** (`COMP-GAP-005`, `COMP-GAP-006`, `COMP-GAP-008`)
- P3 LOW: **0 open**
- Resolved on current main: **3** (`COMP-GAP-001`, `002`, `003`)

No regulatory criticality is inferred solely from the name of a regulation or standard.

## Evidence/owner-held requirement set

The following inputs remain explicitly held and are not promoted to PASS:

- `REQ-COMP-017` — provider/vendor/transfer evidence;
- `REQ-COMP-019` — complete affected AI output/transparency surface evidence;
- `REQ-COMP-021` — attributable Human AI-literacy evidence;
- `REQ-COMP-031` — complete binding contract universe/effective versions;
- `REQ-COMP-032` — measured recovery/continuity evidence;
- `REQ-COMP-033` — end-to-end audit/traceability coverage/freshness;
- `REQ-COMP-034` — end-to-end DATA→FINTECH provenance/lineage/quality evidence.

`REQ-COMP-018`, `020`, `022`, `023`, `037`, `038`, `039` remain legal/scope-held where competent Human/Legal classification is required.

## Assignment check

Every currently actionable remediation is outside productive Compliance ownership. `CAPITAL-AI-COMP` may normalize findings, specify return evidence and reassess the returned result, but it does not implement foreign runtime, Security, Documentary/Governance registry, contract/legal or organizational-training work.

## Closure rule

A finding closes only after adequate current evidence or a competent decision is returned and `COMP-04` independently reassesses it. A merged target PR, a roadmap claim, a control mapping or an `EVIDENCE_READY` marker alone is not sufficient for closure.
