# AUTH Post-MFA Session / Subscription Diagnosis — 2026-08-30

## Scope

Read-only production diagnosis of the Google OAuth → Supabase session → native MFA/AAL → subscription projection path, plus the branch-local remediation of the post-MFA session handoff.

Repository baseline at start: `main@e311c30d18951785a68154d994a403799819c194`.

Fix branch: `fix/auth-post-mfa-subscription-handoff-20260830`.

No direct `main` mutation and no production deployment are part of this evidence record.

## Production observations

### Entitlement state

The affected authenticated account has an active `Enterprise` row in `public.subscriptions`. The subscription record itself is therefore not missing; the observed missing/Free status is a projection/readback problem after login.

### Google OAuth

Supabase Auth logs show successful Google authorization and callback responses. The Supabase-side OAuth callback completes in the normal sub-second range; the multi-second wall-clock interval around the browser redirect includes the external Google account-selection/authentication round trip and is not a slow Supabase callback.

### Native MFA / AAL2

The account has one verified TOTP factor (`CAPITAL-AI Native MFA`). During the inspected login:

- factor challenge: HTTP 200, approximately 40 ms Supabase processing time;
- factor verify: HTTP 200, approximately 45 ms Supabase processing time;
- challenge-to-verify wall-clock gap: approximately 26.6 s.

The server-side AAL2 challenge/verify endpoints are therefore not the source of the perceived tens-of-seconds latency. The gap occurs between challenge creation and verification submission / frontend continuation.

The currently active session is already `aal1` with `factor_id = null`. The verified factor remains enrolled, so a future conventional/social login can still advertise `nextLevel = aal2`.

### Token rotation signal

The Auth log contains `refresh_token_not_found` during the same usage window. MFA verification also produces token/session rotation activity. This is consistent with a stale-session handoff/race rather than a slow MFA verifier.

### Request amplification

After authentication, multiple protected application requests trigger server-side `auth.getUser(token)` checks and IAM-role reads. In addition, `SystemLatencyMonitor` polls `/api/orchestrator/stats` every 10 seconds. This is a secondary request-amplification factor, not the primary MFA latency cause.

## Root cause in repository code

`src/app/auth/SessionComposition.tsx` captured the pre-step-up Supabase session and, after MFA verification, reused that same object for the subscription request:

- direct `fetch()`;
- Bearer token taken from the captured pre-MFA `session.access_token`;
- no use of the repository's existing rotation-aware `authFetch()` helper.

At the same time `src/lib/authFetch.ts` already implements the intended contract: read the live SDK session, perform one deduplicated refresh on missing/401 state, retry once, and only then emit the global unauthorized event.

This mismatch explains why a successful MFA verification can be followed by a broken or downgraded subscription projection during token rotation.

## Branch-local remediation

`SessionComposition` now:

1. re-reads the live Supabase session after successful step-up;
2. verifies that the live session still belongs to the expected user;
3. uses `authFetch('/api/stripe/user-subscription')` instead of a captured Bearer token;
4. does not project a `Free` session from an unrecoverable 401 while the global unauthorized path is taking over;
5. has a regression test covering the post-MFA session handoff and rotation-aware subscription request.

## Legacy subscription readbacks — remediated on branch

The two remaining pre-hardening frontend readbacks have been migrated without restoring the removed IDOR-prone query contract:

- `src/components/Dashboard.tsx` now reconciles a registered user's tier through `readAuthenticatedSubscriptionTier()`;
- `src/components/Abonnements.tsx` uses the same authenticated helper and only runs it for a registered subject (`userId` present);
- `src/lib/subscriptionReadback.ts` is the single UI readback adapter and calls only `authFetch('/api/stripe/user-subscription')`;
- neither Dashboard nor Abonnements sends `email` or `userId` as subscription-readback query parameters.

The server therefore remains the identity authority: `resolveVerifiedIdentity(req)` derives the subject from the verified Bearer token, and the client only consumes the returned subscription projection.

### Dashboard cache authority repair

The encrypted local Dashboard profile remains useful for user-editable presentation/profile fields, but it is no longer an entitlement authority. When cached profile data is restored, the current authenticated `UserSession` overwrites cached `email`, `id` and `subscriptionTier` values before the profile becomes visible. A stale locally cached `Free` value can therefore no longer downgrade a freshly resolved paid session.

`tests/unit/subscriptionReadbackAuthContract.test.ts` guards the following boundaries:

- the centralized readback uses `authFetch('/api/stripe/user-subscription')`;
- no `?email=` or `?userId=` subscription identity is reintroduced;
- Dashboard and Abonnements contain no legacy direct subscription fetch;
- Dashboard cached entitlement remains subordinate to the live `UserSession`;
- guest sessions do not issue authenticated subscription readbacks.

## MFA factor deactivation boundary

The connected Supabase management surface does not expose the supported GoTrue Admin MFA delete-factor operation. A raw SQL delete from `auth.mfa_factors` was deliberately not used because it would bypass the supported Auth mutation path and its session-downgrade semantics.

Current Supabase Auth implements admin factor deletion transactionally and downgrades sessions associated with the removed factor to AAL1. The production account's current session is already AAL1; nevertheless the factor remains enrolled until it is removed through the supported Admin Auth path.

## Validation / promotion gate

- Branch originated from exact `main@e311c30d18951785a68154d994a403799819c194`.
- No open PR overlapped this scope at branch creation.
- No hosted Build/Test run was triggered before PR creation.
- Post-MFA session handoff, authenticated subscription readback and Dashboard cache-authority boundaries are covered by regression tests in the branch.
- PR creation, hosted CI and production promotion remain separate governed steps.
- Before PR creation, re-read current `main`, correlate open PR scopes and report exact candidate/main SHAs for explicit Owner approval in accordance with `AGENTS.md`.
