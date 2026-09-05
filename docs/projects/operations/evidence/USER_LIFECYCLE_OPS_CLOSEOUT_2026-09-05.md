# CAPITAL-AI-OPS — User Lifecycle Closeout Evidence 2026-09-05

**Repository:** `SvenKulessa/Finance`  
**Project:** `CAPITAL-AI-OPS`  
**Current-main correlation:** `687105ffe90f649c8ada6310976826c9ea625f27`  
**Branch:** `agent/operations-user-lifecycle-closeout-20260905`  
**Production mutation by this work package:** `NONE`  
**Release:** `NOT_AUTHORIZED`

## Verified current-state matrix

| Area | Current verified state | Result |
|---|---|---|
| Lifecycle Harness | merged on main from PR #683; repository contract/harness files present | `PASS` for presence/current-main correlation |
| Auth lifecycle correlation | merged via PR #722; stale active claim remained after merge | `PASS` implementation / claim hygiene fixed on this branch |
| Subscription identity repository contract | migration uses `metadata.user_id`, UUID validation against `auth.users.id`, email secondary | `PASS` repository contract |
| Subscription identity deployed provider contract | connected Supabase function now uses the same `metadata.user_id -> auth.users.id` invariant | `PASS` read-only provider correlation |
| Supabase migration history | remote history contains `user_lifecycle_subscription_identity_authority` as `20260905103413`, but remote history still begins before checked-in repository migrations | `PARTIAL` / identity migration present; full clean local replay still not proven |
| `public.subscriptions` RLS | enabled; own-row authenticated SELECT policy uses `auth.uid() = user_id` | `PASS` read-only provider observation |
| Supabase Local + Mailpit E2E | not executed in this surface | `NOT_AVAILABLE` |
| Cross-user denial local/provider test | not executed against reproducible local application schema | `NOT_AVAILABLE` |
| Stripe sandbox/Test Clock | no verified test-mode execution context/fixtures executed | `NOT_AVAILABLE` |
| Stripe payment failure/redelivery | no real provider execution | `NOT_AVAILABLE` |
| Annual Pro price | Owner decision/billing projection 248 EUR; entitlement preview still 313.20 EUR | `FOREIGN_OWNER_REMAINS` |
| Security | SEC evidence retains independent verification ownership and residual provider/capability findings | `SECURITY_REVERIFICATION_REQUIRED` after applicable returns |
| Supabase leaked-password protection | current Security Advisor warning remains | `PRODUCTION_GATE_REQUIRED` for any config mutation |

## Read-only Supabase evidence

Connected project: `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`).

Observed again on 2026-09-05 after synchronization with current `main`:

1. `public.sync_stripe_subscription_to_public()` reads `NEW.metadata->>'user_id'`, rejects missing/malformed UUID values, validates the UUID against `auth.users.id`, and only then reads email as secondary descriptive data.
2. The function upserts `public.subscriptions` by verified `user_id`; it no longer resolves entitlement ownership by Stripe Customer email.
3. `supabase_migrations.schema_migrations` reports 70 entries, with minimum version `20260709160230` and maximum version `20260905103413`.
4. The newest remote record is named `user_lifecycle_subscription_identity_authority`, so the intended identity migration is represented in provider migration history. Its remote timestamp differs from the checked-in filename `20260901162000_user_lifecycle_subscription_identity_authority.sql`; this is correlation evidence, not permission to rewrite history.
5. `public.subscriptions` RLS is enabled.
6. Policies observed: authenticated users may SELECT only where `(select auth.uid()) = user_id`; service role has explicit full access.
7. Supabase Security Advisor still reports `auth_leaked_password_protection` disabled.

These are read-only observations. No DDL, migration application, Auth configuration change, user mutation or production data mutation was performed by this work package.

## Repository/provider split

The repository and connected provider now agree on the stable subscription identity invariant:

`verified Supabase Auth user ID -> Stripe subscription metadata.user_id -> validated auth.users.id -> public.subscriptions.user_id`

Consequently:

- `Subscription Identity`: `PROVIDER_CORRELATED_PASS` for the observed function contract;
- `Production Mutation by this package`: `NONE_REQUIRED_FOR_IDENTITY_ALIGNMENT`;
- `Security`: remains `SECURITY_REVERIFICATION_REQUIRED`; OPS read-only provider evidence cannot self-close Security findings.

## Supabase baseline reproducibility evidence

The remote minimum migration version (`20260709160230`) still predates the oldest checked-in repository migration (`20260711000000_iam.sql`). A historical repository/provider migration-history gap therefore remains even though the User Lifecycle identity migration itself is now present remotely.

