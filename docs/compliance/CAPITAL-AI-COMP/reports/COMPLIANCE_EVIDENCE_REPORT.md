# CAPITAL-AI Compliance Evidence Report

**Document ID:** `DOC-COMP-EVIDENCE-REPORT-2026-08-31`  
**Role:** evidence assessment / non-authorizing  
**Version:** 1.2.0  
**Date:** 2026-09-05  
**Baseline:** `main@313d27e5861390e2704612f7e65b4c1f3d9e7a68`  
**Scope:** COMP-01 applicability execution evidence refresh

## Evidence principle

Compliance conclusions follow this preference order:

```text
Runtime / Provider Evidence
→ Code / Configuration
→ Hosted CI Evidence
→ Registry / Control Evidence
→ Signed / Approved Documentation
→ Roadmap Claims
```

A lower-level claim does not override contradictory higher-quality current evidence. Historical evidence is retained but does not automatically establish current state. Open Pull Requests are correlation input and not merged-main evidence.

Final branch correlation includes the Human merge of PR #734. The delta from the prior execution baseline `main@04258ce9122dd600707aa25feb431282c715d104` to this baseline changes only the canonical Compliance roadmap; the factual source files consumed by the COMP-01 assessment were not changed by that merge.

## Current evidence sources reused

| Source class | Current source | Use in COMP-01 | Limitation |
|---|---|---|---|
| Trust root / ownership | `/AGENTS.md`, `docs/projects/README.md`, `docs/projects/PROJECT_VALUE_CHAIN.md` | current authority, ownership and routing boundary | does not decide external legal applicability |
| Privacy / processing | `src/privacy/privacyPolicy.ts`, `docs/compliance/privacy/**` | factual personal-data, consent, analytics, billing and processing scope | repository statements are not external legal assurance |
| Vendor / transfers | `docs/compliance/vendor-evidence/**` | provider usage, scoped role/DPA/subprocessor/transfer evidence | several provider/transfer fields remain pending; technical region observations are not contractual commitments |
| Connected Supabase | read-only project discovery on 2026-09-05 | corroborates one active `AIFINANCIAL` project, ID `ryzywoktpmyhwzxmstyu`, region `eu-west-1`, status `ACTIVE_HEALTHY` | only Supabase scope was independently observed through a current connected platform in this execution; does not prove DPA/transfer sufficiency |
| AI use cases | `docs/compliance/AI_SYSTEM_INVENTORY_AND_CLASSIFICATION.md` | intended-purpose, use-case, role-hypothesis, high-risk trigger and decision-authority facts | legal provider/deployer classification remains system-specific and partly unresolved |
| AI transparency | `docs/contracts/AI_CONTENT_TRANSPARENCY_CONTRACT.md`, implementation evidence | AI-origin, provider/model attribution and `financialDecisionAuthority=false` boundary | engineering transparency does not prove legal sufficiency |
| AI literacy | `docs/compliance/AI_LITERACY_CONTROL.md` | competency/cohort control and current applicability assessment | Human completion evidence is absent until separately supplied by Human/Owner |
| Entity / public provider facts | `src/components/ImpressumAgb.tsx`, `src/privacy/privacyPolicy.ts` | natural-person provider, project/product status, subscription/contract and no-license-claim facts | no agent conclusion on DORA/financial-services legal status |
| Consumer contract | `docs/compliance/legal/CONSUMER_CONTRACT_REMEDIATION_2026-08-23.md`, `src/components/ImpressumAgb.tsx` | paid plans, cancellation, withdrawal and checkout remediation facts | prior remediation explicitly leaves legal sufficiency questions open |
| Consent / TDDDG | privacy policy + consent ADR/implementation evidence | GA4/Ads/CookieHub consent-gated factual surface | exact DDG/TDDDG obligation set remains a legal determination |
| Financial decision boundary | financial vocabulary/contracts and AI transparency controls | establishes `financialDecisionAuthority=false` / no model-generated execution authority | does not itself determine whether a service is regulated under financial law |
| Governance standards | `docs/governance/control-plane/STANDARDS_CROSSWALK.md` | ISO/IEC 42001 benchmark status and NIST withdrawal | benchmark alignment is not certification or legal compliance |
| Development / CI | GitHub branch/main/PR state | exact branch/main correlation and eventual hosted-check evidence | final hosted PR-head evidence exists only after PR creation |

## COMP-01 evidence execution results

### COMP-01-A — Provider / processor / transfer factual scope

**State:** `EXECUTED — EVIDENCE_MISSING / LEGAL_REVIEW`.

Current evidence establishes:

- active-owner-confirmed repository records for Supabase, Render, Stripe, IONOS and Google;
- planned social-provider records remain distinct from active production use;
- Supabase current connected evidence corroborates one active project in `eu-west-1`;
- Supabase/Render/Stripe have some scoped role/contract evidence, while overall evidence remains pending;
- Google/IONOS role/DPA/transfer evidence remains incomplete;
- transfer mechanism, TIA, subprocessor and contractual-region completeness is not established for the full provider universe.

