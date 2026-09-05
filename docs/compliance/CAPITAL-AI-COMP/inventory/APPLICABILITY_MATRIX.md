# Compliance Applicability Matrix

**Document ID:** `DOC-COMP-APPLICABILITY-MATRIX-2026-08-31`  
**Role:** assessment inventory / non-authorizing  
**Version:** 1.2.0  
**Date:** 2026-09-05  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current-main reconciliation baseline:** `main@04258ce9122dd600707aa25feb431282c715d104`  
**Status:** CURRENT-MAIN RECONCILED — NON-AUTHORIZING APPLICABILITY ASSESSMENT

This matrix separates an external requirement source from the decision whether it applies to CAPITAL-AI. It is not legal advice. `UNKNOWN` and `REQUIRES_LEGAL_REVIEW` are valid fail-closed outcomes. Repository engineering evidence may support factual scope, but it does not replace competent Human/Legal applicability decisions where legal interpretation is required.

Current ownership is resolved through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Historical `VC-*` handoff markers and withdrawn post-PVC routing overlays are not used as current authority.

## Current-main evidence basis

This reconciliation uses only current `main` repository evidence as status authority:

- `/AGENTS.md` v2.7.0 and the current Governance standards baseline;
- `docs/compliance/AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md`;
- `docs/compliance/AI_LITERACY_CONTROL.md`;
- `docs/compliance/CAPITAL_AI_REGULATORY_CONTROL_MATRIX_2026-08-19.md` as dated engineering/compliance evidence;
- `docs/compliance/vendor-evidence/**`, including the vendor inventory last updated 2026-08-19;
- current project/PVC ownership mappings and affected project roadmaps where technical ownership is relevant.

Open Pull Requests are correlation input only and are not treated as merged `main` evidence.

## Applicability register

