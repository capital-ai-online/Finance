# ADR / ESS Compliance Correlation Matrix

**Document ID:** `DOC-COMP-ADR-ESS-CORRELATION-2026-08-31`  
**Role:** inventory / correlation report / non-authorizing  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

This matrix does not modify ADR/ESS lifecycle. It identifies Compliance-relevant relationships and gaps against the current registries. Any lifecycle remediation remains Governance/ADR/ESS-owner work, not Compliance execution.

| Artifact | Registry state / authority | Compliance relevance | Classification | Finding / rationale | V2.1 Compliance action |
|---|---|---|---|---|---|
| `ADR-0007-compliance-value-chain.md` | present in legacy `adr_history.json` as ACCEPTED; **not migrated into current `docs/adr/registry.json`** | historical Compliance value-chain decision | **CLARIFY / MIGRATE-GAP** | mixes technical product architecture with historical legal assertions and automated certification language; current Control Plane requires scoped evidence and no unsupported claims | COMP-03/04/05/06 records gap; Governance/Owner owns any future lifecycle action |
| `ADR-0012-SecurityComplianceAuditor.md` | resolved implementation document | native Compliance scanner/reporting implementation | **KEEP** | explicitly says internal scanner/ISO mappings are not legal certification | COMP-06/08 reuses runtime/evidence; no duplicate auditor |
| `ADR-0017-audit-nachbesserungen-quota-supabase-stripe-compliance.md` | legacy accepted implementation decision / revalidation evidence exists | backend/persistence support for ADR-0012 | **KEEP / CONSUMER** | technical implementation evidence, not Compliance authority hierarchy | COMP-03/06 references as implementation evidence |
| ADR-0086 vendor privacy evidence governance | current registry `accepted-for-implementation`, stable authority `AUTH-ADR-VENDOR-PRIVACY-EVIDENCE-2026-08-19` | vendor/privacy evidence governance | **KEEP** | current stable authority; open evidence can be assessed centrally | COMP-01/02/03/04/06; missing evidence via COMP-07 handoff |
| ADR-0092 privacy retention | current registry `accepted-for-implementation`, stable authority `AUTH-ADR-PRIVACY-RETENTION-2026-08-19` | retention/lifecycle | **KEEP** | current domain authority; implementation remains Privacy/Data-owned | COMP-03/04/06; remediation via `[COMPLIANCE_HANDOFF -> PRIVACY-DATA | VC-09]` if confirmed |
| ADR-0095 privacy single source | current registry accepted, stable authority `AUTH-ADR-PRIVACY-SINGLE-SOURCE-2026-08-19` | privacy source-of-truth boundary | **KEEP** | prevents parallel privacy governance | COMP-03 references; no parallel privacy policy |
| ADR-0096 Governance Control Plane | current registry accepted, stable authority `AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19` | repository Authority/Control Plane | **KEEP** | primary boundary preventing Compliance from creating parallel governance | all COMP artifacts subordinate |
| ADR-0097 Documentary maintenance loop | current registry accepted | records/evidence lifecycle sidecar | **KEEP / CONSUMER** | Documentary remains bounded evidence provider | COMP-03/04/06; Documentary remediation stays target-owned |
| ADR-0099 FinTechCore Crypto Module | current registry accepted | research/live-execution and evidence boundaries | **KEEP / CONSUMER** | technical/domain authority remains outside Compliance | COMP-03/04/06; target remediation via COMP-07 |
| ESS-0005 Quality Center | ESS registry `published`, implementation status partial | Quality Management boundary/evidence producer | **KEEP** | Quality Center exists as component, but no canonical `CAPITAL-AI-QM` project tree exists on baseline | consume QM evidence only; `COMP-GAP-001` records missing requested project-template reference |
| ESS-0006 Security & Compliance | ESS registry `published` v1.0.0 | component specification for `src/platform/Security` and `src/platform/Compliance` | **CLARIFY** | valid registered artifact but body contains historical paths/open findings/events and an older `ComplianceRequirementRegistry` concept that must not become a second normative registry | COMP-03/05/06 records clarification gap; reuse component/evidence principle only |
| ESS-0010 Documentary Engine | ESS registry published | report/evidence producer | **KEEP / CONSUMER** | Documentary owns physical document/evidence implementation | COMP-06 consumes evidence; technical fixes via COMP-07 to Documentary |
| ESS-0011 Enterprise Traceability | ESS registry published/currently registered | traceability relationships | **KEEP / CONSUMER** | partial runtime implementation does not block document/evidence links | COMP-03/06 uses traceability relationships; no replacement |
| ESS-0012 Documentation Governance | ESS registry published, explicitly `documentation-only` | document hygiene/evidence integrity | **KEEP** | must not become global Compliance or merge authority | COMP-03/06 consumer |
| ESS-0019 Universal AI Agent Control Plane | current authority `AUTH-ESS-AI-AGENT-CAPABILITY-PLANE` | AI capability/risk/audit boundaries | **KEEP** | explicitly subordinate to AGENTS/current Control Plane | COMP-01/02/03/04/08 consumer |

## Conflicts / gaps

- **ADR lifecycle/semantic gaps:** 1 — ADR-0007.
- **ESS clarification gaps:** 1 — ESS-0006.
- **Current stable P0 Authority conflicts identified:** 0.
- **New ADRs created:** 0.
- **New ESS records created:** 0.
- **New Controls/Authorities created:** 0.

## Handoff boundary

If a future decision is made to migrate/clarify/supersede/archive ADR-0007 or materially update ESS-0006, that work must run under the responsible Governance/ADR/ESS owner and its own scoped work item/branch/PR. `CAPITAL-AI-COMP` only preserves the finding, source evidence and post-change assessment.
