# ADR-0085 — Privacy Governance Single Source of Truth

- **Status:** Accepted
- **Date:** 2026-08-19
- **Scope:** GDPR/DSGVO transparency, privacy rights, consent evidence, public compliance claims
- **Related:** DSGVO_REMEDIATION_2026-08-19.md

## Context

The application had three mutually inconsistent controller identities across public and internal legal content: `Capital-AI GmbH`, `AIFinancial GmbH`, and Sven Michael Kulessa as a private individual. Public UI also displayed absolute claims such as `DSGVO VERIFIZIERT`, `Gerichtsfest` and `Zertifiziert (Art. 32)` without a repository-backed certification artifact.

The implementation already contains meaningful privacy/security controls (RLS, encrypted OAuth tokens, consent-gated analytics, MFA, audit trails), but the public privacy notice did not cover the full processing inventory. It also described privacy-notice acknowledgement as consent and claimed immediate data-subject-right execution that the UI did not implement.

## Decision

### 1. Canonical controller identity

The canonical controller is:

> Sven Michael Kulessa  
> Privatperson  
> von Lepel Straße 3a  
> 27259 Freistatt  
> Deutschland

`CAPITAL-AI` is a project/product designation and not a separate legal entity.

### 2. Public compliance status

The application may display that privacy controls are **internally documented**. It must not display a GDPR certification, judicial approval or equivalent external validation unless a real external evidence artifact exists and is referenced.

Art. 42 GDPR certification terminology is reserved for actual certification mechanisms; repository self-assessment is not labelled as certification.

### 3. Privacy policy source of truth

`src/privacy/privacyPolicy.ts` becomes the application-level source of truth for:

- controller identity,
- privacy notice version,
- public compliance status/disclaimer,
- supported privacy request types,
- processing activities shown in the privacy UI and exported by the privacy API.

Database evidence keeps its own immutable document version. A database trigger classifies legacy `user_consents.consent_type` rows by legal character so that:

- `privacy` = acknowledgement,
- `terms` = contract acceptance,
- `marketing` = consent.

The legacy wire field names are retained temporarily for backward compatibility; the database no longer treats all three evidence records as the same legal construct.

### 4. Data-subject rights

A new authenticated `/api/privacy` router provides:

- immediate self-service JSON export for common account data,
- creation/listing of privacy requests for access, rectification, erasure, restriction, objection and portability.

Erasure is a managed request rather than a misleading instant-delete claim. This avoids unsafe partial deletion across audit, billing, authentication and legally retained records until a fully transactional erasure orchestrator is implemented and validated.

### 5. Retention-as-code

A service-role-only database purge function provides deterministic cleanup for technical data with clear operational lifetimes. Business records whose retention depends on statutory or contractual context are not silently deleted by a generic job.

### 6. Vendor and transfer statements

Source code documents actual integrations and possible third-country exposure, but does not assert that a DPA, SCC, adequacy mechanism or hosting region is contractually in force unless separate evidence is maintained.

## Consequences

### Positive

- Public text and backend evidence share one controller identity.
- Compliance claims become evidence-based rather than self-certified.
- Art. 13 transparency tracks the real application architecture more closely.
- Users get a functional authenticated privacy workflow.
- Privacy-notice acknowledgement is separated from optional marketing consent.
- Retention becomes executable and reviewable as code.

### Trade-offs

- The Processing Registry is still a technical/legal working model and requires periodic legal review.
- Vendor contractual evidence remains an external governance artifact.
- Full erasure remains a controlled request workflow until cross-system deletion can be proven atomic and complete.
- Existing legacy API field names are temporarily preserved to avoid a risky authentication/onboarding contract break.

## Validation

The branch must be compared with the latest `main` before PR creation. Regression tests must reject inconsistent controller names, obsolete § 5 TMG references in the public imprint, and unqualified certification/judicial-approval claims in public privacy UI.
