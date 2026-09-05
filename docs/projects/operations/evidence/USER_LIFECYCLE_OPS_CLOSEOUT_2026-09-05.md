# CAPITAL-AI-OPS — User Lifecycle Closeout Evidence 2026-09-05

**Repository:** `SvenKulessa/Finance`  
**Project:** `CAPITAL-AI-OPS`  
**Entry main:** `0c595dc4f07fc279eabec272ca6046967f3b83e8`  
**Branch:** `agent/operations-user-lifecycle-closeout-20260905`  
**Production mutation:** `NONE`  
**Release:** `NOT_AUTHORIZED`

## Verified current-state matrix

| Area | Current verified state | Result |
|---|---|---|
| Lifecycle Harness | merged on main from PR #683; repository contract/harness files present | `PASS` for presence/current-main correlation only |
| Auth lifecycle correlation | merged via PR #722; stale active claim remained after merge | `PASS` implementation / claim hygiene fixed on this branch |
| Subscription identity repository contract | migration uses `metadata.user_id`, UUID validation against `auth.users.id`, email secondary | `PASS` repository contract |
| Subscription identity deployed provider contract | hosted function still selects Auth user by Stripe customer email | `FAIL` vs repository invariant |
| Supabase migration history | remote history begins before checked-in repository migrations | `PARTIAL` / local full replay not proven |
| `public.subscriptions` RLS | enabled; own-row authenticated SELECT policy uses `auth.uid() = user_id` | `PASS` read-only provider observation |
| Supabase Local + Mailpit E2E | not executed in this surface | `NOT_AVAILABLE` |
| Cross-user denial local/provider test | not executed against reproducible local application schema | `NOT_AVAILABLE` |
| Stripe sandbox/Test Clock | no verified test-mode execution context/fixtures executed | `NOT_AVAILABLE` |
| Stripe payment failure/redelivery | no real provider execution | `NOT_AVAILABLE` |
| Annual Pro price | Owner decision/billing projection 248 EUR; entitlement preview still 313.20 EUR | `FOREIGN_OWNER_REMAINS` |
| Security | SEC evidence retains ULS-SEC-001..005 and S1-R2-05/S1-R2-06 dependencies | `SECURITY_REVERIFICATION_REQUIRED` after applicable returns |
| Supabase leaked-password protection | current Security Advisor warning remains | `PRODUCTION_GATE_REQUIRED` for any config mutation |

## Read-only Supabase evidence

Connected project: `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`).

Observed on 2026-09-05:

1. `public.sync_stripe_subscription_to_public()` is still the pre-migration definition that obtains Stripe Customer email and resolves `auth.users.id` by email before writing `public.subscriptions`.
2. `supabase_migrations.schema_migrations` reports 69 entries, with minimum version `20260709160230` and maximum version `20260901144312`.
3. Repository migration `20260901162000_user_lifecycle_subscription_identity_authority.sql` is therefore not represented in that observed remote migration-history maximum and its function contract is not deployed.
4. `public.subscriptions` RLS is enabled.
5. Policies observed: authenticated users may SELECT only where `auth.uid() = user_id`; service role has explicit full access.
6. Supabase Security Advisor reports `auth_leaked_password_protection` disabled.

These are read-only observations. No DDL, migration application, Auth configuration change, user mutation or production data mutation was performed.

## Repository/provider split

The repository migration correctly enforces the handed-off stable identity invariant. The connected Production provider does not yet match it. Consequently the correct status is:

- `Subscription Identity`: `IMPLEMENTED_NOT_DEPLOYED`;
- `Production Mutation`: `REQUIRED_SEPARATE_APPROVAL`;
- `Security`: `SECURITY_REVERIFICATION_REQUIRED` after deployment and exact post-change evidence.

## Supabase baseline reproducibility evidence

The remote minimum migration version predates the oldest checked-in migration (`20260711000000_iam.sql`). This proves a historical repository/provider migration-history gap remains.

Current Supabase documentation for an existing linked project supports `migration list` for divergence inspection, `db pull` to capture remote schema changes/history into migrations, `db reset` for local replay verification, and `migration repair` only for known incorrect history records. No incomplete hand-written baseline is justified.

No Docker/Supabase Local execution was available through this connector session, so `supabase db reset`, Mailpit, own-row and cross-user denial E2E are `NOT_AVAILABLE` rather than PASS.

## Provider evidence truth table

| Evidence | Result |
|---|---|
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

- Human/Owner decision recorded by GOV-ULS-DEC-001: `248 EUR` annual Pro catalog expectation; no Production Stripe mutation authorized.
- `src/features/billing/billingContract.ts`: Pro yearly `248`.
- Accepted ADR-0034 / `src/config/subscriptionEntitlements.ts`: generic Pro annual 10% preview remains `313.20`.
- current code search: `getAnnualPricePreviewEur` is used by its tests and the OPS harness, with no separate productive consumer call site found.

OPS does not resolve this by changing foreign shared product/entitlement code.

## Security disposition

OPS evidence only:

- ULS-SEC-001 -> `PRODUCTION_GATE_REQUIRED`;
- ULS-SEC-002 -> `PROVIDER_EVIDENCE_NOT_AVAILABLE`;
- ULS-SEC-003 / S1-R2-06 -> `FOREIGN_OWNER_REMAINS` for target capability children plus SEC verification;
- ULS-SEC-004 -> explicit provider/JWT residual risk;
- ULS-SEC-005 -> provider config warning; separate mutation approval required;
- S1-R2-05 -> separate OPS-owned remediation package remains open.

CAPITAL-AI-SEC remains the only Security verification/closure authority.

## Validation actually performed

- current `/AGENTS.md` read completely from main: `PASS`;
- current main SHA resolved: `PASS`;
- open PR inventory checked: one open PR (#726), no OPS lifecycle changed-file overlap;
- stale writer claim correlated to merged PR #722 and absent branch: `PASS` correlation;
- relevant OPS roadmap/work packages and lifecycle files inspected: `PASS`;
- repository subscription migration inspected: `PASS`;
- connected Supabase function inspected read-only: `PASS` observation, provider contract mismatch found;
- remote migration-history bounds inspected read-only: `PASS` observation;
- subscriptions RLS/policies inspected read-only: `PASS` observation;
- Supabase Security Advisor inspected: `PASS` observation, warning remains;
- Annual Pro source correlation inspected: `PASS` correlation; drift remains;
- `npm run lint`: `NOT RUN` — no repository checkout execution surface;
- targeted Vitest: `NOT RUN` — no repository checkout execution surface;
- `npm run build`: `NOT RUN` — no repository checkout execution surface;
- `npm run predeploy:check`: `NOT RUN` — no Runtime/Release mutation in this package;
- Supabase Local/Mailpit provider tests: `NOT_AVAILABLE`;
- Stripe sandbox/Test Clock provider tests: `NOT_AVAILABLE`.

No non-executed check is represented as PASS.
