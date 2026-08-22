# CAPITAL-AI AI / FinTech Regulatory Control Matrix — 2026-08-19

**Document ID:** COMPLIANCE-AI-FINTECH-CONTROL-MATRIX-2026-08-19  
**Version:** `1.1.0`  
**Status:** GOVERNANCE / ENGINEERING BASELINE — applicability requires factual/legal classification  
**Owner:** CAPITAL-AI Owner / Security & Compliance  
**Review date:** 2026-08-22

> Engineering/compliance traceability artifact, not legal advice. Source requirement, legal applicability, repository control and completion evidence are distinct. `TBD`, engineering `PASS` or implemented controls must never be translated into a blanket `AI Act compliant` or `DORA compliant` claim.

## Source baseline

| Framework | Status | Engineering treatment |
|---|---|---|
| Regulation (EU) 2024/1689 — EU AI Act | binding EU law where applicable; staged application | use-case/role classification + system-specific controls |
| AI Act Art. 50 transparency | applicable transparency provisions from 2026-08-02 where conditions are met | visible AI interaction disclosure + machine-readable application transparency metadata; no blanket compliance assertion |
| EU Commission Art. 50 transparency guidance | final Commission guidance published 2026-07-20 | engineering interpretation baseline; legal sufficiency still reviewed per use case |
| EU Commission high-risk classification guidance | draft guidance/consultation state reviewed in 2026-08 baseline | do not treat draft guidance as binding final classification authority |
| Regulation (EU) 2022/2554 — DORA | binding for financial entities in scope | applicability first; repository FinTech branding alone does not establish DORA scope |
| ISO/IEC 42001:2023 | voluntary/certifiable benchmark unless otherwise required | benchmark only unless Owner adopts certification target |
| NIST AI RMF / GenAI Profile | voluntary benchmark | control-design/reference mapping only |

## A. Applicability register

| ID | Question/control | Current repository evidence | State | Remaining evidence |
|---|---|---|---|---|
| APP-AI-01 | AI-system inventory and possible provider/deployer roles per use case | `AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md` | **ENGINEERING CONTROL ESTABLISHED** | legal/factual role confirmation per deployed system |
| APP-AI-02 | prohibited/high-risk use-case classification | current asset/market research/explanation uses documented; reclassification triggers explicit | **NO CURRENT ANNEX-III MATCH IDENTIFIED FOR DOCUMENTED INTENDED PURPOSES — REVIEWABLE** | legal review before any trigger use case or material intended-purpose change |
| APP-AI-03 | Art. 50 interaction/content transparency | `/api/chat` transparency envelope + visible Enterprise Screener AI disclosure | **ENGINEERING CONTROL IMPLEMENTED ON BRANCH** | post-merge/runtime verification and content-surface inventory |
| APP-AI-04 | Art. 4 AI literacy | `AI_LITERACY_CONTROL.md` | **CONTROL DEFINED / HUMAN EVIDENCE PENDING** | role/cohort completion records and refresh cadence |
| APP-DORA-01 | operating legal entity in DORA Art. 2 scope? | repository cannot establish legal-entity status | **TBD** | legal-entity / regulated-activity classification |
| APP-DORA-02 | critical/important functions and ICT services if DORA applies | technical dependency information exists | **TBD** | business-service/ICT criticality register if scope confirmed |
| APP-ISO-01 | ISO 42001 certification target? | AIMS-like controls exist; no certification decision | **BENCHMARK** | Owner certification-scope decision |

## B. EU AI Act engineering mapping

| Control | Theme | Current repository control | Assessment | Remaining action |
|---|---|---|---|---|
| AI-ACT-04 | AI literacy | role-based `AI_LITERACY_CONTROL.md` | 🟡 control defined | record Human completion/refresh evidence |
| AI-ACT-05 | prohibited-practice screening | onboarding/reclassification gate in AI-system inventory | 🟡 | bind checklist to each new material AI use case |
| AI-ACT-06 | high-risk classification | use-case inventory with explicit triggers; no automatic “FinTech = high risk” rule | 🟡/🟢 engineering | legal confirmation when relevant intended purpose changes |
| AI-ACT-09 | risk management if high-risk | ESS-0019, risk classes, DevelopmentChain, negative tests | 🟡/🟢 architecture | system-specific legal binding if high-risk classification applies |
| AI-ACT-10 | data/data governance if high-risk | Evidence/DQ/Provenance/freshness contracts | 🟡/🟢 | system/dataset-specific bias/quality records where applicable |
| AI-ACT-11 | technical documentation if applicable | ADR/ESS/contracts/evidence/current-state registries | 🟢 foundation | system-specific technical file where legally required |
| AI-ACT-12 | logging/record keeping if applicable | AI evaluation records + durable sink path | 🟡/🟢 | verify production durability/retention/access per in-scope system |
| AI-ACT-13 | transparency/instructions if high-risk/applicable | model/prompt governance + explicit limitations | 🟡/🟢 | system-specific user/deployer instructions where required |
| AI-ACT-14 | human oversight if applicable | Human merge/Owner gates, no model self-approval | 🟢 governance foundation | name operational human oversight measures per legally in-scope system |
| AI-ACT-15 | accuracy/robustness/cybersecurity if applicable | tests, fail-closed Evidence, provider routing, Security controls | 🟡/🟢 | system-specific metrics/threshold/monitoring where required |
| AI-ACT-50 | AI interaction / generated-content transparency | `ai-content-transparency/1.0.0`, `/api/chat` envelope, visible `AI-generierte Antwort` disclosure | 🟢 engineering control on implemented surface | inventory additional synthetic-content surfaces; verify any required marking/detection obligations by content type |