A clean application-schema `supabase db reset` cannot yet be claimed reproducible from repository history alone. A later isolated baseline-import/correlation package must preserve real history and validate replay; no synthetic baseline or `migration repair` is justified merely to hide the gap.

No Docker/Supabase Local execution is available through this connector session, so `supabase db reset`, Mailpit, own-row and cross-user denial E2E remain `NOT_AVAILABLE` rather than PASS.

## Provider evidence truth table

| Evidence | Result |
|---|---|
| Deployed subscription identity function contract | `PASS` — read-only provider correlation |
| Registration | `NOT_AVAILABLE` |
| Session creation | `NOT_AVAILABLE` |
| Multiple sessions/devices | `NOT_AVAILABLE` |
| Local logout | `NOT_AVAILABLE` |
| Global logout | `NOT_AVAILABLE` |
| Refresh/session invalidation | `NOT_AVAILABLE` |
| Mailpit delivery | `NOT_AVAILABLE` |
| Own-row RLS E2E | `NOT_AVAILABLE` |
| Cross-user denial E2E | `NOT_AVAILABLE` |
| Annual Pro Stripe sandbox subscription | `NOT_AVAILABLE` |
| Checkout -> webhook -> projection provider E2E | `NOT_AVAILABLE` |
| Renewal | `NOT_AVAILABLE` |
| Cancel at period end | `NOT_AVAILABLE` |
| Expiry | `NOT_AVAILABLE` |
| Reactivation | `NOT_AVAILABLE` |
| Payment failure | `NOT_AVAILABLE` |
| True Stripe duplicate/redelivery | `NOT_AVAILABLE` |

## Annual price evidence

- Human/Owner decision recorded by `GOV-ULS-DEC-001`: `248 EUR` annual Pro catalog expectation; no Production Stripe mutation authorized.
- `src/features/billing/billingContract.ts`: Pro yearly `248`.
- Accepted ADR-0034 / `src/config/subscriptionEntitlements.ts`: generic Pro annual 10% preview remains `313.20`.
- Current repository correlation finds no separate productive consumer that makes this stale preview an OPS runtime authority.

OPS does not resolve this by changing foreign shared product/entitlement code.

## Security disposition

OPS evidence only:

- subscription identity provider contract -> `OPS_PROVIDER_EVIDENCE_READY`; independent Security verification remains required;
- provider lifecycle scenarios beyond the read-only function/RLS inspection -> `PROVIDER_EVIDENCE_NOT_AVAILABLE`;
- S1-R2-06 target capability children -> `FOREIGN_OWNER_REMAINS` plus Security verification;
- provider/JWT residual logout window -> explicit residual, not silently closed;
- leaked-password protection -> provider config warning; separate protected mutation approval required;
- S1-R2-05 Stripe redirect boundary -> separate OPS-owned Security remediation package, not part of this User Lifecycle closeout.

CAPITAL-AI-SEC remains the only Security verification/closure authority.

## Validation actually performed

- current `/AGENTS.md` read from `main`: `PASS`;
- current main SHA resolved as `687105ffe90f649c8ada6310976826c9ea625f27`: `PASS`;
- branch synchronized to current main with merge-base exactly current main: `PASS`;
- open PR inventory checked: PR #728 is FINTECH/Equity and has no User Lifecycle OPS changed-file/semantic overlap: `PASS`;
- relevant OPS roadmap/work packages and lifecycle files inspected: `PASS`;
- repository subscription migration inspected: `PASS`;
- connected Supabase function inspected read-only: `PASS` observation; stable-user-ID contract is deployed;
- remote migration-history bounds/name inspected read-only: `PASS` observation; historical baseline gap remains;
- subscriptions RLS/policies inspected read-only: `PASS` observation;
- Supabase Security Advisor inspected: `PASS` observation; leaked-password warning remains;
- Annual Pro source correlation inspected: `PASS` correlation; foreign drift remains;
- previous hosted `build-and-test` for PR #729 head `4510fa06d768474196e08324629b2031079aaea8`: `PASS`; exact final-head CI must rerun after synchronization/document updates;
- previous PR Governance check: `FAIL` because PR metadata/body was non-conforming; this PR is corrected separately and exact-head governance must rerun;
- Supabase Local/Mailpit provider tests: `NOT_AVAILABLE`;
- Stripe sandbox/Test Clock provider tests: `NOT_AVAILABLE`.

No non-executed check is represented as PASS.