**Evidence conclusion:** factual provider scope is materially improved, but no blanket vendor/transfer compliance conclusion is supportable.

### COMP-01-B — AI use-case / legal-role factual package

**State:** `EXECUTED — PARTIALLY_APPLICABLE / NOT_ASSESSED / LEGAL_REVIEW`.

Current evidence establishes:

- material AI use cases and intended purposes;
- customer-facing AI interaction/explanation surfaces;
- no model/AI financial decision authority;
- explicit reclassification triggers for changed purpose/users/decision authority;
- no repository basis to guess one legal provider/deployer classification across all systems.

**Evidence conclusion:** factual role package is complete enough for competent Legal Review; legal role outcome remains open where required.

### COMP-01-C — DORA entity / business factual package

**State:** `EXECUTED — NOT_ASSESSED / LEGAL_REVIEW`.

Current evidence establishes:

- provider/responsible party is documented as a natural person;
- CAPITAL-AI is a project/product designation, not asserted as a separate legal entity;
- paid software subscriptions and financial-analysis functions exist;
- public content does not assert a regulatory license or official approval;
- financial analysis tools are described as non-authorizing and do not by themselves establish regulatory status.

**Evidence conclusion:** factual entity/business material is available, but DORA Article-2 scope remains a Human/Legal determination.

### COMP-01-D — AI literacy

**State:** `EXECUTED — EVIDENCE_MISSING`.

Current evidence establishes:

- material AI usage exists;
- role/cohort competency domains are defined;
- Article-4 applicability is role-dependent and therefore tied to unresolved system-role classification;
- no attributable Human role/cohort training completion records are established by repository evidence.

**Evidence conclusion:** control design exists; organizational completion evidence does not.

### COMP-01-E — DDG/TDDDG / consumer / financial-services factual package

**State:** `EXECUTED — REQUIRES_LEGAL_REVIEW / UNKNOWN`.

Current evidence establishes:

- German public provider/imprint surface;
- paid subscription and Stripe checkout/customer-portal paths;
- consumer-facing cancellation and withdrawal text;
- prior remediation leaves concrete cancellation/withdrawal/checkout-evidence gates open;
- consent-gated analytics/advertising with Google/CookieHub and explicit TDDDG reference;
- possible referral/partner monetization disclosures;
- financial scoring/analysis/ranking capability with explicit `financialDecisionAuthority=false`;
- no regulatory-license claim.

**Evidence conclusion:** concrete legal trigger surfaces are identified. Exact consumer, digital-service, financial-services and supervisory applicability remains a bounded Human/Legal decision.

## Open COMP-01 evidence / decision gates

| Gate | Evidence state | Competent source |
|---|---|---|
| full current provider universe and active usage confirmation beyond Supabase | `EVIDENCE_MISSING` | provider/account owner + current platform evidence |
| provider role / DPA / subprocessor / transfer / TIA / contractual-region completeness | `EVIDENCE_MISSING / LEGAL_REVIEW` | Human/Legal + provider evidence |
| AI provider/deployer/other legal role per material system | `NOT_ASSESSED / LEGAL_REVIEW` | Human/Legal using current factual system package |
| Human AI-literacy completion/acknowledgement evidence | `EVIDENCE_MISSING` | Human/Owner organizational records |
| DORA entity/activity scope | `NOT_ASSESSED / LEGAL_REVIEW` | Human/Legal |
| DDG/TDDDG exact obligation set and implementation sufficiency | `LEGAL_REVIEW` | Human/Legal |
| consumer-contract applicability/sufficiency including cancellation/withdrawal digital-service details | `LEGAL_REVIEW` | Human/Legal |
| complete contractual obligation universe | `EVIDENCE_MISSING / UNKNOWN` | Human/Legal + contract owners |
| financial-services / supervisory / licensing classification | `UNKNOWN / LEGAL_REVIEW` | Human/Legal |
| final exact-PR-head hosted validation | `EVIDENCE_MISSING BY DESIGN PRE-PR` | GitHub hosted checks after authorized PR creation |

## Requirement-distribution caution

The previous report carried requirement-wide totals from an older `main@5d3360c2` snapshot. This COMP-01 refresh does **not** reassert those historical aggregate counts as current truth. Requirement-wide distribution must be recalculated under COMP-02/04 after the stale requirements/mapping matrices are re-correlated to current `main`.

## Foreign evidence rule

Where evidence or remediation belongs to another project/domain, Compliance records the applicable PVC/Primary Owner through the current project mappings and waits for returned evidence. Compliance does not execute source-domain security hardening, runtime remediation, provider contract action, organizational training completion or Legal Review on that owner's behalf.

For unresolved technical ownership, the state remains `REQUIRES_CORRELATION`; for unresolved legal interpretation, the state remains `LEGAL_REVIEW` or `UNKNOWN` as applicable.
