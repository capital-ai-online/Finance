# Compliance Remediation Handoff Register

**Document ID:** `DOC-COMP-HANDOFF-REGISTER-2026-08-31`  
**Role:** traceability / non-authorizing  
**Version:** 1.3.1  
**Date:** 2026-09-10  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@6d2b78b7914f9771c5fa8a88c6e6bcd40019114a`

`CAPITAL-AI-COMP` records and assesses findings but does not execute foreign technical, Governance-lifecycle, organizational or legal remediation. Current owner routing uses only the canonical `PVC-*` namespace from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`.

Historical `[COMPLIANCE_HANDOFF -> ... | VC-NN]` strings remain audit/migration history only. New/current handoffs use:

```text
[COMPLIANCE_HANDOFF -> <TARGET_PROJECT_OR_GATE> | PVC-<NN>]
```

When no productive PVC can truthfully be assigned before a Human/Legal/provider-scope decision, use `PVC-N/A — REQUIRES_CORRELATION` rather than guessing ownership.

| Marker | Requirement / finding | Applicability | Target / affected owner | PVC | Evidence / assessment | Required return | Legal gate | Status | Target roadmap/reference |
|---|---|---|---|---|---|---|---|---|---|
| `[COMPLIANCE_HANDOFF -> HUMAN-LEGAL-PROVIDER | PVC-N/A]` | `REQ-COMP-017` / `COMP-GAP-004` | PARTIALLY_APPLICABLE | Human/Legal + actual provider/domain owner | `PVC-N/A — REQUIRES_CORRELATION` | partial vendor inventory, DPA/subprocessor/transfer evidence; flow-specific role/TIA/contract evidence incomplete / `EVIDENCE_MISSING` | actual-provider role, DPA/contract, subprocessor, transfer/TIA and region evidence where applicable | required for role/transfer interpretation | REMEDIATION_ASSIGNED | `docs/compliance/vendor-evidence/**`; affected provider/domain roadmap after correlation |
| `[COMPLIANCE_HANDOFF -> HUMAN-OWNER | PVC-N/A]` | `REQ-COMP-021` / `COMP-GAP-005` | PARTIALLY_APPLICABLE | Human Owner / organizational operator | `PVC-N/A` | `AI_LITERACY_CONTROL.md` exists; attributable Human completion/acknowledgement evidence absent / `EVIDENCE_MISSING` | competent applicability/role decision plus real training/ack evidence | where role/obligation interpretation requires it | REMEDIATION_ASSIGNED | `docs/compliance/AI_LITERACY_CONTROL.md` |
| `[COMPLIANCE_HANDOFF -> HUMAN-LEGAL | PVC-N/A]` | `REQ-COMP-022` / `COMP-GAP-006` | REQUIRES_LEGAL_REVIEW | Human Owner / Legal | `PVC-N/A — UNRESOLVED UNTIL APPLICABILITY` | FinTech/product facts exist; regulated entity/business/activity status not established / `NOT_ASSESSED` | competent DORA entity/activity applicability determination; only then route any concrete technical obligation | required | LEGAL_REVIEW | `docs/compliance/CAPITAL_AI_REGULATORY_CONTROL_MATRIX_2026-08-19.md` |
| `[COMPLIANCE_HANDOFF -> CAPITAL-AI-OPS | PVC-08]` | `REQ-COMP-032` / `COMP-GAP-007` | APPLICABLE | `CAPITAL-AI-OPS` + independent Security verification | `PVC-08` | S1-R2-07 remains open: recovery harness is on main, but measured backup/restore/integrity/RPO/RTO operating evidence is not established / `EVIDENCE_MISSING` | measured backup age/RPO, isolated restore drill, measured RTO and integrity verification; target-owned remediation if evidence proves a defect | false | REMEDIATION_ASSIGNED | `docs/projects/operations/ROADMAP.md`; `docs/projects/operations/WORK_PACKAGES.md`; `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` |
| `[COMPLIANCE_HANDOFF -> CAPITAL-AI-CLIENT | PVC-01]` | `REQ-COMP-019` where client-facing AI transparency gap is confirmed | PARTIALLY_APPLICABLE | `CAPITAL-AI-CLIENT` | `PVC-01` | customer-facing/generated-content inventory not exhaustively verified / held evidence | implement only a confirmed Client-owned response/UX transparency gap and return evidence | depends on legal scope | DEFERRED_TRIGGER | `docs/projects/agent-client/ROADMAP.md`; `docs/contracts/AI_CONTENT_TRANSPARENCY_CONTRACT.md` |
| `[COMPLIANCE_HANDOFF -> CAPITAL-AI-DOC | PVC-03]` | `REQ-COMP-019` where documentary/generated-content gap is confirmed | PARTIALLY_APPLICABLE | `CAPITAL-AI-DOC` | `PVC-03` | documentary AI-output evidence remains scope-specific / held evidence | implement only a confirmed Documentary-owned transparency/record gap and return evidence | depends on legal scope | DEFERRED_TRIGGER | current Documentary roadmap; `docs/contracts/AI_CONTENT_TRANSPARENCY_CONTRACT.md` |
| `[COMPLIANCE_HANDOFF -> CAPITAL-AI-FINTECH | PVC-17]` | `REQ-COMP-019/020/039` when ranking/decision-support trigger is confirmed | conditional / legal-gated | `CAPITAL-AI-FINTECH` | `PVC-17` | current decision boundary is factual evidence, not legal classification | preserve/remediate target-owned ranking/decision boundary only after a concrete Compliance/Legal trigger; return evidence | required where classification/obligation is legal | DEFERRED_TRIGGER | `docs/projects/fintech/ROADMAP.md`; ADR-0087 / ESS-0019 |
| `[COMPLIANCE_HANDOFF -> HUMAN-LEGAL-CONTRACT | PVC-N/A]` | `REQ-COMP-031` | UNKNOWN | Human/Legal + affected owner after contract correlation | `PVC-N/A — REQUIRES_CORRELATION` | complete binding customer/provider/partner contract universe and effective versions not established / held evidence | provide complete binding-contract universe/effective versions and identify affected owner/PVC only after correlation | as required | REMEDIATION_ASSIGNED | current contract/vendor/customer evidence surfaces |
| `[COMPLIANCE_HANDOFF -> CAPITAL-AI-OPS | PVC-18]` | `REQ-COMP-033` traceability transport portion | APPLICABLE | `CAPITAL-AI-OPS` | `PVC-18` | OPS-18 remains `PARTIAL`; existing trace/evidence architecture and current telemetry correlation are present, but end-to-end protected-action/compliance-event transport coverage and freshness are not fully evidenced | return end-to-end transport/traceability evidence; remediate only proven OPS-owned defects | false | REMEDIATION_ASSIGNED | `docs/projects/operations/ROADMAP.md`; ESS-0011 / ADR-0059 |
| `[COMPLIANCE_HANDOFF -> CAPITAL-AI-DATA | PVC-10]` | `REQ-COMP-033/034` evidence persistence/provenance portion | APPLICABLE | `CAPITAL-AI-DATA` | `PVC-10` plus `PVC-09..11` as actually affected | DATA-10 evidence identity is `EVIDENCE_READY`; DATA-11 quality gate, DATA-12 provenance, DATA-13 freshness and DATA-14 provider-input validation are implemented, and PR #827 composes those gates into `ValidatedDataInput/1.0.0`; correction-version lineage and independent Security verification remain explicit residuals | Compliance has consumed the current DATA return; retain Security verification and any proven DATA residual separately without reopening already returned DATA-10..14 slices | false | EVIDENCE_READY | `docs/projects/data/ROADMAP.md`; `docs/projects/data/evidence/**`; ADR-0032; ADR-0041 / ESS-0016 |
| `[COMPLIANCE_HANDOFF -> CAPITAL-AI-FINTECH | PVC-12]` | `REQ-COMP-034` downstream provenance/integrity portion | APPLICABLE | `CAPITAL-AI-FINTECH` | `PVC-12..17` as actually affected | composed DATA fail-closed exit is available upstream, but FIN-12 remains mapping-open, FIN-17 backend ranking authority remains partial/open and FIN-20 exact end-to-end scoring/ranking lineage remains partial/open | return evidence that accepted DATA evidence remains linked through feature/scoring/ranking stages and reaches required OPS trace/evidence transport; remediate only proven FINTECH-owned gaps | false | REMEDIATION_ASSIGNED | `docs/projects/fintech/ROADMAP.md`; ADR-0087 |

