# CAPITAL-AI-OPS — User-Lifecycle Simulation Work Package

**Work item:** `GOV-CHAT-040`  
**OPS claim:** `CAPITAL-AI-OPS-USER-LIFECYCLE-SIMULATION-2026-09-01`  
**Primary stage:** `PVC-02`  
**Secondary stage:** `PVC-08`  
**Branch:** `agent/operations-user-lifecycle-simulation-20260901`  
**Initial base:** `main@315056a50dc6f779c178c4ff6d06074353d1972a`  
**Status:** IMPLEMENTED CANDIDATE / PROVIDER EVIDENCE PARTIAL  
**Authority effect:** none

## Objective

Provide one reproducible, fail-closed User-Lifecycle test contract that reuses the existing CAPITAL-AI Auth, Stripe inbox, outbox, subscription projection and entitlement-readback boundaries. Actual provider evidence is kept separate from repository-contract evidence; an unavailable local/sandbox provider is always `NOT_AVAILABLE`, never a mock PASS.

This package does not authorize Production deployment, Production Supabase migration, live Stripe mutation, Security verification, Compliance approval or Frontend implementation.

## Reused productive boundaries

| Concern | Existing boundary reused |
|---|---|
| Authenticated principal | `src/platform/Security/authMiddleware.ts` |
| Subscription readback | `src/lib/subscriptionReadback.ts` → authenticated `/api/stripe/user-subscription` |
| Billing route | `server/stripe.ts` |
| Stripe signature boundary | `server.application.ts` raw-body webhook route |
| Stripe event deduplication | `server/stripeEventInbox.ts` + `public.stripe_event_inbox` |
| Mail delivery | `server/mailer.ts` |
| Durable mail retry | `server/outbox.ts` + `server/outboxWorker.ts` + `public.outbox_jobs` |
| Subscription projection | `stripe.subscriptions` → `sync_stripe_subscription_to_public()` → `public.subscriptions` |
| Canonical billing projection | `src/features/billing/billingContract.ts` |

No second Auth, Billing, Stripe inbox, Outbox, Entitlement, Release, EventMesh or Production authority is introduced.

## Candidate implementation

- `scripts/operations/userLifecycleHarness.ts` — three explicit modes: `repository_contract`, `supabase_local_mailpit`, `stripe_sandbox_test_clock`.
- `tests/unit/userLifecycleHarness.test.ts` — scenario inventory, fail-closed result aggregation, redaction and repository-contract boundaries.
- `tests/provider/userLifecycleProviderContract.test.ts` — real-provider gate; missing provider prerequisites remain `NOT_AVAILABLE` unless strict provider execution is explicitly required.
- `supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql` — repository migration that makes Stripe subscription `metadata.user_id` the identity input, validates it against `auth.users.id`, keeps email secondary, normalizes only known paid tiers and fails closed for missing/malformed/unknown identity.
- `tests/unit/userLifecycleSubscriptionProjection.test.ts` — static regression contract for the identity projection migration.

The migration is **not applied** to the connected Supabase project by this work item. Production provider mutation remains a separate gate.

## Harness evidence contract

Every generated report contains:

- `repository_sha`
- `branch`
- `work_claim`
- `environment`
- `provider_mode`
- `start_time`
- `end_time`
- `exact_test_command`
- `result`
- `known_limitations`
- per-scenario evidence

Allowed result values are only `PASS`, `FAIL`, and `NOT_AVAILABLE`. Secrets, bearer tokens, JWTs and provider credentials are redacted from evidence text.

## Required lifecycle scenarios

The harness keeps the Governance handoff inventory explicit: registration, email/auth verification, login, session creation, multiple sessions/devices, local logout, global logout, subscription creation, Checkout→webhook transition, subscription projection, server-side entitlement readback, renewal, payment failure, cancel-at-period-end, subscription expiry, reactivation when supported, mail/outbox processing, provider retry and duplicate provider event.

## Supabase Local + Mailpit contract

Actual local provider execution requires a Docker-compatible runtime, Supabase CLI, isolated loopback-only local stack, local anon/service-role credentials and Mailpit. The harness uses unique test identities, verifies Mailpit receipt, establishes concurrent sessions, verifies local/global refresh-session behavior, records the residual access-JWT lifetime limitation and—when the application schema is actually reproducible locally—checks own-row RLS plus cross-user mutation denial.

Already-issued access JWTs may remain usable until expiry under provider semantics; the harness verifies refresh/session invalidation and does not claim instantaneous universal access-token revocation.

### Local reproducibility limitation

The hosted Supabase migration history begins before the oldest checked-in repository migration. Although this candidate now versions the **current intended** `sync_stripe_subscription_to_public()` definition, a clean `supabase db reset` still cannot be claimed to reproduce the entire hosted application schema until the existing remote baseline is safely imported/correlated according to the Supabase existing-project workflow.

Therefore:

- Supabase Local Auth/Mailpit can be exercised on a properly prepared local stack;
- application-schema/RLS replay remains `NOT_AVAILABLE` where the missing baseline prevents deterministic reconstruction;
- this package does not fabricate a partial baseline or mutate Production to obtain one.

