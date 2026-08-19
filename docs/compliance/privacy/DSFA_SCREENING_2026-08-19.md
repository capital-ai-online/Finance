# CAPITAL-AI — DSFA / DPIA Threshold Screening

**Date:** 2026-08-19  
**Controller:** Sven Michael Kulessa  
**Repository:** `SvenKulessa/Finance`  
**Scope:** Current CAPITAL-AI processing inventory after PR #414 and ADR-0092 remediation  
**Status:** Screening recorded; not a legal opinion and not a substitute for a full DSFA where the high-risk threshold is met

## 1. Purpose

This document records whether the currently evidenced CAPITAL-AI processing scope shows indicators that processing is likely to result in a high risk to the rights and freedoms of natural persons and therefore requires a full Datenschutz-Folgenabschätzung (DSFA / DPIA) before that processing proceeds.

The screening is based on the repository processing registry, current production architecture evidence and vendor evidence available on 2026-08-19. It must be repeated when the processing purpose, data categories, decision effects, scale, recipients, AI use or monitoring characteristics materially change.

## 2. Current official benchmark

The screening uses the GDPR Article 35 high-risk principle and the EDPB-endorsed WP29 DPIA guidance as the legal/governance reference. The EDPB states that controllers must perform a DPIA before processing likely to result in high risk to individuals' rights and freedoms. The 2026 EDPB DPIA template is additionally treated as a current structuring benchmark; as reviewed on 2026-08-19, the EDPB source still describes finalisation/adoption steps following the consultation period, so this repository does not claim that the template is a binding mandatory format.

For enterprise privacy-engineering maturity, NIST Privacy Framework 1.1 material is used as a non-binding engineering benchmark for lifecycle risk assessment, processing-ecosystem governance, deployment verification and reassessment.

## 3. Processing inventory screened

| Activity | Lifecycle | Personal-data scope | Current high-risk signal |
|---|---|---|---|
| Account / authentication / profile | active | identity/contact/authentication metadata | No standalone Article 35 high-risk characteristic evidenced |
| Billing / subscription | active | contact, account, subscription and Stripe references | No automated personal eligibility/credit decision evidenced |
| Consent / acknowledgement evidence | active | user ID, document version, timestamp, hashed IP | Accountability evidence; no high-risk characteristic evidenced |
| Security / IAM logging | active | user ID, IP, user agent, security-event metadata | Monitoring is security-purpose and account/system scoped; no large-scale public-space monitoring evidenced |
| Analytics / advertising | conditional | online identifiers, consent and device/use data | Requires consent gating; reassess if profiling or cross-context targeting scope expands |
| Social publishing | conditional | account identifiers, encrypted OAuth tokens, publishing history | External-platform transfer and token sensitivity require controls; current feature is user-initiated and no sensitive-category inference is evidenced |
| E-mail alerts | conditional | e-mail and requested market alert parameters | User-initiated service; no high-risk characteristic evidenced |
| Usage quota | active | e-mail, counters and windows | Service enforcement; no material decision about a person's legal rights evidenced |
| Privacy requests | active | request metadata, authenticated identity | Rights-management process; no high-risk characteristic evidenced |

## 4. Article 35 core cases

### 4.1 Systematic and extensive evaluation of personal aspects producing legal or similarly significant effects

**Current evidence:** Not established.

CAPITAL-AI performs market/asset analysis and scoring. The repository privacy boundary states that personal user/authentication data is not intended to be sent to market/AI-scoring providers. Current evidence does not show an automated personal credit, employment, insurance, fraud-denial, investment-eligibility or comparable decision about an identified person that itself produces legal or similarly significant effects.

**Trigger to full DSFA:** Any feature that profiles a user and automatically determines access, price, creditworthiness, investment suitability, eligibility, fraud blocking, account closure or another similarly significant outcome.

### 4.2 Large-scale processing of special-category or criminal-conviction data

**Current evidence:** Not established.

The current processing registry does not declare health, biometric identification, genetic data, political opinion, religion, trade-union membership, sex-life/sexual-orientation data or criminal-conviction data as intended processing categories.

**Trigger to full DSFA:** Introduction or inference of such data at material scale, including model-derived sensitive attributes.

