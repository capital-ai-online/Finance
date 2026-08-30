# S1-R2-00 — Entitlement Authority Trace

Status: **CANDIDATE / NOT AUTHORITY — PR VERIFY PENDING**  
Evidence date: 2026-08-30  
Source baseline: `main@e311c30d18951785a68154d994a403799819c194`  
Supabase project: `AIFINANCIAL` / `ryzywoktpmyhwzxmstyu`  
Scope: production-reachable subscription/tier authority, browser simulation reachability, server entitlement decisions and Stripe→Supabase persistence.

## 1. Question and classification rule

S1-R2-00 asks whether a browser-controlled or simulated subscription tier can become authority for protected server capability.

The finding may close as `NOT AUTHORITY` only if all of the following are true:

1. browser simulation cannot persist or confer production entitlement;
2. authenticated tier projection is read from server state bound to the verified principal;
3. protected API decisions derive tier from verified server identity plus server-owned subscription state;
4. the production subscription store cannot be written by normal browser roles;
5. Stripe-verifiable provider state is the production source for subscription changes;
6. no production source call site invokes the privileged direct tier writer with browser-controlled tier input.

If any item fails, R2-00 becomes `CONFIRMED AUTHORITY GAP` and R2-06 activates.

## 2. Browser and UI reachability

`src/components/Checkout.tsx` contains a simulated-success path for local development. Its activation requires `import.meta.env.DEV === true`. Missing or placeholder Stripe configuration in Production sets `demoMode` false and denies checkout. The simulated callback only updates client/UI state through `onSuccess(planId)`; it does not call a subscription persistence endpoint.

`src/app/auth/SessionComposition.tsx` does not trust cached/browser tier as server authority. After a valid Supabase session and AAL/onboarding gates, it requests `/api/stripe/user-subscription` with the session bearer token. Failure resolves the UI projection to `Free`.

The query parameter currently included by the client is non-authoritative compatibility noise: the server endpoint ignores it and derives the subject exclusively from `resolveVerifiedIdentity(req)`.

## 3. Server entitlement decision points

### Warren Buffett Value Check

`server/entitlements.ts` routes authorization through `enforceBuffettValueCheckQuota()`.

`server/quota.ts` resolves the verified identity, obtains `getSubscription(identity.userId)`, normalizes that server value, and derives the applicable quota from `src/config/subscriptionEntitlements.ts`. Guest Buffett access is denied.

### Verified screening quota

`enforceScreeningQuota()` uses the same identity→server-subscription chain for authenticated users. Missing identity uses the bounded guest/free path and cannot create a paid entitlement.

### PDF credits / Enterprise bypass

`server/stripe.ts` protects `/pdf-credits` and `/consume-pdf-credit` with `resolveVerifiedIdentity(req)`, then reads the tier through `getSubscription(identity.userId)`. The Enterprise unlimited decision therefore does not consume a browser-provided tier.

### Subscription projection endpoint

`GET /api/stripe/user-subscription` requires a verified identity and returns `getSubscription(identity.userId)`. Request query/body user identifiers do not select the account.

## 4. Checkout identity and price binding

`POST /api/stripe/create-checkout-session` does not accept a client `userId` as authority. If a verified session exists, metadata user identity is taken from `resolveVerifiedIdentity(req)`; guest metadata leaves `user_id` empty for later provider-side correlation.

Client `planId` is treated as a selection request, not entitlement proof. The server converts it to an allowlisted plan discriminator and selects the Stripe Price ID from server environment configuration. No Price ID is accepted from the request body. Unknown/unconfigured plans fail before Stripe Checkout creation.

Subscription metadata is created only by the server as part of that validated Checkout session. Trial coupons additionally bind the expected Stripe Price ID and fail on mismatch.

## 5. Express webhook is not subscription authority

The Express Stripe webhook no longer writes subscription tiers. `checkout.session.completed` performs only application side effects such as PDF-credit grants and confirmation mail. `customer.subscription.updated` and `customer.subscription.deleted` are intentionally not used to call `saveSubscription()`.

The production subscription mutation path documented and implemented by the application is the Supabase Stripe synchronization path into `stripe.subscriptions`, followed by the database trigger `sync_stripe_subscription_to_public()`.

## 6. Live Supabase readback