## Resolved historical handoffs

The former ADR-0007 (`COMP-GAP-002`) and ESS-0006 (`COMP-GAP-003`) Governance handoffs are `RESOLVED_ON_MAIN` after Human-merged PR #755/#758 and #757 respectively. They are not active remediation rows and must not be re-promoted by stale historical `VC-*` entries.

The former `COMP-GAP-001` structural QM handoff is also `RESOLVED_ON_MAIN` because `docs/projects/quality-management/` now exists. Structural presence does not by itself activate proposed QM authority.

The former split Documentary/Governance handoff for `REQ-COMP-011/035` / `COMP-GAP-008` is `RESOLVED_ON_MAIN`. Governance PR #775 established that no shared Document Registry mutation is required under the current contract; Documentary PR #838 synchronized Document Registry/Hygiene with the current lifecycle authority; Human-merged PR #866 implemented the bounded `GOV-DOC-005` path rule, under which Markdown inside `docs/` is accepted directly and only outside-`docs/` documentation needs an exact registered exception. Compliance independently reassessed those returns against the canonically placed `docs/compliance/**` artifacts and stable `DOC-*` identities. This closes only the internal document-registry/lifecycle finding and does not decide external regime-specific record-keeping obligations.

## Handoff rules

1. `execute_foreign_work = false`.
2. Handoff status never means target implementation is complete.
3. `IMPLEMENTED`/`EVIDENCE_READY` are set only after target-owned work returns evidence.
4. Compliance independently reassesses returned evidence before `VERIFIED` or `CLOSED`.
5. `LEGAL_REVIEW` remains fail-closed and does not encode a predetermined legal answer.
6. Deferred trigger-based handoffs do not imply a current defect.
7. Productive ownership is resolved only from current `PVC-*` mappings; cross-cutting COMP/SEC/QM/FE/SEO/SOCIAL roles do not acquire productive PVC ownership by assessment or verification.
8. New/current handoffs are surfaced in the chat completion report.