## Stripe Sandbox/Test Clock contract

Actual Stripe execution requires an `sk_test_` key, the test annual Pro Price ID, a successful test payment-method fixture and explicit `OPS_USER_LIFECYCLE_ALLOW_STRIPE_SANDBOX_MUTATION=1`.

The harness creates only ephemeral test-mode objects: Test Clock, Customer, payment-method attachment and annual Pro subscription carrying `metadata.user_id` / `metadata.plan_id`. It validates the sandbox Price as `248 EUR/year`, advances time for renewal, applies `cancel_at_period_end`, advances through the authoritative period boundary and validates cancellation/expiry. A live Stripe key is rejected before any mutation.

Payment-failure and true provider redelivery/duplicate-webhook evidence remain `NOT_AVAILABLE` unless a dedicated real Stripe test fixture/delivery path is supplied. Repository inbox/outbox tests remain separate evidence and are not mislabeled as Stripe-provider verification.

## Stable OPS test contract for CAPITAL-AI-FE

Frontend may consume this contract after the OPS package is merged:

1. **Identity:** paid state is keyed by the verified Supabase Auth user ID. Client-provided email, user ID or tier is never authority.
2. **Readback:** consume authenticated `/api/stripe/user-subscription`; do not append identity query parameters or grant paid capability from browser/local cached tier alone.
3. **Checkout:** a successful Checkout redirect is not sufficient entitlement evidence. Paid UI state synchronizes to authoritative server-side projection/readback.
4. **Price:** annual Pro expectation comes from the canonical billing contract and currently resolves to `248 EUR`; do not create a second annual-price calculation.
5. **Logout:** normal logout uses Supabase `local` scope; global logout is a distinct explicit action. Do not claim immediate universal JWT revocation.
6. **Cancellation:** `cancel_at_period_end` preserves entitlement through the authoritative period boundary when the provider remains active; paid state follows server readback.
7. **Unknown/missing subscription:** fail closed to no paid entitlement.
8. **Mail:** Auth/confirmation and subscription-confirmation mail are notification flows, not entitlement authorities.
9. **Retry/duplicates:** tolerate provider retries/duplicates without assuming a second business mutation.

## Candidate remediation — subscription identity projection

Read-only correlation of the connected Supabase project showed the hosted function resolving `auth.users.id` from Stripe Customer email. That conflicts with the handed-off identity invariant. The candidate migration changes the repository contract to:

- read `NEW.metadata->>'user_id'` from the provider subscription;
- reject missing or malformed UUID values without projecting paid state;
- validate the UUID against `auth.users.id`;
- read email only after identity is resolved;
- upsert `public.subscriptions` by `user_id`;
- never select entitlement ownership by email.

**Candidate status:** IMPLEMENTED / NOT DEPLOYED.  
**Provider verification status:** pending a separately authorized non-Production/local or later deployment verification path.

## Open finding — annual price projection drift

`src/features/billing/billingContract.ts` resolves annual Pro to `248 EUR`, while `getAnnualPricePreviewEur('Pro')` in `src/config/subscriptionEntitlements.ts` derives `313.20 EUR` from a generic 10% annual discount. The function has no productive call site in the current repository search, but its stale test/config projection is still visible. The harness reports the divergence rather than choosing an ad-hoc second price authority.

Governance decision `GOV-ULS-DEC-001` and the canonical billing contract define the current `248 EUR` expectation. Consumer/shared projection remediation remains outside this OPS provider-harness implementation unless separately correlated to OPS ownership.

## Commands

Repository contract and unit coverage:

```bash
npx tsx scripts/operations/userLifecycleHarness.ts --mode=repository_contract
npx vitest run tests/unit/userLifecycleHarness.test.ts tests/unit/userLifecycleSubscriptionProjection.test.ts
```

Supabase Local + Mailpit provider run:

```bash
SUPABASE_LOCAL_ANON_KEY='<local-only-key>' \
SUPABASE_LOCAL_SERVICE_ROLE_KEY='<local-only-key>' \
npx tsx scripts/operations/userLifecycleHarness.ts --mode=supabase_local_mailpit
```

Stripe Sandbox/Test Clock provider run:

```bash
OPS_USER_LIFECYCLE_ALLOW_STRIPE_SANDBOX_MUTATION=1 \
STRIPE_SECRET_KEY='<sk_test_...>' \
STRIPE_PRICE_ID_PRO_YEARLY='<test-price-id>' \
STRIPE_TEST_PAYMENT_METHOD_ID='<test-payment-method-id>' \
npx tsx scripts/operations/userLifecycleHarness.ts --mode=stripe_sandbox_test_clock
```

Provider Vitest contract:

```bash
npx vitest run tests/provider/userLifecycleProviderContract.test.ts
```

## Exit gate

`EVIDENCE_READY` requires exact-candidate repository validation, truthful execution of every actually available local/sandbox provider flow, explicit `NOT_AVAILABLE` for unavailable provider scenarios, visible residual findings, no secret leakage, final current-main/open-writer correlation, exact Base/Head Human/Owner PR-creation approval, required hosted PR checks and Human/CODEOWNER merge before any merged return is claimed.
