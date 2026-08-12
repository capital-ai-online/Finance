# ADR-0064 — Supabase Native MFA / AAL2 Hardening

**Status:** PROPOSED — HUMAN/OWNER APPROVAL REQUIRED  
**Implementation-Status:** 🟡 IN PROGRESS — READ-ONLY BASELINE COMPLETE  
**Date:** 2026-08-12  
**Roadmap Phase:** M5A  
**Authority:** ESS-0020, ADR-0003.5, ADR-0058

## Context

M5A requires a code- and production-evidence-based review of TOTP MFA and AAL2 before M6 can begin.

The read-only baseline found a split-brain authentication model:

- CAPITAL-AI stores and verifies its own RFC-6238 TOTP secrets in `public.profiles` and issues its own short-lived `step_up_tokens`;
- Supabase Auth is the primary session and identity authority;
- the production Supabase Auth state contains **no native MFA factors** and **no AAL2 sessions**;
- both Owner profiles currently report the legacy application flag `totp_enabled=true`;
- privileged IAM code verifies user identity and role but does not enforce the Supabase `aal` claim;
- login step-up contains a fail-open path on factor/status lookup errors;
- current passkey-first logic may grant login step-up without the TOTP requirement stated in ADR-0003.5.

Therefore the old application-level TOTP proof cannot satisfy M5A's requirement for a provider-authenticated AAL2 session.

## Decision

### 1. Supabase Auth becomes the MFA authority

CAPITAL-AI will use Supabase Native TOTP MFA as the authoritative second-factor mechanism.

The supported flow is:

`enroll → challenge → verify → validate AAL2`

A factor is not considered active for authorization until successful verification has produced a valid AAL2 session state.

### 2. AAL2 is mandatory for privileged Owner/Admin actions

The server must centrally enforce a trusted AAL2 decision in addition to the existing IAM role decision.

A privileged request must fail closed when:

- AAL is `aal1`;
- factor verification is incomplete;
- the session is stale/downgraded;
- Auth/AAL verification cannot be completed;
- a client/UI-only marker claims step-up without matching server evidence.

No browser-only control may substitute for server enforcement.

### 3. Existing CAPITAL-AI step-up becomes defense-in-depth

The purpose-bound, single-use `x-step-up-token` contract may remain for critical actions because it provides action binding and replay resistance beyond generic session MFA.

However:

- it may only be issued/accepted together with a valid AAL2 session;
- it never elevates an AAL1 session to AAL2;
- its user/purpose/expiry/single-use constraints remain mandatory;
- freshness requirements for critical owner actions must be demonstrated by tests rather than assumed from an AMR timestamp.

### 4. Passkey does not automatically satisfy M5A AAL2

Passkeys remain a supported authentication mechanism, but M5A authorization is based on the actual Supabase AAL evidence. A passkey login or confirmation is not treated as equivalent to a verified TOTP MFA factor unless Supabase produces the AAL state explicitly accepted by ESS-0020.

### 5. Legacy TOTP is migrated, not trusted indefinitely

The custom TOTP implementation in `src/platform/Security/totp.ts`, `server/stepUp.ts`, `TotpSettings.tsx` and related profile fields becomes migration-only legacy scope.

Existing encrypted secrets will not be copied directly into Supabase Auth by unsupported database manipulation. Both Owner identities must re-enroll via supported native MFA APIs.

Legacy data removal is deferred until native enrollment, AAL2 enforcement and recovery have reached `VERIFIED PASS`, and requires a separate Human/Owner-approved mutation/cleanup step.

### 6. Recovery is separated from normal authentication

Native factor recovery must remain Owner-controlled and auditable.

The target design prefers a tested backup factor/recovery procedure. If CAPITAL-AI retains its offline break-glass codes, they may authorize a tightly scoped server-side recovery operation but may not mint AAL2 or grant roles. Native factor removal must use supported Supabase Admin MFA operations and must produce critical audit evidence.

Automatic deletion of unrelated passkeys as a side effect of TOTP recovery is not part of the target contract unless separately approved.

## Production baseline

Read-only evidence gathered on 2026-08-12:

| Signal | Result |
|---|---|
| Supabase project | `AIFINANCIAL` / ACTIVE_HEALTHY |
| Organization plan | Free |
| Native `auth.mfa_factors` | 0 |
| Active session AAL distribution | 2 × `aal1`, 0 × `aal2` |
| Legacy Owner TOTP flags | 2 Owner profiles with `totp_enabled=true` |
| Legacy recovery codes | 20 unused rows |
| Active legacy step-up tokens | 0 |
| Security Advisor | `auth_insufficient_mfa_options` warning present |
| Leaked Password Protection | warning present; Pro+ plan dependency, separate/deferred |

No MFA secret, code, user email, token or factor identifier was read or recorded.

## Mutation decision

### Required

- repository/application changes for native enrollment/challenge/verify and AAL2 enforcement;
- native TOTP enrollment for the two Owner identities after Human/Owner approval;
- verification tests that produce AAL2 evidence.

### Conditional

- Supabase project MFA configuration mutation. The available connector does not expose the Dashboard's exact Challenge/Verify configuration, so a project-setting change is authorized only if a pre-mutation check proves it necessary.

### Not required for core M5A

- new Postgres tables for Supabase Native MFA;
- Stripe changes;
- unrelated Render configuration changes.

### Deferred

- deletion of legacy TOTP columns/secrets, recovery-code rows/tables and obsolete custom verifier code after successful cutover;
- Leaked Password Protection until the Supabase plan supports it.

## Implementation sequence

1. Merge this baseline/architecture package after Human/Owner review.
2. Implement native MFA client flows and centralized server AAL2 verifier on a fresh branch.
3. Add positive/negative unit/integration tests.
4. Pass required CI.
5. Human/Owner approves production Auth-factor mutation.
6. Enroll and verify native TOTP for Owner identities through supported API/UI flows.
7. Prove AAL2 and negative AAL1/stale/error behavior.
8. Verify recovery/backup procedure.
9. Rerun Supabase Security Advisor.
10. Synchronize M5A evidence/roadmap and only then unblock M6.

## Rollback

Before native factors are enrolled, rollback is code/documentation-only.

After enrollment begins:

- do not remove legacy recovery capability until native recovery is proven;
- if application enforcement causes lockout risk, roll back application enforcement while preserving enrolled factors and audit evidence;
- native factor deletion is a separate, explicit recovery operation and must never be used as an automatic rollback;
- do not delete legacy encrypted secrets/schema until a separate cleanup gate is approved.

## Consequences

### Positive

- MFA assurance becomes cryptographically bound to the Supabase session/JWT instead of a parallel application flag;
- APIs can enforce one canonical AAL2 security invariant;
- stale/downgraded sessions become detectable;
- the existing purpose-bound step-up remains available as additional defense-in-depth;
- Owner MFA status becomes consistent with Supabase Auth's native factor/session model.

### Costs / Migration Risk

- both Owner identities must re-enroll TOTP;
- login and privileged API paths require coordinated changes;
- recovery logic must be redesigned before custom TOTP can be removed;
- transition must avoid a state where both legacy and native factor models can independently authorize a privileged action.

## Acceptance

ADR-0064 is accepted only after Human/Owner review of this PR. Acceptance authorizes **implementation**, not production factor enrollment or Auth configuration mutation. Production mutation requires the later explicit M5A mutation gate.
