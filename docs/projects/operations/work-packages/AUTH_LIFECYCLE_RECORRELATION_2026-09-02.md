# CAPITAL-AI-OPS — Auth Lifecycle Re-correlation

**Work item:** `OPS-AUTH-LIFECYCLE-RECORRELATE-2026-09-02`  
**Project:** `CAPITAL-AI-OPS`  
**Primary stage:** `PVC-02`  
**Secondary stage:** `PVC-08`  
**Baseline:** `main@5db8062d3062e93f004cf0b75f190a9c649821f8`  
**Status:** IMPLEMENTED CANDIDATE / FOREIGN REMEDIATION OPEN  
**Authority effect:** none

## Goal

Extend the existing OPS User-Lifecycle evidence package with a deterministic repository correlation for Google OAuth handoff, authenticated root routing, logout scope semantics, normal-user registration/onboarding and public platform-version metadata.

The package is evidence/coordination only. It does not implement Frontend, IAM/Governance or SEO/provider mutations on behalf of foreign projects.

## Reuse

- `scripts/operations/userLifecycleHarness.ts` remains the existing provider/lifecycle harness.
- `scripts/operations/authLifecycleCorrelation.ts` is a bounded repository-correlation adapter using the same `PASS | FAIL | NOT_AVAILABLE` vocabulary.
- Supabase Auth remains the website identity/session authority.
- `package.json#version` remains the sole platform-version authority.

## Current result

- PASS: Google OAuth provider/root callback contract.
- FAIL: authenticated `/` has no deterministic `/dashboard` handoff.
- FAIL: normal logout does not explicitly use `scope: 'local'`.
- FAIL: no distinct explicit global-logout action is represented.
- PASS: self-registration is present and hCaptcha-bound.
- PASS: registration converges on profile/consent + verified MFA onboarding.
- FAIL: registration work-package status remains stale after Human Merge of PR #601.
- PASS: `package.json` and current public metadata project `0.6.0`.
- FAIL: `SoftwareApplication` JSON-LD lacks explicit canonical `softwareVersion` projection; external Google cache/reindex remains separate.

Canonical evidence: `../evidence/AUTH_LIFECYCLE_RECORRELATION_2026-09-02.md`.

## Superseded menu correlation

The former operational finding `dashboard_menu_interaction_contract` is **SUPERSEDED as an active OPS repository correlation**.

This is a bounded work-package supersession only; it has **no Authority effect** and does not supersede any `AUTH-*`, `CTRL-*`, ADR, ESS or Frontend contract. Historical evidence remains unchanged and continues to document the 2026-09-02 repository state.

Reason and scope:

- the former check inspected literal `setMenuOpen(...)` handler strings in `src/components/Dashboard.tsx`;
- that coupled OPS evidence to a legacy Frontend implementation detail and constrained the BB-2E strangler migration;
- Frontend navigation/drawer behavior is owned by `CAPITAL-AI-FE` and the canonical app-layer dashboard/navigation contracts;
- OPS Auth Lifecycle correlation no longer validates menu implementation details, no longer reads `src/components/Dashboard.tsx`, and no longer emits `dashboard_menu_interaction_contract`;
- no authentication, IAM, logout, onboarding, routing, version or SEO finding is removed by this supersession.

The historical 2026-09-02 finding remains evidence only and must not be interpreted as a current requirement that Frontend preserve the legacy `setMenuOpen` wiring.

## Foreign return contracts

### CAPITAL-AI-FE

Exit gate:

1. authenticated Google/session return to `/` continues to `/dashboard` after existing onboarding/AAL gates;
2. standard logout uses Supabase local scope;
3. global logout is a separate explicit/confirmable action;
4. merged registration work-package state is terminalized without weakening onboarding/MFA.

Navigation/drawer implementation and accessibility are governed by the current Frontend project Roadmap/contracts and are intentionally outside this OPS Auth Lifecycle return contract.

### CAPITAL-AI-SEO

Exit gate:

1. structured `SoftwareApplication` metadata derives/projects the canonical package version without creating a second version authority;
2. stale Google-visible `0.5.4` metadata is refreshed through the applicable Google indexing/branding surface;
3. post-refresh evidence reports `0.6.0`.

### CAPITAL-AI-GOV

No new policy decision is requested. Existing local-default/global-explicit logout semantics are consumed as an input; Governance retains policy ownership and does not absorb Frontend execution.

## Validation

```bash
npx tsx scripts/operations/authLifecycleCorrelation.ts
npx vitest run tests/unit/authLifecycleCorrelation.test.ts
```

The non-strict correlation report may contain expected foreign `FAIL` findings. `--strict` is reserved for a later return-correlation when all foreign remediation is expected to be complete.

## Exit gate

This OPS candidate is ready for PR consideration when its claim/evidence/test adapter are exact-main synchronized, no competing writer exists, static validation is available or explicitly unavailable, all foreign implementation remains unexecuted locally, and the Human/Owner approves the exact Base/Head PR snapshot. Merge and Production/provider mutation remain separate gates.
