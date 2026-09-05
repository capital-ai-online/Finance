# CAPITAL-AI-OPS — User Lifecycle Closeout 2026-09-05

**Project:** `CAPITAL-AI-OPS`  
**Primary stage:** `PVC-02`  
**Secondary stages:** `PVC-08`, `PVC-18`  
**Base:** `main@0c595dc4f07fc279eabec272ca6046967f3b83e8`  
**Branch:** `agent/operations-user-lifecycle-closeout-20260905`  
**Status:** `IMPLEMENTED_REPOSITORY_CLOSEOUT / EXTERNAL_GATES_REMAIN`  
**Authority effect:** none

## Objective

Re-correlate the merged User Lifecycle implementation and all remaining OPS-owned evidence against current `main` and current read-only Supabase state. Close stale OPS coordination metadata, preserve truthful provider result vocabulary, and expose the remaining Production/Security/foreign-owner gates without creating a second Auth, Billing, Entitlement, Security, Governance, Release, Production or EventMesh authority.

## Current-main correlation

- PR #683 User Lifecycle Harness is merged and its original claim is released.
- PR #722 Auth Lifecycle Re-correlation is merged; its branch is gone, but its claim remained stale as `active/exclusive` on `main` and is released by this package.
- PR #723 Frontend Auth Lifecycle remediation and PR #725 Security Lifecycle integration are consumed only as historical/current-main evidence anchors; OPS does not edit their owner surfaces here.
- Current open PR #726 is SEO-only and has no changed-file or semantic overlap with this package.

## Subscription identity projection

Repository migration:

`supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql`

Repository invariant:

`verified Supabase Auth user ID -> Stripe subscription metadata.user_id -> validated auth.users.id -> public.subscriptions.user_id`

Email is secondary descriptive data only.

Read-only connected Supabase correlation on 2026-09-05 shows the deployed `public.sync_stripe_subscription_to_public()` still resolves `auth.users.id` by Stripe Customer email. Therefore:

- repository contract: `PASS`;
- deployed provider contract: `FAIL` relative to the repository invariant;
- Production migration/deployment: `PRODUCTION_GATE_REQUIRED`;
- no Production mutation is performed by this work package.

Required later Human/Owner approval must explicitly authorize applying the already-versioned migration (or an exact current-main successor after re-correlation) to Supabase project `AIFINANCIAL`, followed by read-only post-change verification. This approval is separate from PR/merge approval.

## Supabase schema baseline reproducibility

Read-only provider history currently reports 69 remote migration records, starting at `20260709160230`. The checked-in repository migration directory starts later at `20260711000000_iam.sql`. The repository therefore still lacks at least part of the historical remote migration baseline.

A clean application-schema `supabase db reset` cannot be claimed reproducible from repository history alone. No synthetic baseline is created.

Current Supabase workflow correlation uses the documented existing-project sequence:

1. compare local/remote migration state with `supabase migration list`;
2. capture remote schema/history with `supabase db pull`/migration fetch as appropriate for the linked existing project;
3. review the generated baseline/diff rather than blindly accepting it;
4. validate locally with `supabase db reset`;
5. use `migration repair` only when the migration-history record is known to be wrong; it changes history metadata and is not a substitute for missing schema migrations.

Because this execution surface has no isolated Docker/Supabase CLI checkout and because linked remote schema/history mutations are protected operations, local full replay remains `NOT_AVAILABLE` in this package.

## Current RLS/provider security observation

Read-only Supabase state confirms `public.subscriptions` has RLS enabled. The authenticated SELECT policy restricts reads to `auth.uid() = user_id`; service-role has an explicit full-access policy. This is provider-state evidence only and does not replace cross-user local/provider execution.

The current Supabase Security Advisor still reports `auth_leaked_password_protection` disabled. OPS records the finding only; enabling it is a separate provider configuration mutation and remains subject to a current protected-action approval.

## Provider evidence disposition

| Provider flow | Result | Reason |
|---|---|---|
| Supabase registration/session/local/global logout/Mailpit | `NOT_AVAILABLE` | no isolated Supabase Local + Mailpit runtime available in this execution surface |
| Supabase own-row/cross-user RLS local replay | `NOT_AVAILABLE` | complete application migration baseline is not reproducible from repository history yet |
| Stripe annual Pro Test Clock lifecycle | `NOT_AVAILABLE` | no verified Stripe test-mode execution context/test fixtures available here |
| Stripe payment failure | `NOT_AVAILABLE` | no dedicated real test-mode failure fixture executed |
| Stripe provider duplicate/redelivery | `NOT_AVAILABLE` | repository inbox contract exists, but no true provider redelivery path executed |

`NOT_AVAILABLE` is not converted into `PASS`.

## Annual Pro price correlation

Current owner decision `GOV-ULS-DEC-001` records `248 EUR` as the chosen annual Pro catalog expectation without authorizing a Stripe mutation. `src/features/billing/billingContract.ts` projects `248`, while `src/config/subscriptionEntitlements.ts#getAnnualPricePreviewEur('Pro')` still derives `313.20` from the older 10% rule in Accepted ADR-0034.

Repository search still finds no productive call site for `getAnnualPricePreviewEur` outside tests and the OPS harness. The drift is therefore retained as `FOREIGN_OWNER_REMAINS`; this package does not change the canonical entitlement/shared product contract.

## Security findings

OPS preserves CAPITAL-AI-SEC as independent verifier. Current relevant residuals remain:

- `ULS-SEC-001`: Production subscription identity projection not yet deployed/verified -> OPS evidence dependency / `PRODUCTION_GATE_REQUIRED`;
- `ULS-SEC-002`: provider lifecycle scenarios incomplete -> `PROVIDER_EVIDENCE_NOT_AVAILABLE`;
- `ULS-SEC-003` / `S1-R2-06`: target-owned protected-capability server enforcement gaps -> foreign child owners remain;
- `ULS-SEC-004`: provider-defined access JWT residual window after logout -> explicit residual, not silently closed;
- `ULS-SEC-005`: leaked-password protection disabled -> provider config mutation requires separate approval;
- `S1-R2-05`: Stripe redirect boundary remains an OPS-owned Security remediation package and is not silently absorbed into this closeout package.

No Security finding is marked `VERIFIED` or `CLOSED` by OPS.

## Exit state

Repository-side closeout is complete when this package/evidence and stale claim hygiene are synchronized on the scoped branch and exact branch state is reported for Human/Owner PR-creation approval.

External gates remain independent:

- Supabase Production migration/deployment and post-change read-only verification;
- isolated Supabase Local/Mailpit replay after a safe historical baseline import/correlation;
- Stripe sandbox/Test Clock evidence where a true test-mode context is available;
- CAPITAL-AI-SEC re-verification;
- foreign-owner entitlement/price projection work where applicable.
