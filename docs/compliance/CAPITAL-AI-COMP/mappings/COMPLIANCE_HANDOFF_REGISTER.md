# Compliance Remediation Handoff Register

**Document ID:** `DOC-COMP-HANDOFF-REGISTER-2026-08-31`  
**Role:** traceability / non-authorizing  
**Version:** 1.0.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

`CAPITAL-AI-COMP` records and assesses findings but does not execute foreign technical remediation. Every row below includes a target roadmap/reference as required by V2.1.

| Marker | requirement | applicability | affected_project | affected_vc_stage | evidence | assessment | required_remediation | legal_review_required | status | Target roadmap/reference |
|---|---|---|---|---|---|---|---|---|---|---|
| `[COMPLIANCE_HANDOFF -> PRIVACY-LEGAL | VC-09]` | REQ-COMP-017 | APPLICABLE | Privacy / Legal | VC-09 | partial vendor inventory, DPA/subprocessor evidence | EVIDENCE_MISSING | provide/confirm applicable vendor role, contract/transfer evidence and scope; technical/legal source owners retain execution | true where transfer/legal interpretation is needed | REMEDIATION_ASSIGNED | `docs/roadmaps/DSGVO_REMEDIATION_2026-08-19.md`; `docs/compliance/vendor-evidence/**` |
| `[COMPLIANCE_HANDOFF -> PRIVACY-DATA | VC-09]` | REQ-COMP-016 | APPLICABLE | Privacy / Data | VC-09 | retention-as-code documentation and implementation references; current operational evidence incomplete | PARTIALLY_COMPLIANT | provide current execution/evidence for applicable retention mechanisms; fix implementation only in Privacy/Data scope if gap confirmed | false | REMEDIATION_ASSIGNED | `docs/roadmaps/DSGVO_REMEDIATION_2026-08-19.md`; ADR-0092 |
| `[COMPLIANCE_HANDOFF -> S1 | VC-01]` | REQ-COMP-009 | APPLICABLE | S1 Security | VC-01 | S1-R2 entitlement evidence; broader R2-06 remains open | PARTIALLY_COMPLIANT | complete target-owned authorization/entitlement remediation and return exact evidence | false | REMEDIATION_ASSIGNED | `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md` |
| `[COMPLIANCE_HANDOFF -> S1 | VC-08]` | REQ-COMP-032 | APPLICABLE | S1 / Operations | VC-08 | S1-R2-07 is open/unverified | EVIDENCE_MISSING | produce measured backup/restore/continuity evidence and implement any required target-domain remediation | false | REMEDIATION_ASSIGNED | `docs/roadmaps/S1_SECURITY_HARDENING_ROADMAP.md`; current Operations handoff/runbooks |
| `[COMPLIANCE_HANDOFF -> LEGAL-OWNER | VC-08]` | REQ-COMP-022 | REQUIRES_LEGAL_REVIEW | Human Owner / Legal | VC-08 | FinTech functionality exists; entity/business regulatory scope not established | NOT_ASSESSED | determine DORA entity/applicability scope from actual legal entity/business/service facts; no predetermined conclusion | true | LEGAL_REVIEW | `docs/compliance/CAPITAL_AI_REGULATORY_CONTROL_MATRIX_2026-08-19.md`; `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` |
| `[COMPLIANCE_HANDOFF -> LEGAL-OWNER | VC-17]` | REQ-COMP-018/020 | PARTIALLY_APPLICABLE | Human Owner / Legal / Product | VC-17 | AI inventory and decision-support boundaries exist; high-risk role not established | NOT_ASSESSED | determine legal role/use-case classification when a triggering purpose/user/decision context exists | true | LEGAL_REVIEW | `docs/compliance/AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md`; `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` |
| `[COMPLIANCE_HANDOFF -> OWNER-OPERATIONS | VC-01]` | REQ-COMP-021 | PARTIALLY_APPLICABLE | Human Owner / Operations | VC-01 | `AI_LITERACY_CONTROL.md` exists; human training/ack evidence is absent | EVIDENCE_MISSING | provide competent human/organizational AI-literacy evidence if applicability is confirmed; do not fabricate records | true for obligation interpretation | REMEDIATION_ASSIGNED | `docs/compliance/AI_LITERACY_CONTROL.md`; `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` |
| `[COMPLIANCE_HANDOFF -> DOC | VC-03]` | REQ-COMP-035 | APPLICABLE | Documentary | VC-03 | lifecycle/registry controls exist; legacy/stale-document gaps remain under assessment | PARTIALLY_COMPLIANT | correct documentary implementation/registry/lifecycle defects only if confirmed; return evidence | false | TRIAGED | `docs/architecture/DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`; Documentary maintenance work packages |
| `[COMPLIANCE_HANDOFF -> SEO-GM | VC-01]` | REQ-COMP-013/019/030 | PARTIALLY_APPLICABLE | SEO-GM | VC-01 | consent/provider/output evidence exists; change impact remains continuous | NOT_ASSESSED for future changes | when COMP-08 identifies a material gap, implement it in SEO-GM and return evidence | depends on requirement | DEFERRED | `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md` |
| `[COMPLIANCE_HANDOFF -> FINTECH-CORE-CRYPTO | VC-17]` | REQ-COMP-020/036 | PARTIALLY_APPLICABLE | FinTech Core Crypto | VC-17 | research/live-execution boundaries documented | NOT_ASSESSED for future boundary changes | preserve or remediate target-owned execution/decision boundary if a compliance gap is confirmed | depends on use case | DEFERRED | `docs/roadmaps/FINTECH_CORE_CRYPTO_MODULE_01_ROADMAP.md` |
| `[COMPLIANCE_HANDOFF -> AI-T | VC-17]` | REQ-COMP-019 | PARTIALLY_APPLICABLE | AI Transparency / affected Product domain | VC-17 | ESS-0019 + content-transparency material; all output paths not verified | PARTIALLY_COMPLIANT | close affected-output evidence/implementation gaps in the owning product/AI roadmap; return evidence | depends on legal scope | TRIAGED | `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` AI-T entry; existing AI transparency contract/material |

## Handoff rules

1. `execute_foreign_work = false`.
2. Handoff status never means target implementation is complete.
3. `IMPLEMENTED`/`EVIDENCE_READY` are set only after target-owned work returns evidence.
4. Compliance independently reassesses returned evidence before `VERIFIED` or `CLOSED`.
5. `LEGAL_REVIEW` remains fail-closed and does not encode a predetermined legal answer.
6. New handoffs must be surfaced in the chat completion report.