| Source / regime | Current-main repository scope evidence | Applicability | Decision basis | Missing decision/evidence | Owner / routing | Next Compliance action |
|---|---|---|---|---|---|---|
| GDPR / DSGVO | repository evidence identifies personal-data processing across account/profile/billing/consent/security/analytics and related application/vendor scopes | **APPLICABLE to the documented processing scope**; exact obligations remain processing-/role-specific | privacy artifacts + vendor inventory + processing evidence | revalidate legal bases, retention, current provider scope, role allocation and transfer evidence | Human/Legal for legal interpretation; affected technical Primary Owner for any remediation | COMP-01 factual-scope refresh; COMP-02/04/06 follow-up as evidence changes |
| GDPR vendor / transfer scope | active provider evidence exists for production services; vendor inventory contains scoped processor/controller-role evidence but multiple overall evidence states remain `pending` and transfer/TIA evidence is incomplete | **PARTIALLY_APPLICABLE / REQUIRES_LEGAL_REVIEW per provider and transfer flow** | vendor inventory distinguishes technical observation, contractual evidence, legal role and transfer evidence | current provider universe, exact processing purpose/role, DPA/AVV scope, subprocessor state, third-country route, SCC/DPF/TIA and contractual/observed region evidence as applicable | Human/Legal for role/transfer determination; actual provider/domain Primary Owner after current PVC correlation | COMP-01 provider/transfer scope package; keep unresolved evidence explicit |
| EU AI Act — general role/use-case inventory | user-facing AI chat, AI-generated screening explanation, Documentary/marketing AI and research/evidence tooling are documented | **PARTIALLY_APPLICABLE** | material AI use cases exist; exact provider/deployer/other legal role and obligation set is use-case dependent | factual role record, intended purpose, target users, decision authority and competent legal classification per material use case | Human/Legal for legal-role decision; source-domain project supplies factual/technical evidence | COMP-01 use-case/role refresh; COMP-08 on material change |
| EU AI Act — high-risk provisions | current AI inventory states that no current Annex-III match is asserted for documented asset/market research, screening explanation and documentation-support intended purposes | **REQUIRES_LEGAL_REVIEW at trigger; not presumed applicable now** | repository engineering inventory is use-case based and defines reclassification triggers | actual intended purpose/user/decision context plus competent legal determination when a trigger occurs | Human/Legal; technical owner depends on the affected use case/PVC | COMP-01 only when triggered; COMP-08 monitors material changes |
| EU AI Act — transparency candidate scope | customer-facing AI interaction/content paths and transparency controls are documented | **PARTIALLY_APPLICABLE** | engineering evidence supports candidate interaction/content transparency scope; legal output/role classification remains separate | complete affected-surface inventory, factual output classification and legal scope | source-domain project (for example Frontend/Documentary/Social) supplies evidence; Human/Legal where interpretation is required | COMP-01/02/04/06; reassess on new public AI-content surface |
| EU AI Act — AI literacy candidate scope | `AI_LITERACY_CONTROL.md` defines role-based competency requirements and explicitly states Human completion evidence is required | **PARTIALLY_APPLICABLE**; legal scope remains role/use-case dependent | repository control exists but does not prove Human training/completion | applicability confirmation plus real role/cohort completion, acknowledgement/assessment and refresh evidence | Human/Owner for organizational evidence; Human/Legal where obligation interpretation is required | COMP-01 applicability confirmation; COMP-04/06 after real evidence exists |
| DORA | FinTech/financial-analysis functionality exists, while the Regulatory Control Matrix explicitly leaves operating-entity scope `TBD` | **REQUIRES_LEGAL_REVIEW** | repository functionality/branding does not establish regulated-entity or DORA Art. 2 scope | legal entity, business model, regulated activity/status and service facts | Human/Legal | COMP-01 legal-scope package; no DORA technical backlog is created before applicability is established |
| German DDG / TDDDG | public web/consent functionality and privacy/legal remediation references exist | **REQUIRES_LEGAL_REVIEW for the exact obligation set** | repository evidence establishes relevant web/consent facts, not the full legal classification | exact service, consent, market, user and processing facts plus legal review | Human/Legal; affected Product/Frontend owner supplies factual evidence | COMP-01/02; no guessed legal conclusion |
| Consumer protection / digital contracts | consumer-contract remediation material exists | **REQUIRES_LEGAL_REVIEW** | repository material establishes a plausible review surface, not a complete B2C/B2B/jurisdiction determination | actual user type, market, pricing/contract flow, cancellation/renewal facts and legal review | Human/Legal; Product/Frontend/Payments owner supplies facts where relevant | COMP-01/02 |
| Contractual compliance | provider contract evidence exists for part of the provider universe | **UNKNOWN as a complete contract universe** | no current canonical evidence establishes all binding customer/provider/partner obligations | complete contract universe, effective versions, applicable scopes and obligation extraction | Human/Legal; affected contract/domain owner supplies evidence | COMP-01 contract-universe correlation, then COMP-02/06 |
| Financial-services / supervisory requirements beyond proven scope | finance, scoring, research and decision-support functionality exists | **UNKNOWN** | product functionality alone does not establish regulated-entity, investment-service, advisory or supervisory status | business model, service characterization, user/customer type, jurisdictions and licenses/roles | Human/Legal | COMP-01 factual/legal classification before any compliance conclusion |
| ISO/IEC 27001:2022 | internal SoA and security crosswalk material exist | **NOT_APPLICABLE as binding repository authority**; bounded benchmark evidence only | no certification evidence or independent adoption creates legal/repository authority | refresh only when useful to an existing internal control or explicitly adopted target | Security supplies technical evidence; Compliance assesses only against an established scope | COMP-02/03/04/06 only when correlated to current internal controls |
| ISO/IEC 42001:2023 | current Governance standards crosswalk uses ISO/IEC 42001 as the adopted external management-system benchmark | **NOT_APPLICABLE as binding legal/repository authority**; **CURRENT GOVERNANCE BENCHMARK** | current Governance crosswalk is explicitly non-certifying/non-authorizing | Owner decision and separate assurance evidence would be required for any certification target | CAPITAL-AI-GOV owns benchmark/control mapping; Human Owner controls any certification target | COMP-02/03 mapping only; no certification claim |
| NIST SSDF / SP 800-218A | historical and foreign-project NIST references remain in repository material | **NOT_APPLICABLE as current Governance baseline**; **WITHDRAWN / HISTORICAL CONTEXT ONLY unless explicitly re-adopted** | current Governance standards crosswalk withdraws NIST publications/frameworks/profiles as baseline, control source, mandatory benchmark, required evidence source and gap authority | no action unless a future explicit Human/Owner decision adopts exact source/version/scope | no current NIST-derived remediation owner | remove/avoid current NIST-derived requirement, finding or gate semantics; retain history only where needed |
| NIST AI RMF / GenAI profile | historical AI-risk mappings/references remain in repository material | **NOT_APPLICABLE as current Governance baseline**; **WITHDRAWN / HISTORICAL CONTEXT ONLY unless explicitly re-adopted** | same current Governance withdrawal applies | no action unless separately re-adopted by explicit Human/Owner decision | no current NIST-derived remediation owner | do not create COMP finding/backlog from historical NIST references alone |
| OWASP / CIS | security controls, scanners and hardening material exist | **NOT_APPLICABLE as binding repository authority**; advisory/control-source input only where separately correlated to existing internal controls | external guidance does not create repository authority by citation alone | bounded mapping only where useful to an existing Security/Governance control | Security supplies technical evidence; Compliance consumes returned evidence | COMP-02/03 only when an existing internal control requires the mapping |