### Art. 50 implementation boundary

The application control intentionally separates:

```text
AI origin
→ provider/model attribution
→ retrieval status/evidence IDs
→ grounding verification
→ citation completeness
→ Human-review status
```

Retrieval Evidence does **not** automatically set grounding or citation completeness to verified. The envelope explicitly carries `legalComplianceAssertion: not-asserted` and `financialDecisionAuthority: false`.

## C. Current AI-system classification summary

Current intended purposes covered by the repository inventory are primarily:

- user-facing research/explanatory chat;
- Enterprise Screener natural-language explanation of already-computed results;
- Documentary semantic maintenance planning;
- deterministic archive-retention planning;
- AI-assisted marketing/research content where invoked.

No current repository control declares these asset/market research uses high-risk merely because they are financial/FinTech. Reclassification/legal review is mandatory before natural-person creditworthiness/credit scoring, covered life/health insurance risk/pricing, employment, biometrics/emotion, essential-service access or other applicable high-risk/prohibited use cases.

## D. DORA mapping — conditional on scope

**Applicability gate:** none of these rows is a legal compliance assertion until `APP-DORA-01` confirms the operating entity/activity is in scope.

| Theme | Engineering readiness | Gap if DORA applies |
|---|---|---|
| governance / management responsibility | Human/Owner authority + DevelopmentChain | formal entity/management-body responsibility evidence |
| ICT risk-management framework | Security/IAM/control-plane/runbook architecture | consolidate legal-scope ICT risk framework/review |
| asset/dependency awareness | provider/service/repository inventories | canonical ICT/information-asset and criticality register |
| protection/detection | CI/Security/least privilege/audit | control-owner/effectiveness evidence per service |
| response/recovery | rollback/incident/break-glass controls | business RTO/RPO and tested recovery evidence |
| incident reporting | incident evidence architecture | legal classification/reporting workflow/timelines |
| resilience testing/TLPT | negative tests/hosted CI | risk-based programme and TLPT applicability if required |
| ICT third-party risk | provider-neutral controls | register of information, contracts, concentration/exit strategy |

## E. ISO/IEC 42001 and NIST benchmark

| Capability | Current state | Next hardening |
|---|---|---|
| scope/context | 🟡 | explicit AIMS scope if certification/management-system target adopted |
| leadership/accountability | 🟢 foundation | formal objectives/review cadence |
| AI risk/opportunity | 🟢 engineering | connect legal use-case classification to residual-risk acceptance |
| competence/awareness | 🟡 | Human AI-literacy completion evidence |
| documented information | 🟢 | maintain lifecycle/registry synchronization |
| operational controls | 🟢 | runtime transparency/durable evaluation evidence verification |
| performance evaluation | 🟡/🟢 | KPI/internal-audit cadence |
| continual improvement | 🟡/🟢 | CAPA/nonconformity linkage |
| NIST GOVERN | strong | inventory/roles/training evidence |
| NIST MAP | improved | stakeholder/impact records per use case |
| NIST MEASURE | growing | claim-level grounding/citation metrics and system thresholds |
| NIST MANAGE | strong engineering | formal residual-risk/control-effectiveness review |

## F. Evidence and claim rules

1. A legal/framework reference is not evidence of compliance.
2. Repository engineering controls are not legal-applicability proof.
3. `TBD` fails closed for blanket compliance claims.
4. `retrieval available` is not `grounded` and is not `citation complete`.
5. Human review/training may not be fabricated by model output.
6. Voluntary NIST/ISO alignment may be described only with the exact mapped controls/evidence; certification must never be implied without certification evidence.
7. Review this matrix whenever a new AI use case, regulated activity, legal entity, material provider, public synthetic-content channel or protected production capability is introduced.
