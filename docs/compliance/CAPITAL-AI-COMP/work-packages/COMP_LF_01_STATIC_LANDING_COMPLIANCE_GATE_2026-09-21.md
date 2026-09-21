# COMP-LF-01 — Static Landing Compliance Gate

**Canonical identity:** `COMP-LF-01-STATIC-LANDING-COMPLIANCE-GATE-20260921`  
**Project:** `CAPITAL-AI-COMP`  
**Canonical project folder:** `docs/projects/compliance/`  
**Baseline:** `main@896722e55ab1304bd798da6fc8c6f2d9b178a12e`  
**State:** `ACTIVE / LANDING_BASELINE_PRESENT / EVIDENCE_GATE`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`  
**Source direction:** Human Owner landing-first direction from 2026-09-21; non-authorizing projection only.

## Purpose

Establish the Compliance assessment/evidence gate for the owner-directed `LF-01_STATIC_VISUAL_LANDING` phase without creating a second landing policy, productive PVC ownership, Frontend authority, runtime authority or legal conclusion.

This package is composed through the existing Compliance workstreams `COMP-01..08`. It does not create `COMP-09`, a new productive PVC, or a new control plane.

## Ownership and PVC relationship

- `CAPITAL-AI-COMP` is cross-cutting and owns no productive `PVC-*` stage.
- Compliance scope: applicability, requirement mapping, claims/disclosure review, evidence sufficiency, findings and owner-correct handoff.
- Productive remediation stays with the Primary Owner resolved from `docs/projects/PROJECT_VALUE_CHAIN.md`.
- Primary implementation dependency for LF-01 presentation: `CAPITAL-AI-FE` (cross-cutting presentation owner, no productive PVC).
- Later productive integration owners remain unchanged, including `CAPITAL-AI-FINTECH / PVC-09..17` and `CAPITAL-AI-OPS` for its assigned runtime/operations stages.

## Fresh observed state

### CURRENT_MAIN

At `main@896722e55ab1304bd798da6fc8c6f2d9b178a12e` the canonical root landing already exists.

- PR #1195 is merged and established the static/root landing semantics.
- PR #1206 is merged and established the pinned FRONTEND presentation.
- The former "landing page must first be created" blocker is therefore superseded and must not be used as an execution or merge blocker.
- PR #1209 remains the owner-correct Frontend writer for the outstanding desktop-only responsive correction.
- Independent SEC/QM and truthful live-vs-preview evidence remain separate acceptance inputs.

Landing existence is PASS on CURRENT_MAIN; final cross-owner LF-01 acceptance remains evidence-gated only by the remaining concrete checks.

### Frontend continuation

PR #1195 and PR #1206 are terminal merged evidence for landing existence and presentation establishment. PR #1209 is the remaining Frontend stabilization writer for desktop layout only. COMP does not re-open the already satisfied landing-creation gate.

## Compliance scope before LF-01 PASS

The following work is allowed because it is necessary to define or independently verify LF-01:

1. **Public-claim inventory**
   - classify visible landing statements as static product description, preview, legal disclosure, or productive/live claim;
   - ensure static preview copy does not imply that scoring, pricing, news, subscription or provider runtime is live when it is not.

2. **Placeholder / preview truthfulness**
   - any score, ranking, price, news item, subscription state or provider-derived value shown during LF-01 must either be absent or explicitly presentational;
   - fabricated/synthetic values must never be presented as canonical, live or provider-backed evidence.

3. **Privacy / consent boundary**
   - LF-01 must not introduce a new analytics/tracking activation that requires external runtime for successful root rendering;
   - existing consent controls remain fail-closed: no optional analytics load before valid opt-in;
   - no sensitive/user-specific state may be embedded in static placeholder content.

4. **Legal navigation / disclosure preservation**
   - the static root must preserve reachable privacy, terms/AGB and imprint/legal navigation where applicable to the current product surface;
   - final wording must remain correlated with the current privacy/legal source rather than copied into a new shadow document.

5. **Phase-state truthfulness**
   - visual completion is not runtime completion;
   - `NOT_RUN`, `BLOCKED`, missing provider evidence and placeholder content are never represented as Compliance PASS;
   - LF-01 completion does not pre-approve LF-02..LF-06.

## LF-01 Compliance evidence required

The LF-01 evidence packet must contain or reference:

- exact `current_main_sha` and Frontend exact-head SHA;
- phase identity `LF-01_STATIC_VISUAL_LANDING`;
- route/root rendering evidence;
- initial-render request inventory showing whether scoring, news, pricing, subscription or provider APIs are contacted;
- visible-claim inventory with live/preview/static classification;
- placeholder/skeleton screenshots or DOM evidence sufficient to establish that preview state is not represented as productive truth;
- legal-navigation evidence;
- consent/analytics network evidence establishing fail-closed optional analytics behavior;
- Security and QM gate state as independent inputs;
- unresolved Legal/Human questions, if any;
- owner-correct handovers for every remediation outside COMP.

## Assessment states

Compliance may record only evidence-backed states such as:

- `COMPLIANT`
- `PARTIALLY_COMPLIANT`
- `NON_COMPLIANT`
- `NOT_APPLICABLE`
- `NOT_ASSESSED`
- `EVIDENCE_MISSING`
- `REQUIRES_LEGAL_REVIEW`

No state is inferred from design completion alone.

## Owner-correct handovers

### FE handover

**Target:** `CAPITAL-AI-FE`  
**Required return:** exact-head evidence that LF-01 root rendering is static/presentational and no productive scoring/news/pricing/subscription request is required for first render.  
**Current dependency:** Landing creation is complete via merged #1195/#1206. FE return is limited to remaining #1209 desktop stabilization and exact-head presentation evidence; COMP does not modify FE implementation.

### OPS handover

**Target:** `CAPITAL-AI-OPS`  
**Required return:** request/runtime baseline and later bounded before/after integration deltas.  
**Current dependency:** routing correlation may proceed where required for LF-00, but no OPS productive landing integration is authorized by this COMP package.

### SEC handover

**Target:** `CAPITAL-AI-SEC`  
**Required return:** independent static-landing security baseline and any blocking findings.  
**Boundary:** Security PASS/FAIL remains SEC-owned.

### QM handover

**Target:** `CAPITAL-AI-QM`  
**Required return:** independent LF-01 exit verification.  
**Boundary:** implementation claims do not self-certify.

### Later FINTECH / pricing / data handovers

Landing existence does not authorize productive scoring, pricing, entitlement, news or provider integration. Those remain phase-dependent returns with their canonical owners and require their own evidence/gates.

## Exit evidence

This package reaches `LF01_COMP_EVIDENCE_READY` only when:

1. CURRENT_MAIN and the exact FE head are freshly correlated;
2. LF-01 root rendering succeeds without productive feature API dependencies required for first render;
3. visible placeholders/previews cannot reasonably be mistaken for live score/news/price/subscription truth;
4. legal navigation is present and the current privacy/consent boundary is preserved;
5. optional analytics remains consent-gated and is not a root-render dependency;
6. Security and QM states are referenced independently;
7. all missing evidence remains explicit;
8. every remediation is routed to its actual owner;
9. no Compliance PASS is inferred for LF-02..LF-06.

**Important:** `LF01_COMP_EVIDENCE_READY` is a Compliance evidence state only. The shared `LF-01_STATIC_VISUAL_LANDING_PASS` still requires the complete cross-owner exit evidence defined by the active architecture and Human/CODEOWNER gates.