## COMP-01 execution queue

The following items are the current bounded Applicability work queue. They do not authorize foreign technical implementation or decide legal questions on behalf of Human/Legal.

| Item | Scope | Current state | Exit gate |
|---|---|---|---|
| `COMP-01-A` | Current provider / processor / transfer factual scope | `EVIDENCE_MISSING / LEGAL_REVIEW` | actual active provider universe and processing purposes correlated; role/transfer uncertainties explicitly resolved or retained as Legal Review |
| `COMP-01-B` | AI use-case / role factual classification | `PARTIALLY_APPLICABLE / NOT_ASSESSED` | each material AI use case has current intended purpose, users, authority boundary and factual role evidence; legal role conclusion supplied only by competent Human/Legal where needed |
| `COMP-01-C` | DORA entity/business scope | `NOT_ASSESSED / LEGAL_REVIEW` | actual legal-entity/business/service facts reviewed by Human/Legal; result recorded without inferring scope from FinTech branding |
| `COMP-01-D` | AI-literacy applicability and organizational evidence | `EVIDENCE_MISSING` | applicability confirmed and real Human completion/acknowledgement evidence exists, or Legal Review records why the obligation does not apply to a role/scope |
| `COMP-01-E` | DDG/TDDDG, consumer-contract and financial-services scope | `REQUIRES_LEGAL_REVIEW / UNKNOWN` | factual market/user/service/contract context assembled and competent Legal Review records bounded applicability conclusions |

## Current factual observations

1. The vendor evidence model correctly separates observed technical state, contractual state, legal role, subprocessors and transfers. Several provider records remain `pending`; an observed EU runtime region is not treated as a contractual region commitment.
2. Current AI inventory is use-case based. It does not assert a blanket high-risk classification for the documented research/explanation purposes and defines explicit reclassification triggers.
3. AI-literacy repository control is defined, but Human completion evidence is explicitly absent until separately recorded.
4. DORA operating-entity scope remains `TBD` in the current Regulatory Control Matrix; no technical DORA remediation is created from branding or finance functionality alone.
5. NIST publications/frameworks/profiles are withdrawn from the current Governance baseline and cannot create current Compliance findings, mandatory evidence or remediation by historical citation alone.
6. An open PR may improve or change future evidence/roadmap context, but only merged `main` state is used for this applicability assessment.

## Fail-closed rules

1. `UNKNOWN` and `REQUIRES_LEGAL_REVIEW` are not silently promoted to `APPLICABLE` or `NOT_APPLICABLE`.
2. `PARTIALLY_APPLICABLE` is not a compliance-pass state and does not eliminate missing legal/evidence scope.
3. A regulation/standard reference is not evidence of regulated-entity or certification status.
4. Product names such as FinTech, AI, scoring or compliance do not determine legal role.
5. Technical implementation, merge state or file existence does not prove legal applicability, legal sufficiency or Human organizational completion.
6. New markets, countries, user types, processing purposes, AI models/providers, data sources, public AI-content surfaces or decision authority trigger `COMP-08`, followed by `COMP-01` reassessment.
7. Legal applicability decisions are traceable to repository evidence and/or a competent Human/Legal decision.
8. A Legal Review request does not instruct Legal which conclusion to reach.
9. Where the technical remediation owner cannot be resolved from current `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`, the state remains `REQUIRES_CORRELATION` before implementation.
10. Compliance does not execute foreign technical remediation.
