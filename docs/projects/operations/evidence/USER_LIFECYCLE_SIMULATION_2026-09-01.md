# CAPITAL-AI-OPS — User-Lifecycle Simulation Evidence — 2026-09-01

**Work claim:** `CAPITAL-AI-OPS-USER-LIFECYCLE-SIMULATION-2026-09-01`  
**Branch:** `agent/operations-user-lifecycle-simulation-20260901`  
**Initial repository SHA:** `315056a50dc6f779c178c4ff6d06074353d1972a`  
**Environment:** GitHub candidate + Supabase/Render read-only provider correlation  
**Status:** CANDIDATE IMPLEMENTED / PROVIDER EXECUTION PARTIAL  
**Production mutation:** NONE

## Evidence policy

No reusable credentials, access tokens, refresh tokens, cookies, webhook secrets, service-role keys, OAuth credentials or full payment data are copied into this record. Hosted-provider reads are correlation evidence only and are not treated as Supabase Local or Stripe Sandbox PASS.

## Entry precheck

| Field | Result |
|---|---|
| `/AGENTS.md` | PASS — current main read |
| Entry main | `315056a50dc6f779c178c4ff6d06074353d1972a` |
| Open PR overlap | NONE |
| Semantic overlap | NONE |
| Primary owner | `CAPITAL-AI-OPS` |
| Primary / secondary stage | `PVC-02` / `PVC-08` |
| Authority conflict | NONE |
| Parallel architecture | NONE |

An unrelated active OPS Alpha-Vantage claim had no changed-file or semantic overlap with this package.

## Candidate changed scope

- `.ai/work-claims/CAPITAL-AI-OPS-USER-LIFECYCLE-SIMULATION-2026-09-01.json`
- `scripts/operations/userLifecycleHarness.ts`
- `tests/unit/userLifecycleHarness.test.ts`
- `tests/unit/userLifecycleSubscriptionProjection.test.ts`
- `tests/provider/userLifecycleProviderContract.test.ts`
- `supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql`
- `docs/projects/operations/work-packages/USER_LIFECYCLE_SIMULATION.md`
- this evidence record

The harness uses only `PASS`, `FAIL`, `NOT_AVAILABLE`; rejects live Stripe keys; and redacts provider secrets/tokens from generated evidence.

## Reused repository contracts

Entry-baseline inspection confirmed:

- Stripe webhook signature verification consumes the raw request body before global `express.json()`.
- `server/stripeEventInbox.ts` persists/deduplicates provider event identities and blocks payload-integrity conflicts.
- `server/mailer.ts` plus `server/outbox.ts`/worker provide durable idempotent subscription-mail retry.
- `src/lib/subscriptionReadback.ts` uses authenticated `/api/stripe/user-subscription` without client identity query parameters.
- the server readback route resolves a verified principal and calls `getSubscription(identity.userId)`.
- the canonical billing contract resolves annual Pro to `248 EUR`.

## Supabase read-only provider correlation

Connected project status: `ACTIVE_HEALTHY`; PostgreSQL `17.6.1`; region `eu-west-1`.

Read-only metadata showed RLS enabled on `public.subscriptions`, `public.stripe_event_inbox` and `public.outbox_jobs`. The authenticated subscription SELECT policy is own-row (`auth.uid() = user_id`); inbox/outbox privileged access remains service-role scoped.

The hosted `stripe_subscription_sync_trigger` executes after INSERT/UPDATE on `stripe.subscriptions` and calls `public.sync_stripe_subscription_to_public()`.

### ULS-OPS-001 — subscription identity authority

**Hosted observation:** the current deployed function resolves `auth.users.id` from Stripe Customer email before upserting `public.subscriptions`. That violates the handoff invariant that `supabase_auth_user_id` is primary identity and email is not Billing authority.

**Candidate remediation:** `supabase/migrations/20260901162000_user_lifecycle_subscription_identity_authority.sql` now versions the intended function and:

1. reads `NEW.metadata.user_id` propagated by the server-owned Checkout subscription metadata;
2. rejects missing/malformed UUID input without projecting paid state;
3. validates the UUID against `auth.users.id`;
4. reads email only after identity resolution;
5. upserts by `user_id`;
6. accepts only known paid tier labels and otherwise preserves the existing known-price fallback/fail-closed behavior.

**Candidate result:** IMPLEMENTED / NOT DEPLOYED.  
**Production Supabase mutation:** NONE.  
**Provider verification:** pending a separately authorized local/non-Production or later deployment verification path.

### ULS-OPS-002 — incomplete local Supabase baseline

Hosted migration history starts before the oldest checked-in repository migration. The candidate now versions the current intended subscription-sync function, but the repository still cannot truthfully claim that a clean `supabase db reset` recreates the entire hosted application schema.

Supabase guidance for an existing project requires correlating/pulling the remote schema baseline before clean local replay. This work item therefore does not manufacture a partial baseline or alter Production.

**Result:** `NOT_AVAILABLE` for clean application-schema local replay until baseline correlation is completed.

