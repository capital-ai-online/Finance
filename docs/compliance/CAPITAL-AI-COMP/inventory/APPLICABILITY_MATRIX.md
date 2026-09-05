# Compliance Applicability Matrix

**Document ID:** `DOC-COMP-APPLICABILITY-MATRIX-2026-08-31`  
**Role:** assessment inventory / non-authorizing  
**Version:** 1.3.0  
**Date:** 2026-09-05  
**Execution model:** `CAPITAL-AI-COMP-V2` v2.1  
**Current-main reconciliation baseline:** `main@313d27e5861390e2704612f7e65b4c1f3d9e7a68`  
**Status:** COMP-01 EXECUTED AGAINST CURRENT MAIN — OPEN LEGAL/EVIDENCE GATES PRESERVED

This matrix separates an external requirement source from the decision whether it applies to CAPITAL-AI. It is not legal advice. `UNKNOWN` and `REQUIRES_LEGAL_REVIEW` are valid fail-closed outcomes. Repository engineering evidence may support factual scope, but it does not replace competent Human/Legal applicability decisions where legal interpretation is required.

Current ownership is resolved through `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Historical `VC-*` handoff markers and withdrawn post-PVC routing overlays are not used as current authority.

## Current-main evidence basis

This execution uses current `main` repository evidence as status authority plus bounded read-only connected-platform evidence where explicitly identified:

- `/AGENTS.md` v2.7.0 and the current Governance standards baseline;
- `docs/compliance/AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md`;
- `docs/compliance/AI_LITERACY_CONTROL.md`;
- `docs/compliance/CAPITAL_AI_REGULATORY_CONTROL_MATRIX_2026-08-19.md` as dated engineering/compliance evidence;
- `docs/compliance/vendor-evidence/**`, including the vendor inventory last updated 2026-08-19;
- `src/privacy/privacyPolicy.ts`, `src/components/ImpressumAgb.tsx` and existing consumer-contract remediation evidence;
- `docs/contracts/AI_CONTENT_TRANSPARENCY_CONTRACT.md` and current financial-decision authority boundaries;
- current project/PVC ownership mappings and affected project roadmaps where technical ownership is relevant;
- read-only Supabase project discovery on 2026-09-05, which observed exactly one connected project, `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`), in `eu-west-1`, status `ACTIVE_HEALTHY`.

Open Pull Requests are correlation input only and are not treated as merged `main` evidence. Read-only connected-platform observations do not substitute contractual or legal evidence.

## External legal-source correlation used by COMP-01

The following official sources were used only to verify the current legal-source surface; they do not create repository authority beyond their actual legal applicability:

- consolidated Regulation (EU) 2024/1689 as of 27 July 2026: `https://eur-lex.europa.eu/eli/reg/2024/1689/2026-07-27/eng`;
- Regulation (EU) 2026/1744 amending AI Act timing: `https://eur-lex.europa.eu/eli/reg/2026/1744/oj`;
- Regulation (EU) 2022/2554 (DORA): `https://eur-lex.europa.eu/eli/reg/2022/2554/oj`;
- DDG: `https://www.gesetze-im-internet.de/ddg/`;
- TDDDG: `https://www.gesetze-im-internet.de/tdddg/`.

## Applicability register

| Source / regime | Current factual scope evidence | Applicability | Decision basis | Missing decision/evidence | Owner / routing | COMP-01 result |
|---|---|---|---|---|---|---|
| GDPR / DSGVO | personal-data processing is documented for account/profile, billing, consent, security, analytics, privacy requests and related vendor scopes | **APPLICABLE to documented processing scope**; exact obligations remain processing-/role-specific | privacy policy, processing activities, vendor evidence | legal-basis/retention/provider-role/transfer completeness remains evidence- and processing-specific | Human/Legal for interpretation; affected Primary Owner for remediation | `EXECUTED — FACTUAL SCOPE CONFIRMED; FOLLOW-UP EVIDENCE GATES OPEN` |
| GDPR vendor / transfer scope | repository vendor inventory records active Supabase, Render, Stripe, IONOS and Google scopes plus planned social providers; current read-only connected evidence independently confirms the single Supabase project and EU region observation | **PARTIALLY_APPLICABLE / REQUIRES_LEGAL_REVIEW per actual provider/flow** | provider usage, scoped role/DPA evidence and transfer model are separated | Render/Stripe/Google/IONOS/current social live-state not independently re-read in this execution; several DPA/subprocessor/third-country/TIA/contractual-region fields remain pending | Human/Legal for role/transfer determination; actual domain owner after PVC correlation | `COMP-01-A EXECUTED — EVIDENCE_MISSING / LEGAL_REVIEW` |
| EU AI Act — general role/use-case inventory | current inventory covers user-facing chat, screening explanation, Documentary AI, marketing/content AI and research tooling; application contract explicitly carries AI-origin metadata and `financialDecisionAuthority=false` | **PARTIALLY_APPLICABLE** | material AI use cases exist; legal role is system-specific | competent provider/deployer/other role determination is not established for every material system | Human/Legal for role decision; source-domain project supplies facts | `COMP-01-B EXECUTED — FACTUAL ROLE PACKAGE COMPLETE; LEGAL ROLE NOT_ASSESSED/LEGAL_REVIEW` |
| EU AI Act — high-risk provisions | current intended purposes are asset/market research, screening explanation and documentation support; repository defines reclassification triggers and does not assert a current Annex III match | **REQUIRES_LEGAL_REVIEW at trigger; not presumed applicable now** | use-case based factual boundary; current AI Act timing/source rechecked | legal classification required if intended purpose/user/decision authority changes into a relevant category | Human/Legal | `EXECUTED — NO BLANKET HIGH-RISK CLAIM; COMP-08 TRIGGER RETAINED` |
| EU AI Act — transparency candidate scope | customer-facing AI interaction/explanation surfaces and application transparency envelope are documented | **PARTIALLY_APPLICABLE** | factual interaction/generated-content surfaces exist | complete public content-surface inventory and legal sufficiency per content/system | source-domain owner + Human/Legal where interpretation is needed | `EXECUTED — FACTUAL TRANSPARENCY SURFACES IDENTIFIED` |
| EU AI Act — AI literacy candidate scope | AI use/operation is factual; role-based literacy control exists; no attributable Human completion records are established | **PARTIALLY_APPLICABLE**; exact Article-4 role scope remains system-role dependent | current AI Act source + AI inventory + literacy control | provider/deployer role conclusion for each material system and actual Human completion/acknowledgement/assessment evidence | Human/Owner for completion evidence; Human/Legal for role interpretation | `COMP-01-D EXECUTED — EVIDENCE_MISSING / LEGAL_REVIEW WHERE NEEDED` |
| DORA | public/current repository evidence identifies the provider as a natural person and CAPITAL-AI as a project/product label; paid software/financial-analysis functions exist; repository claims no regulatory license or approval | **REQUIRES_LEGAL_REVIEW** | factual entity/business evidence is now explicit; DORA scope cannot be inferred from FinTech functionality or lack of license claim alone | competent determination whether the actual person/business/activity falls within an Article-2 financial-entity category or other applicable scope | Human/Legal | `COMP-01-C EXECUTED — FACTUAL ENTITY PACKAGE COMPLETE; LEGAL_SCOPE NOT_ASSESSED` |
| German DDG / TDDDG | public commercial-capable website, Impressum, paid subscriptions, GA4/Ads/CookieHub consent path and TDDDG-referenced privacy controls are documented | **REQUIRES_LEGAL_REVIEW for exact obligation set** | factual service/consent/marketing surfaces are established | exact legal service classification and sufficiency of each information/consent implementation | Human/Legal; Product/Frontend supplies facts | `COMP-01-E EXECUTED — TRIGGER SURFACE CONFIRMED; LEGAL_REVIEW REMAINS` |
| Consumer protection / digital contracts | paid monthly/yearly subscriptions, Stripe checkout/customer portal, consumer-facing AGB, cancellation and withdrawal sections, and prior consumer-contract remediation are documented | **REQUIRES_LEGAL_REVIEW** | concrete B2C-capable contractual flow exists in repository evidence | actual customer mix/market facts plus legal sufficiency of cancellation button, withdrawal instruction/digital-performance treatment and checkout evidence | Human/Legal; Product/Payments supplies technical facts | `COMP-01-E EXECUTED — B2C-CAPABLE FACTUAL SCOPE CONFIRMED; LEGAL_REVIEW REMAINS` |
| Contractual compliance | vendor contract evidence exists for part of provider universe and consumer terms are versioned | **UNKNOWN as complete contract universe** | no complete customer/provider/partner contract inventory is established | full binding-contract universe, effective versions, incorporated terms and obligation extraction | Human/Legal + affected domain owner | `COMP-01-A/E EXECUTED — CONTRACT UNIVERSE EVIDENCE_MISSING` |
| Financial-services / supervisory requirements beyond proven scope | financial analysis/scoring/ranking features exist, while current contracts and vocabulary state `financialDecisionAuthority=false`; public material claims no regulatory license/approval | **UNKNOWN** | functionality and non-authorizing decision boundary are established facts, but neither proves nor excludes a regulated financial service | actual business model, customer/service characterization, jurisdictions, remuneration/referral model, regulated activity and licensing/role determination | Human/Legal | `COMP-01-E EXECUTED — FACTUAL BOUNDARY RECORDED; LEGAL_SCOPE UNKNOWN` |
| ISO/IEC 27001:2022 | internal SoA/security crosswalk material exists | **NOT_APPLICABLE as binding repository authority**; bounded benchmark evidence only | no certification evidence or independent adoption creates binding authority | refresh only when useful to an existing internal control or explicit target | Security supplies evidence | `EXECUTED — BENCHMARK ONLY` |
| ISO/IEC 42001:2023 | current Governance standards crosswalk uses ISO/IEC 42001 as external management-system benchmark | **NOT_APPLICABLE as binding legal/repository authority**; **CURRENT GOVERNANCE BENCHMARK** | current Governance crosswalk is non-certifying/non-authorizing | separate Owner target and assurance evidence required for certification scope | CAPITAL-AI-GOV / Human Owner | `EXECUTED — BENCHMARK ONLY; NO CERTIFICATION CLAIM` |
| NIST SSDF / SP 800-218A | historical/foreign-project references remain | **NOT_APPLICABLE as current Governance baseline**; **WITHDRAWN / HISTORICAL CONTEXT ONLY unless re-adopted** | current Governance baseline withdraws NIST as control/gap authority | none unless explicit future Human/Owner adoption | none current | `EXECUTED — NO CURRENT NIST-DERIVED GAP/GATE` |
| NIST AI RMF / GenAI profile | historical AI-risk references remain | **NOT_APPLICABLE as current Governance baseline**; **WITHDRAWN / HISTORICAL CONTEXT ONLY unless re-adopted** | same Governance withdrawal | none unless separately re-adopted | none current | `EXECUTED — NO CURRENT NIST-DERIVED GAP/GATE` |
| OWASP / CIS | security guidance/hardening material exists | **NOT_APPLICABLE as binding repository authority**; advisory input where correlated | citation alone does not create repository authority | bounded mapping only to an existing internal control | Security | `EXECUTED — ADVISORY INPUT ONLY` |

## COMP-01-A — Provider / processor / transfer factual scope

**Execution result:** `EXECUTED — EVIDENCE_MISSING / LEGAL_REVIEW`.

Facts established:

1. Repository vendor inventory identifies active-owner-confirmed Supabase, Render, Stripe, IONOS and Google scopes and planned social-provider scopes.
2. Supabase current connected-platform discovery independently observed exactly one project: `AIFINANCIAL` / `ryzywoktpmyhwzxmstyu`, region `eu-west-1`, status `ACTIVE_HEALTHY`. This corroborates the existing owner-confirmed Supabase project identity and observed region.
3. Supabase/Render/Stripe have scoped contractual/role evidence, but their overall evidence remains pending in the repository because transfer/subprocessor/TIA/contractual-region or durable-evidence fields are incomplete.
4. Google and IONOS legal-role/DPA/transfer evidence remains pending in the vendor inventory.
5. Social providers recorded as planned are not promoted to active production processing solely from repository integration code.

Exit gate is **not** positive closure: the actual provider/transfer universe is better evidenced, but contractual and transfer completeness still requires Human/Legal/provider evidence.

## COMP-01-B — AI use-case / role factual classification

**Execution result:** `EXECUTED — PARTIALLY_APPLICABLE / NOT_ASSESSED / LEGAL_REVIEW`.

Facts established:

1. Each material current AI use case now has intended-purpose and runtime-authority evidence in `AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md`.
2. Customer-facing AI interaction/explanation paths have factual transparency evidence.
3. Current financial/AI contracts retain `financialDecisionAuthority=false`; AI output cannot create canonical score/order/settlement authority.
4. Current repository evidence does not conclusively classify CAPITAL-AI as provider/deployer/other legal role for every system.

The legal role gap remains explicit rather than guessed.

## COMP-01-C — DORA entity / business scope

**Execution result:** `EXECUTED — NOT_ASSESSED / LEGAL_REVIEW`.

Factual package established from current `main`:

- provider/responsible party is identified as a natural person;
- CAPITAL-AI is described as project/product designation rather than a separate legal entity;
- free and paid software plans may be offered;
- financial/scoring/analysis functions exist;
- public material does not claim a regulatory license or authority approval;
- analysis tools expressly do not themselves establish the regulatory status of a service.

These facts are sufficient for Legal Review input but insufficient for an agent to determine DORA Article-2 scope. No DORA technical remediation backlog is created before competent applicability determination.

## COMP-01-D — AI-literacy applicability / organizational evidence

**Execution result:** `EXECUTED — PARTIALLY_APPLICABLE / EVIDENCE_MISSING`.

Facts established:

- AI systems/tooling are materially used;
- role-based literacy topics and cohorts are defined;
- current legal-source correlation makes provider/deployer role classification material to Article-4 applicability;
- current repository evidence does not establish attributable Human completion records for any listed cohort.

Required Human evidence remains role/cohort, curriculum version, completion date, method/provider, acknowledgement/assessment where needed and refresh date. Model-generated claims cannot satisfy this gate.

## COMP-01-E — DDG/TDDDG / consumer-contract / financial-services scope

**Execution result:** `EXECUTED — REQUIRES_LEGAL_REVIEW / UNKNOWN`.

Factual package established:

- public German provider/imprint surface exists;
- CAPITAL-AI may offer paid monthly/yearly subscription plans and Stripe checkout/self-service billing;
- consumer-facing terms explicitly include cancellation and withdrawal sections;
- prior legal remediation leaves concrete cancellation/withdrawal/checkout-evidence questions open rather than claiming completion;
- analytics/advertising processing is consent-gated and documents Google/CookieHub/TDDDG scope;
- referral/partner monetization may occur and is intended to be disclosed;
- financial analysis/scoring/ranking capabilities exist but repository authority contracts explicitly deny financial decision authority;
- no regulatory license/approval is claimed.

This establishes concrete trigger surfaces for DDG/TDDDG/consumer/financial-services Legal Review. It does not establish a blanket B2C, investment-service, advisory, regulated-entity or licensing conclusion.

## COMP-01 completion state

All five bounded COMP-01 execution items have been **performed** against the stated current-main baseline. Completion here means the factual source package, applicability status, missing evidence, competent owner and exit gate are explicit. It does **not** mean every legal/evidence gate is satisfied.

| Item | Execution | Outcome | Remaining external gate |
|---|---|---|---|
| `COMP-01-A` | `DONE` | `EVIDENCE_MISSING / LEGAL_REVIEW` | provider contractual/role/transfer completion |
| `COMP-01-B` | `DONE` | `PARTIALLY_APPLICABLE / NOT_ASSESSED` | competent legal role classification where required |
| `COMP-01-C` | `DONE` | `NOT_ASSESSED / LEGAL_REVIEW` | DORA entity/activity applicability decision |
| `COMP-01-D` | `DONE` | `EVIDENCE_MISSING` | real Human literacy completion evidence + bounded role interpretation |
| `COMP-01-E` | `DONE` | `REQUIRES_LEGAL_REVIEW / UNKNOWN` | bounded DDG/TDDDG/consumer/financial-regulatory legal determinations |

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
