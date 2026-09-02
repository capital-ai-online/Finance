# CAPITAL-AI-OPS — Auth Lifecycle Re-correlation Evidence

**Date:** 2026-09-02  
**Project:** `CAPITAL-AI-OPS`  
**Stages:** `PVC-02` + `PVC-08` evidence/correlation only  
**Baseline:** `main@5db8062d3062e93f004cf0b75f190a9c649821f8`  
**Claim:** `CAPITAL-AI-OPS-AUTH-LIFECYCLE-RECORRELATION-2026-09-02`  
**Authority effect:** none  
**Production mutation:** none

## Objective

Re-correlate the existing OPS User-Lifecycle evidence contract against the currently observed Google OAuth handoff, authenticated routing, menu interaction, logout semantics, self-registration/onboarding and canonical platform-version projection. Findings are assigned to their owning project and are not implemented across foreign project boundaries by OPS.

## Current evidence summary

| Finding | Result | Owner | Current observation |
|---|---|---|---|
| `google_oauth_provider_handoff` | PASS | CAPITAL-AI-FE | Canonical login uses Supabase Google OAuth with callback to `/`. |
| `authenticated_root_dashboard_handoff` | FAIL | CAPITAL-AI-FE | `/` renders the public landing composition without a `userSession -> /dashboard` handoff. |
| `dashboard_menu_interaction_contract` | PASS | CAPITAL-AI-FE | Hamburger open/close handlers and overlay close wiring exist in `Dashboard.tsx`; the reported post-login freeze is therefore correlated first to app/session composition rather than a missing menu handler. |
| `logout_local_default` | FAIL | CAPITAL-AI-FE | `SessionComposition.handleLogout()` calls `supabase.auth.signOut()` without `{ scope: 'local' }`; provider default is global. |
| `logout_explicit_global_action` | FAIL | CAPITAL-AI-FE | No separate user-facing explicit global logout action is represented in the current application contract. |
| `registration_primary_contract` | PASS | CAPITAL-AI-FE | `/login` contains Supabase `signUp`, fresh hCaptcha binding, `full_name` and visible normal-user registration. |
| `registration_onboarding_contract` | PASS | CAPITAL-AI-GOV | New sessions converge on `RegistrationCompletionGate`, profile/consent completion and verified MFA completion endpoints. |
| `registration_roadmap_closure` | FAIL | CAPITAL-AI-FE | The 2026-08-29 registration work package still says `IMPLEMENTED / PR VALIDATION PENDING` although PR #601 was Human-merged. |
| `platform_version_projection` | PASS | CAPITAL-AI-OPS | `package.json#version` and current public page metadata both project `0.6.0`. |
| `search_structured_version_metadata` | FAIL | CAPITAL-AI-SEO | `SoftwareApplication` JSON-LD does not explicitly declare `softwareVersion: 0.6.0`; external search-engine cache/reindex is a separate provider follow-up. |

Static repository correlation therefore resolves to **5 PASS / 5 FAIL**. The FAIL entries are foreign implementation/documentation/provider follow-ups except for continued OPS evidence tracking.

## Google provider/runtime correlation

Connected Supabase Auth logs on 2026-09-02 show successful Google OAuth flow sequences (`/authorize` -> provider callback -> `/user 200`). No provider failure is evidenced in the observed flow. The defect boundary is after successful authentication, inside application routing/session composition.

A current public web crawl of `https://capital-ai.online/` also exposes `VERSION 0.6.0` and the current `Version 0.6.0` page description. Therefore an observed Google display of `0.5.4` is not supported by the current website/package identity and should be treated as stale Google index/branding/account metadata until the corresponding Google surface is refreshed and verified.

## Registration lifecycle status

The repository already contains the primary registration contract and onboarding chain:

```text
/login registration
-> Supabase signUp + fresh hCaptcha
-> email/session establishment
-> SessionComposition
-> needsOnboarding
-> RegistrationCompletionGate
-> POST /api/auth/register/complete
-> native TOTP or WebAuthn MFA
-> POST /api/auth/mfa/enrollment-complete
-> protected application session
```

The remaining gap is **not absence of implementation**. It is lifecycle closure/evidence: the old work-package status is stale and a complete product-level flow should be revalidated after the Frontend routing/logout remediation.

## Foreign remediation boundaries

### CAPITAL-AI-FE

Required exit gates:

1. authenticated `/` deterministically hands off to `/dashboard` after the existing onboarding/AAL gates;
2. normal logout explicitly uses Supabase `{ scope: 'local' }`;
3. global logout is a distinct explicit, confirmable user action;
4. post-login hamburger/sidebar interaction remains usable;
5. the merged registration work-package status is terminalized while retaining separate runtime validation state.

### CAPITAL-AI-SEO

Required exit gates:

1. public structured `SoftwareApplication` metadata explicitly projects the canonical `package.json#version` without creating a second version authority;
2. Google Search Console/indexing or other relevant Google metadata is refreshed separately where the stale `0.5.4` display persists;
3. post-refresh evidence confirms the Google-visible version is `0.6.0`.

### CAPITAL-AI-GOV

No new policy decision is required by this evidence package. Existing logout semantics already select local logout as default and explicit global logout as the separate action. Governance remains the policy/decision owner; implementation belongs to the presentation/application composition surface.

## OPS validation command

```bash
npx tsx scripts/operations/authLifecycleCorrelation.ts
npx vitest run tests/unit/authLifecycleCorrelation.test.ts
```

`--strict` may be used only when all foreign remediations are expected to have returned; while foreign findings intentionally remain open, the non-strict report is the truthful correlation artifact.

## Exit gate

OPS evidence is complete when the correlation inventory is exact-main synchronized, all current observations are explicit, no foreign implementation is performed by OPS, and later foreign remediation can re-run the same adapter to demonstrate the corresponding FAIL -> PASS transitions. Merge, deployment and provider mutation remain separate Human-gated actions.