### Supabase Security Advisor observation

`auth_leaked_password_protection` is disabled on the connected project. This is a separate Security/Operations follow-up and was not changed by this work package.

## Render read-only provider correlation

Observed `Finance` service configuration:

- branch `main`;
- Docker runtime;
- Frankfurt region;
- health path `/healthz`;
- automatic deploy disabled;
- PR previews disabled.

The latest observed live deployment remained on commit `57a5dc6fc7ee4e66419903015b7ba1cd0e1b5065`, older than the repository entry main `315056a50dc6f779c178c4ff6d06074353d1972a`. This confirms Release/main and Production deployment remain separate. No Render mutation occurred.

## ULS-OPS-003 — annual price projection drift

Current repository projections disagree:

- canonical billing contract: annual Pro `248 EUR`;
- `getAnnualPricePreviewEur('Pro')`: `313.20 EUR` from the generic 10% calculation.

Repository search found no productive call site for `getAnnualPricePreviewEur`; its current use is the config definition and unit-test projection. The OPS harness reports the divergence instead of treating it as a second price authority. `GOV-ULS-DEC-001` and the canonical billing contract remain the `248 EUR` expectation.

**Result:** OPEN CONSUMER/SHARED PROJECTION FINDING; not silently fixed in this OPS provider package.

## Stripe Test Clock API correlation

Current official Stripe documentation confirms that Test Clocks are testmode helpers; clocks can be created, advanced to observe subscription renewal/state changes and deleted. Advancement is bounded to two billing intervals at a time. The candidate harness follows that model and rejects any secret key not beginning with `sk_test_` before test-object mutation.

## Provider execution matrix for this chat surface

| Evidence | Result |
|---|---|
| GitHub candidate implementation | IMPLEMENTED |
| Supabase hosted schema/RLS/function correlation | PASS as read-only correlation |
| Supabase Local Auth/Mailpit lifecycle | `NOT_AVAILABLE` — no working local CLI/Docker stack attached |
| Supabase Local application-schema/RLS replay | `NOT_AVAILABLE` — remote baseline correlation incomplete |
| Stripe Sandbox/Test Clock lifecycle | `NOT_AVAILABLE` — no selected sandbox account/test fixture execution was performed in this chat |
| Render runtime/deploy readback | PASS as read-only correlation |
| Production deployment/provider mutation | NOT EXECUTED |

Read-only hosted-provider observations are not provider-verification PASS for local/sandbox scenarios.

## Exact execution commands

Repository contract/unit checks:

```bash
npx tsx scripts/operations/userLifecycleHarness.ts --mode=repository_contract
npx vitest run tests/unit/userLifecycleHarness.test.ts tests/unit/userLifecycleSubscriptionProjection.test.ts
```

Supabase Local/Mailpit:

```bash
SUPABASE_LOCAL_ANON_KEY='<local-only-key>' \
SUPABASE_LOCAL_SERVICE_ROLE_KEY='<local-only-key>' \
npx tsx scripts/operations/userLifecycleHarness.ts --mode=supabase_local_mailpit
```

Stripe sandbox:

```bash
OPS_USER_LIFECYCLE_ALLOW_STRIPE_SANDBOX_MUTATION=1 \
STRIPE_SECRET_KEY='<test-mode-key>' \
STRIPE_PRICE_ID_PRO_YEARLY='<test-price-id>' \
STRIPE_TEST_PAYMENT_METHOD_ID='<test-payment-method-id>' \
npx tsx scripts/operations/userLifecycleHarness.ts --mode=stripe_sandbox_test_clock
```

Provider contract:

```bash
npx vitest run tests/provider/userLifecycleProviderContract.test.ts
```

## Residual risks / findings

1. Candidate identity migration is not deployed and therefore cannot be claimed as provider-remediated state.
2. Full hosted→local Supabase schema baseline remains incomplete in repository history.
3. Annual Pro preview drift (`313.20` vs canonical `248`) remains an explicit consumer/shared projection finding.
4. Supabase leaked-password protection is disabled per Security Advisor readback.
5. Payment-failure and real provider-redelivery/duplicate-webhook sandbox evidence require dedicated Stripe fixtures/delivery tooling and remain `NOT_AVAILABLE` until actually executed.

No item is represented as Security `VERIFIED/CLOSED` or Compliance-approved.

## Stable OPS contract

The stable Frontend consumer contract is in `docs/projects/operations/work-packages/USER_LIFECYCLE_SIMULATION.md`: verified Supabase user ID + authoritative provider event + durable server projection + authenticated server readback are required for paid state; Checkout redirect, email, browser tier and cached client state are non-authoritative.

## Exit assessment

`EVIDENCE_READY` is not yet claimed. Exact-candidate validation, final current-main/open-writer correlation and the required exact Base/Head Human/Owner PR-creation gate remain outstanding; actual provider scenarios without available infrastructure stay `NOT_AVAILABLE` rather than fabricated PASS.