### 4.3 Systematic monitoring of a publicly accessible area on a large scale

**Current evidence:** Not established.

Security telemetry relates to account/application activity and infrastructure security. No CCTV, biometric public-space monitoring, location tracking of public movement or comparable public-area surveillance is evidenced.

**Trigger to full DSFA:** Addition of large-scale physical/public-space monitoring, persistent location tracking or equivalent observation.

## 5. Additional EDPB-style risk indicators

The following indicators are reviewed because combinations can make high risk more likely even where a core Article 35 example is not literally present.

| Indicator | Current assessment | Control / follow-up |
|---|---|---|
| Evaluation/scoring of persons | Not evidenced in current AI/market scoring scope | Maintain personal-data boundary at AI/provider interfaces |
| Automated decision with significant effect | Not evidenced | Owner/legal gate before any personal decision automation |
| Systematic monitoring | Limited security telemetry exists | 180-day default retention; privacy-safe logs; hold only for bounded incident/legal purpose |
| Sensitive/highly personal data | Authentication secrets/tokens are security-sensitive but special-category processing is not evidenced | Encryption, server-only access, no browser token exposure |
| Large-scale personal-data processing | Not established by current evidence | Reassess with material growth or new datasets |
| Dataset matching/combination | Normal account/billing association exists; no broad third-party identity enrichment evidenced | Gate new enrichment/cross-dataset matching |
| Vulnerable data subjects | No vulnerable-group-specific service evidenced | Reassess before child/minor or dependency-context processing |
| Innovative technology | AI is used for market/research functionality | Reassess if AI begins processing user personal data or producing user-significant decisions |
| Preventing exercise of a right/service | Subscription/IAM controls access to contracted service, but no high-risk automated personal assessment is evidenced | Keep human/admin escalation for rights and access-control disputes |

## 6. Screening outcome

**Outcome on current evidence: FULL DSFA NOT AUTOMATICALLY TRIGGERED BY THE PRESENTLY EVIDENCED PROCESSING SCOPE.**

This is a scoped engineering/compliance screening, not a declaration that no supervisory authority could require a DSFA for a particular implementation. The conclusion depends materially on these current boundaries:

- AI/market scoring does not ingest personal authentication/profile data as model input;
- no automated personal decision produces legal or similarly significant effects;
- no large-scale special-category/criminal-data processing is intended;
- no large-scale public-space monitoring exists;
- conditional analytics/social processing remains purpose- and consent/feature-gated;
- vendor and international-transfer evidence remains governed separately.

## 7. Mandatory reassessment triggers

A new screening, and presumptively a full DSFA until assessed otherwise, is required before deploying any of the following:

1. personal financial-risk, creditworthiness, suitability or investment-profile scoring;
2. automated denial/suspension/price/access decisions about users with significant effects;
3. AI inference or processing of health, biometric, political, religious, union, sexual-orientation or criminal data;
4. use of user conversations, support messages, documents or identity data as AI training/fine-tuning/evaluation input beyond the documented boundary;
5. biometric identification, persistent location tracking or public-space monitoring;
6. large-scale cross-dataset identity enrichment or third-party behavioral profiles;
7. processing specifically targeting children/minors or another vulnerable population;
8. a new processing purpose that materially changes reasonable user expectations;
9. a vendor architecture change that materially increases data-access scope or creates a new high-risk transfer/processing context;
10. a security/incident pattern showing the existing controls no longer keep privacy risk within the accepted target profile.

## 8. Evidence and accountability

Reassessment should be linked to the relevant ADR/roadmap/PR and record:

- changed purpose and data categories;
- affected data-subject groups and scale;
- necessity/proportionality analysis;
- recipient and transfer changes;
- model/automated-decision effects where AI is involved;
- threats/problems individuals could experience;
- controls and residual risk;
- controller approval and, where applicable, DPO/legal/supervisory consultation.

## 9. Residual open items

This screening does not close:

- Stripe/Supabase/other vendor TIA and actual onward-routing evidence;
- provider-specific contract/subprocessor change monitoring;
- final legal validation of retention periods;
- future DSFA obligations triggered by feature changes;
- supervisory-authority-specific positive/negative Article 35 lists where a concrete new processing operation needs that jurisdiction-specific check.
