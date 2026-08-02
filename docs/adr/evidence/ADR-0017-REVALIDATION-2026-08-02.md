# ADR-0017 Revalidation Evidence — 2026-08-02

- **ADR:** ADR-0017 — Produktions-Audit-Nachbesserungen
- **Verification date:** 2026-08-02
- **Result:** `REOPEN / IN PROGRESS`
- **Reason:** Supabase and Compliance decisions remain implemented, but the Stripe decision is not fully conformant with the current production state.

## 1. Supabase revalidation — PASS

Live Supabase migration history contains the ADR-0017 migrations:

- `user_quota`
- `add_missing_service_role_rls_policies`
- `harden_handle_new_user_search_path`
- `compliance_runs`

The current Security Advisor no longer reports the RLS/search-path findings addressed by ADR-0017. Remaining findings are outside the ADR-0017 remediation scope:

1. `screening_slo_evidence` — RLS enabled with no policy, intentionally fail-closed/service-only.
2. `auth_leaked_password_protection` — unavailable on the current Supabase Free tier and governed separately by ADR-0031.

Status: `PASS`.

## 2. Compliance backend revalidation — PASS

The ADR-0012 backend is implemented and has since moved from the historical `server/compliance/*` location to:

`src/platform/Compliance/*`

The component manifest is `implemented`, the router remains admin/IAM-gated and the scanner tests are registered. ADR-0012 is separately resolved.

Status: `PASS`.

## 3. Stripe yearly-price revalidation — FAIL / CONFIGURATION DRIFT

The production Stripe account contains active live recurring prices for monthly and yearly plans.

Observed live prices:

| Plan | Monthly | Yearly | Annualized monthly | Effective yearly discount |
|---|---:|---:|---:|---:|
| Starter | EUR 7.00 | EUR 75.60 | EUR 84.00 | 10.0% |
| Pro | EUR 29.00 | EUR 248.00 | EUR 348.00 | ~28.7% |
| Enterprise | EUR 109.00 | EUR 1,280.00 | EUR 1,308.00 | ~2.1% |

ADR-0017 delegates the annual discount to separate Stripe yearly Price objects rather than server-side calculation. The Starter price satisfies the documented 10% model. The active Pro yearly price does not.

The Enterprise yearly product is also a separate live product/price. Its commercial eligibility must remain governed by the current product policy and must not be inferred merely from its existence in Stripe.

Status: `FAIL — PRICE GOVERNANCE DRIFT`.

## 4. Coupon validation revalidation — FAIL / NO-DEMO-DATA VIOLATION

`server/stripe.ts` still contains a local `demoCoupons` fallback in `/validate-coupon`, including entries such as `WELCOME10`, `SAVE50` and `FREE100`.

This is inconsistent with the production billing decision in ADR-0017:

- discounts must be represented by real Stripe objects;
- production checkout must not rely on local demo/sandbox billing data;
- coupon validation must fail closed when Stripe cannot verify the promotion/coupon.

Required remediation:

1. remove all local demo/sandbox coupon acceptance from the production route;
2. validate only active Stripe Promotion Codes/Coupons;
3. retain `couponId` solely as a server-verified Stripe identifier;
4. add regression tests proving `FREE100` or any unknown local code cannot be accepted without a real active Stripe object.

Status: `FAIL — ACTIONABLE CODE REMEDIATION`.

## 5. ADR lifecycle decision

ADR-0017 MUST remain under `docs/adr/` and its effective implementation state is now:

`🟡 IN PROGRESS — production revalidation 2026-08-02`

It may return to `✅ COMPLETE` only when:

- the live Pro yearly price matches the approved commercial policy or the policy is explicitly changed by a new decision;
- the local demo-coupon fallback is removed and regression-tested;
- the corrected Stripe Price IDs are confirmed in the production environment;
- CI and a final Stripe read-back verification pass.

This evidence record does not modify Stripe, Supabase or application runtime state.