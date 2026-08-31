# Compliance Applicability Matrix

**Document ID:** `DOC-COMP-APPLICABILITY-MATRIX-2026-08-31`  
**Role:** assessment inventory / non-authorizing  
**Baseline:** `main@0f5d4f23841ef3824dec8447f700de0cd9614f16`

This matrix separates an external requirement source from the decision whether it applies to CAPITAL-AI. It is not legal advice.

| Source / regime | Repository scope evidence | Applicability | Decision basis | Missing decision/evidence | Owner | Next action |
|---|---|---|---|---|---|---|
| GDPR / DSGVO | repository documents identify a controller, account/profile/billing/consent/security/analytics/social/privacy-request processing and vendor evidence | **APPLICABLE** to documented personal-data processing scope | existing privacy remediation + processing/vendor artifacts | revalidate legal bases, transfers, retention and current production provider scope | Privacy / Human Owner / Legal | COMP-04 evidence review |
| GDPR vendor/transfer obligations | active vendor inventory and partial DPA/subprocessor evidence | **APPLICABLE** for actual processors/transfers | existing vendor evidence + privacy ADRs | complete actual vendor role/use, DPA/SCC/TIA/region evidence as applicable | Privacy / Owner / Legal | COMP-04 / COMP-13 |
| EU AI Act — general role/use-case inventory | user-facing AI, AI-generated summaries, Documentary/marketing AI and research tooling are documented | **PARTIALLY_APPLICABLE** | AI system inventory establishes AI use cases; exact provider/deployer/operator role and obligation set is use-case dependent | current role classification and legal review for each material use case | AI/Product / Compliance / Legal | COMP-01 / COMP-03 |
| EU AI Act — high-risk provisions | current inventory states no documented Annex III match for described purposes | **REQUIRES_LEGAL_REVIEW at trigger; not presumed applicable now** | no repository evidence justifies blanket high-risk classification | re-evaluate on purpose/user/decision/credit/insurance/employment or legal change | Legal / Product / Compliance | COMP-16 trigger |
| EU AI Act — Art. 50 transparency candidate scope | customer-facing AI interaction/content paths and a content-transparency contract exist | **PARTIALLY_APPLICABLE** | engineering scope indicates potential transparency duties; legal role/output classification still matters | verify affected output paths and role-specific legal scope | AI/Frontend/Documentary / Compliance | COMP-03 / COMP-10 |
| EU AI Act — AI literacy candidate scope | `AI_LITERACY_CONTROL.md` exists | **PARTIALLY_APPLICABLE** | repository recognized the concern; human evidence is not established by code | competent human/legal confirmation + training evidence | Human Owner / Compliance | COMP-03 / COMP-10 |
| DORA | FinTech branding and financial-analysis features exist, but branding/product function does not prove entity status under DORA Art. 2 | **REQUIRES_LEGAL_REVIEW** | current Regulatory Control Matrix already treats entity scope as TBD | legal entity/business model/regulatory status evidence | Human Owner / Legal | COMP-01 / COMP-02 |
| German DDG / TDDDG | privacy/legal remediation cites the regimes and public web/consent functionality exists | **REQUIRES_LEGAL_REVIEW for exact obligation set** | repository evidence supports relevance, not full legal applicability mapping | exact service/consent/market facts and legal review | Legal / Product | COMP-02 / COMP-04 |
| Consumer protection / digital contracts | consumer-contract remediation document exists | **REQUIRES_LEGAL_REVIEW** | documented remediation shows a plausible concern, not a complete jurisdiction/user-model decision | B2C/B2B user scope, markets, pricing/contract flow and legal review | Legal / Product | COMP-02 |
| Contractual compliance | partial provider contract evidence exists | **UNKNOWN** as complete universe | no canonical inventory of all binding customer/provider/partner contracts | complete contract universe + obligation extraction | Human Owner / Legal | COMP-01 / COMP-02 |
| Financial-services / supervisory requirements beyond proven scope | finance/scoring/research functionality exists | **UNKNOWN** | functionality alone does not establish regulated-entity, investment-service or supervisory status | business model, service characterization, jurisdictions, licenses/roles | Human Owner / Legal | COMP-01 / COMP-02 |
| ISO/IEC 27001:2022 | internal SoA and scanner crosswalk exist | **NOT_APPLICABLE as binding repository authority**; BENCHMARK | existing SoA explicitly says no certification proof | refresh benchmark assessment only when useful | Security / Compliance | COMP-11 / COMP-12 |
| ISO/IEC 42001:2023 | Governance standards crosswalk references AIMS concepts | **NOT_APPLICABLE as binding repository authority**; BENCHMARK | `CTRL-AIMS-PDCA-001` requires non-authorizing crosswalk treatment | Owner decision if an AIMS/certification target is ever desired | Governance / Compliance | COMP-11 |
| NIST SSDF / SP 800-218A | secure-SDLC governance and CI controls exist | **NOT_APPLICABLE as binding repository authority**; BENCHMARK / CONTROL SOURCE | external framework input only | maintain version-aware crosswalk | Development/Security / Compliance | COMP-06 / COMP-11 |
| NIST AI RMF / GenAI profile | AI inventory/risk/evidence concerns overlap | **NOT_APPLICABLE as binding repository authority**; BENCHMARK | voluntary framework input | maintain bounded AI-risk crosswalk | AI / Compliance | COMP-03 / COMP-11 |
| OWASP / CIS | security controls, scanners and hardening roadmap exist | **NOT_APPLICABLE as binding repository authority**; BENCHMARK / CONTROL SOURCE | no Owner adoption as independent policy hierarchy | crosswalk only where it improves assurance | Security / Compliance | COMP-05 / COMP-11 |

## Fail-closed rules

1. `UNKNOWN` and `REQUIRES_LEGAL_REVIEW` are not silently promoted to `APPLICABLE` or `NOT_APPLICABLE`.
2. A regulation/standard reference is not evidence of regulated-entity or certification status.
3. Product names such as FinTech, AI, scoring or compliance do not determine legal role.
4. New markets, countries, user types, processing purposes, AI models/providers, data sources or decision authority trigger COMP-16 reassessment.
5. Legal applicability decisions must be traceable to repository evidence and/or a competent Human/Legal decision.
