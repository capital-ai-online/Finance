# CAPITAL-AI-OPS — User Lifecycle Closeout 2026-09-05

**Project:** `CAPITAL-AI-OPS`  
**Primary stage:** `PVC-02`  
**Secondary stages:** `PVC-08`, `PVC-18`  
**Current-main correlation:** `main@687105ffe90f649c8ada6310976826c9ea625f27`  
**Branch:** `agent/operations-user-lifecycle-closeout-20260905`  
**Status:** `OPS_REPOSITORY_AND_READ_ONLY_PROVIDER_EVIDENCE_READY / EXTERNAL_TEST_AND_SECURITY_GATES_REMAIN`  
**Authority effect:** none

## Objective

Re-correlate the merged User Lifecycle implementation and the remaining OPS-owned evidence against current `main` and current read-only Supabase state. Close stale OPS coordination metadata, preserve truthful provider-result vocabulary, and expose the remaining isolated-provider/Security gates without creating a second Auth, Billing, Entitlement, Security, Governance, Release, Production or EventMesh authority.

Foreign project implementation is deliberately not performed in this package.

## Current-main correlation

- PR #683 User Lifecycle Harness is merged and its implementation is present on current `main`.
- PR #722 Auth Lifecycle Re-correlation is merged; its stale `active/exclusive` claim is terminalized by this PR.
- PRs #723/#725 and other foreign-owner returns are consumed only as evidence anchors; their project surfaces are not edited.
- Current open PR #728 is FINTECH/Equity and has no changed-file or semantic overlap with this package.
- The branch is synchronized with `main@687105ffe90f649c8ada6310976826c9ea625f27`; merge-base equals current main.

## Subscription identity projection

Repository migration:

`supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql`

Required invariant:

`verified Supabase Auth user ID -> Stripe subscription metadata.user_id -> validated auth.users.id -> public.subscriptions.user_id`

Read-only connected Supabase correlation on 2026-09-05 now confirms the deployed `public.sync_stripe_subscription_to_public()` follows that invariant:

- it reads `NEW.metadata->>'user_id'`;
- rejects missing/malformed UUID values;
- validates the UUID against `auth.users.id`;
- reads email only after identity is resolved;
- upserts `public.subscriptions` by `user_id`.

The previous email-owned provider mismatch is therefore no longer current. No Production mutation was performed by this work package.

Remote migration history also now contains `user_lifecycle_subscription_identity_authority` as version `20260905103413`. The timestamp differs from the checked-in migration filename; this is recorded as correlation evidence, not rewritten or repaired automatically.

## Supabase schema baseline reproducibility

Read-only provider history currently reports 70 migration records, starting at `20260709160230`. The checked-in repository migration directory still starts later at `20260711000000_iam.sql`.

Therefore the User Lifecycle identity migration is present remotely, but the repository still lacks at least part of the older historical remote migration baseline. A clean application-schema `supabase db reset` cannot yet be claimed reproducible from repository history alone.

No synthetic baseline and no history rewrite is performed. A later isolated baseline-correlation package should capture/review remote history and prove local replay before claiming reproducibility.

## Current RLS/provider security observation

Read-only Supabase state confirms:

- `public.subscriptions` has RLS enabled;
- authenticated SELECT is restricted to `(select auth.uid()) = user_id`;
- service role retains an explicit full-access policy.

Supabase Security Advisor still reports `auth_leaked_password_protection` disabled. OPS records the finding only; changing Auth provider configuration requires a separate current protected-action approval.

## Provider evidence disposition

| Provider flow | Result | Reason |
|---|---|---|
| Deployed subscription identity function | `PASS` | current read-only provider function matches stable-user-ID invariant |
| Supabase registration/session/local/global logout/Mailpit | `NOT_AVAILABLE` | no isolated Supabase Local + Mailpit runtime in this execution surface |
| Supabase own-row/cross-user RLS replay | `NOT_AVAILABLE` | full application migration baseline is not reproducible locally yet |
| Stripe annual Pro Test Clock lifecycle | `NOT_AVAILABLE` | no verified test-mode execution context/test fixtures executed here |
| Stripe payment failure | `NOT_AVAILABLE` | no dedicated real test-mode failure fixture executed |
| Stripe provider duplicate/redelivery | `NOT_AVAILABLE` | repository inbox contract exists, but no true provider redelivery path executed |

`NOT_AVAILABLE` is never converted into `PASS`.

## Annual Pro price correlation

Current Owner decision `GOV-ULS-DEC-001` records `248 EUR` as the annual Pro catalog expectation. `src/features/billing/billingContract.ts` projects `248`, while `src/config/subscriptionEntitlements.ts#getAnnualPricePreviewEur('Pro')` still derives `313.20` from the older generic 10% rule.

This remains foreign/shared product-contract work. OPS does not mutate it and does not create a second Billing authority.

## Security findings

OPS preserves CAPITAL-AI-SEC as independent verifier. Current relevant disposition:

- deployed stable-user-ID provider contract: `OPS_PROVIDER_EVIDENCE_READY`, not Security-verified;
- remaining provider lifecycle scenarios: `PROVIDER_EVIDENCE_NOT_AVAILABLE`;
- target-owned protected-capability enforcement: foreign child owners remain;
- access-JWT residual window after logout: explicit provider residual;
- leaked-password protection: separate provider-configuration mutation gate;
- S1-R2-05 Stripe redirect boundary: separate OPS Security work package, not silently absorbed into User Lifecycle closeout.

No Security finding is marked `VERIFIED` or `CLOSED` by OPS.

## OPS User Lifecycle exit state

The OPS-owned User Lifecycle repository implementation and current read-only provider correlation are evidence-ready when:

- the branch is current with `main`;
- stale OPS writer metadata is terminalized;
- provider identity/RLS facts are recorded truthfully;
- unavailable isolated-provider scenarios remain explicit `NOT_AVAILABLE`;
- exact-head hosted checks pass;
- Human/CODEOWNER merge remains separate.

Remaining gates do not authorize foreign implementation in this PR:

- isolated Supabase Local/Mailpit replay after safe historical baseline correlation;
- Stripe sandbox/Test Clock evidence in a verified test-mode context;
- CAPITAL-AI-SEC independent re-verification;
- foreign-owner lifecycle/pricing/entitlement/compliance work, to be handled only after this OPS package as directed by the Owner.
