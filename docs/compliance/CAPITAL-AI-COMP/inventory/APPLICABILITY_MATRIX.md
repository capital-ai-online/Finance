# Compliance Applicability Matrix

**Document ID:** `DOC-COMP-APPLICABILITY-MATRIX-2026-08-31`  
**Role:** assessment inventory / non-authorizing  
**Version:** 1.1.0  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

This matrix separates an external requirement source from the decision whether it applies to CAPITAL-AI. It is not legal advice. `UNKNOWN` and `REQUIRES_LEGAL_REVIEW` are valid fail-closed outcomes.

| Source / regime | Repository scope evidence | Applicability | Decision basis | Missing decision/evidence | Owner / handoff target | Next Compliance action |
|---|---|---|---|---|---|---|
| GDPR / DSGVO | repository documents identify controller and personal-data processing across account/profile/billing/consent/security/analytics/social/privacy-request scopes | **APPLICABLE** to the documented processing scope | privacy remediation + processing/vendor artifacts | revalidate specific legal bases, transfers, retention and current provider scope | Privacy / Human Owner / Legal | COMP-01 / COMP-02 / COMP-04 / COMP-06 |
| GDPR vendor/transfer obligations | active vendor inventory and partial DPA/subprocessor evidence | **APPLICABLE** for actual processors/transfers | vendor evidence + privacy ADRs | actual role/use, DPA/SCC/TIA/region evidence as applicable | `[COMPLIANCE_HANDOFF -> PRIVACY-LEGAL | VC-09]` | COMP-01 / COMP-02 / COMP-06 / COMP-07 |
| EU AI Act — general role/use-case inventory | user-facing AI, AI-generated summaries, Documentary/marketing AI and research tooling are documented | **PARTIALLY_APPLICABLE** | AI use cases exist; exact provider/deployer/operator role and obligation set is use-case dependent | role classification/legal review per material use case | Legal/Product when a role decision is needed | COMP-01 / COMP-02 / COMP-04 |
| EU AI Act — high-risk provisions | current inventory has no repository evidence establishing an Annex III or Annex I high-risk classification for the described purposes | **REQUIRES_LEGAL_REVIEW at trigger; not presumed applicable now** | no evidence justifies blanket high-risk classification | purpose/user/decision context and competent legal determination after relevant change | `[COMPLIANCE_HANDOFF -> LEGAL-OWNER | VC-17]` when triggered | COMP-01 / COMP-08 |
| EU AI Act — transparency candidate scope | customer-facing AI interaction/content paths and content-transparency material exist | **PARTIALLY_APPLICABLE** | engineering evidence supports candidate transparency scope; legal role/output classification still matters | affected output paths and role-specific legal scope | AI/Product/Frontend/Documentary for evidence; Legal if interpretation required | COMP-01 / COMP-02 / COMP-04 / COMP-06 |
| EU AI Act — AI literacy candidate scope | `AI_LITERACY_CONTROL.md` exists | **PARTIALLY_APPLICABLE** | repository recognizes the concern; code does not prove human literacy/training evidence | competent legal/owner confirmation + human training/ack records | `[COMPLIANCE_HANDOFF -> OWNER-OPERATIONS | VC-01]` | COMP-02 / COMP-04 / COMP-06 / COMP-07 |
| DORA | FinTech branding and financial-analysis features exist, but those facts do not prove that the operator is an entity in the DORA scope | **REQUIRES_LEGAL_REVIEW** | existing Regulatory Control Matrix treats entity scope as TBD | legal entity/business model/regulatory-status evidence | `[COMPLIANCE_HANDOFF -> LEGAL-OWNER | VC-08]` | COMP-01 / COMP-02 / COMP-07 |
| German DDG / TDDDG | public web/consent functionality and privacy/legal remediation references exist | **REQUIRES_LEGAL_REVIEW for exact obligation set** | relevance is evidenced; complete legal applicability is not | exact service/consent/market facts and legal review | Legal / Product | COMP-01 / COMP-02 |
| Consumer protection / digital contracts | consumer-contract remediation document exists | **REQUIRES_LEGAL_REVIEW** | plausible concern is documented, not a complete B2C/B2B/jurisdiction decision | user type, market, pricing/contract flow and legal review | Legal / Product | COMP-01 / COMP-02 |
| Contractual compliance | partial provider contract evidence exists | **UNKNOWN** as complete contract universe | no canonical complete inventory of all binding customer/provider/partner obligations | complete contract universe + obligation extraction | Human Owner / Legal | COMP-01 / COMP-02 / COMP-06 |
| Financial-services / supervisory requirements beyond proven scope | finance/scoring/research functionality exists | **UNKNOWN** | functionality does not establish regulated-entity/investment-service/supervisory status | business model, service characterization, jurisdictions, licenses/roles | Human Owner / Legal | COMP-01 / COMP-02 |
| ISO/IEC 27001:2022 | internal SoA and scanner crosswalk exist | **NOT_APPLICABLE as binding repository authority**; BENCHMARK | SoA explicitly states no certification proof | benchmark refresh only when useful | Security supplies evidence; Compliance assesses | COMP-02 / COMP-03 / COMP-04 / COMP-06 |
| ISO/IEC 42001:2023 | Governance standards crosswalk references AIMS concepts | **NOT_APPLICABLE as binding repository authority**; BENCHMARK | `CTRL-AIMS-PDCA-001` requires non-authorizing crosswalk treatment | Owner decision only if a bounded AIMS/certification target is desired | Governance / Human Owner | COMP-02 / COMP-03 |
| NIST SSDF / SP 800-218A | secure-SDLC governance and CI controls exist | **NOT_APPLICABLE as binding repository authority**; BENCHMARK / CONTROL SOURCE | external framework input only | maintain version-aware crosswalk | Development/Security supply implementation evidence | COMP-02 / COMP-03 |
| NIST AI RMF / GenAI profile | AI inventory/risk/evidence concerns overlap | **NOT_APPLICABLE as binding repository authority**; BENCHMARK | voluntary framework input | maintain bounded AI-risk crosswalk | AI/Product supplies implementation evidence | COMP-02 / COMP-03 |
| OWASP / CIS | security controls, scanners and hardening roadmap exist | **NOT_APPLICABLE as binding repository authority**; BENCHMARK / CONTROL SOURCE | no independent policy adoption | map only where useful to existing controls | Security supplies implementation evidence | COMP-02 / COMP-03 |

## Fail-closed rules

1. `UNKNOWN` and `REQUIRES_LEGAL_REVIEW` are not silently promoted to `APPLICABLE` or `NOT_APPLICABLE`.
2. A regulation/standard reference is not evidence of regulated-entity or certification status.
3. Product names such as FinTech, AI, scoring or compliance do not determine legal role.
4. New markets, countries, user types, processing purposes, AI models/providers, data sources or decision authority trigger `COMP-08`, followed by `COMP-01` reassessment.
5. Legal applicability decisions are traceable to repository evidence and/or a competent Human/Legal decision.
6. A Legal Review handoff does not instruct Legal which conclusion to reach.