Read-only database inspection was performed on project `ryzywoktpmyhwzxmstyu` on 2026-08-30.

### `public.subscriptions`

- Row Level Security is enabled.
- `authenticated` has only the policy **Users can read own subscriptions** with predicate `auth.uid() = user_id`.
- No authenticated/anon INSERT, UPDATE or DELETE RLS policy exists.
- `service_role` has the explicit full-access policy used for privileged backend/provider synchronization.

Although table-level grants exist for API roles, RLS prevents ordinary browser roles from turning those grants into subscription writes.

### `stripe.subscriptions`

The Stripe schema subscription table is not granted to `anon` or `authenticated`. Browser credentials therefore cannot forge the provider synchronization source.

### Stripe→public trigger

An enabled trigger on `stripe.subscriptions` executes `public.sync_stripe_subscription_to_public()` for provider synchronization changes.

The function is `SECURITY DEFINER`, owned by the database administrative role, and:

1. resolves Stripe customer email from provider-synchronized data;
2. resolves the corresponding `auth.users.id`;
3. uses server-generated `metadata.plan_id` when present, otherwise a fixed known-Price-ID mapping;
4. refuses to guess a tier for an unknown Price ID;
5. demotes non-`active`/non-`trialing` subscriptions to `Free`;
6. upserts the resulting state to `public.subscriptions` by `user_id`.

No browser role is in this write path.

## 7. Privileged direct writer reachability

`server/db.ts` still contains the backend helper `saveSubscription(userId, tier, email)` for historical/development compatibility. It uses privileged credentials in Production and would therefore be a second authority if a production request path called it with attacker-controlled tier input.

Repository-wide production-source inspection found no call site outside the function definition. `server/stripe.ts` no longer imports or calls it. The R2-00 regression test recursively scans `server/**` and `src/**` and fails if another production call site is introduced.

This classifies the helper as **dormant / not production-reachable**, not as an entitlement authority.

## 8. Negative evidence / abuse cases

| Abuse case | Result |
|---|---|
| Production browser enters checkout demo mode because Stripe config is absent | DENY — Production fails closed |
| Browser invokes simulated success and thereby persists Pro/Enterprise | DENY — simulation is DEV-only and UI-local |
| Browser supplies another user ID to subscription read endpoint | DENY — verified bearer principal selects user |
| Browser supplies `tier=Enterprise` to quota endpoint | DENY — quota reads `getSubscription(identity.userId)` |
| Browser writes `public.subscriptions` through normal Supabase client | DENY — RLS has no browser write policy |
| Browser writes `stripe.subscriptions` | DENY — no anon/authenticated table access |
| Unknown Stripe price silently becomes paid tier | DENY — trigger has no guessed paid fallback |
| Express webhook independently mutates subscription tier | DENY — tier persistence removed from Express webhook |
| New production code calls privileged `saveSubscription()` | CI DENY — R2-00 regression contract fails |

## 9. Classification

**R2-00 classification: `NOT AUTHORITY`**, subject to exact-head PR CI and Human merge of the evidence/regression contract.

The browser `subscriptionTier`, Checkout `onSuccess()` simulation and client plan selection are presentation/request state. They do not constitute protected server entitlement authority. Protected decisions resolve a verified principal and read server-side subscription state whose production mutation chain is Stripe-verifiable provider synchronization into Supabase.

## 10. R2-06 disposition

Because R2-00 does **not** establish a browser-to-server entitlement authority gap, **R2-06 is not activated**.

R2-06 must reopen immediately if a future change makes any of the following production-reachable:

- client-selected tier written through a privileged backend API;
- subscription writes by `anon`/`authenticated` roles;
- protected capability gated only by browser/session projection rather than verified server state;
- a second subscription mutation path that is not derived from Stripe-verifiable provider state.

## 11. Verification gate

Before this evidence is promoted from candidate to final roadmap closure:

- `tests/unit/s1R2EntitlementAuthority.test.ts` must PASS on the exact PR head;
- normal Governance/Security and `build-and-test` must PASS;
- the branch must remain correlated with current `main` and parallel PR scope;
- Human/CODEOWNER merge remains required.

No Supabase, Stripe or GitHub provider mutation is authorized or required by this R2-00 trace.
