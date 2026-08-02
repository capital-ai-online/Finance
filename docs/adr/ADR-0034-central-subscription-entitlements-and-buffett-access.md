# ADR-0034 — Central Subscription Entitlements and Warren Buffett Access

## Status

**Accepted**

## Implementation-Status

🟡 **IN PROGRESS** — canonical entitlement contract, server-side quota engine, Buffett authorization API and repository migration are implemented on the feature branch. UI migration and verified-score route adoption remain separate follow-up PRs. The Supabase migration is intentionally **not** applied live by this PR.

## Date

2026-08-03

## Context

Subscription behavior had drifted across `Abonnements.tsx`, `SubscriptionModal.tsx`, client-side screening trackers and server-side quota code. The Warren Buffett Value Check was particularly inconsistent: one UI described it as Starter-accessible, another comparison table described it as Enterprise-only, while the component itself performed no authoritative server-side entitlement check.

The recently added evidence-backed index, commodity and sovereign-benchmark scoring paths also need the same subscription contract as the existing screening lifecycle rather than independent feature-specific assumptions.

## Decision

Capital-AI introduces `subscription-entitlements/1.0.0` in `src/config/subscriptionEntitlements.ts` as the canonical code-level contract for feature access and usage windows.

### Canonical plan matrix

| Capability | Free | Starter | Pro | Enterprise |
|---|---|---|---|---|
| Monthly price | €0 | €7 | €29 | €109 |
| Devices | 1 | 2 | 2 | 5 |
| Verified screening | 3 / rolling 5 days | 5 / rolling day | 20 / rolling day | Unlimited |
| Backtest | No | No | Yes | Yes |
| Monte Carlo | No | No | 1 / rolling day | Unlimited |
| Full AI analysis | Preview only | 1 / rolling day | Unlimited | Unlimited |
| Realtime AI Newsfeed | No | No | Yes | Yes |
| Warren Buffett Value Check | 1 asset / rolling 3 days | 1 asset / rolling 3 days | Full | Full |
| PDF / Compliance export | No | No | No | Yes |
| Annual self-service | n/a | 10% discount | 10% discount | On request |

Guest users are not a paid subscription tier. They may use only explicitly guest-enabled surfaces. **Warren Buffett Value Check is denied to guests.**

### Warren Buffett semantics

“Available from Pro” means **full access** starts at Pro. Free and Starter retain a deliberately constrained sampling entitlement: one distinct asset per rolling three-day window. Reopening the same already-authorized asset within the active window does not consume another quota unit.

The authorization path is server-side:

`POST /api/entitlements/warren-buffett/authorize`

The endpoint requires a verified identity, resolves the persisted subscription tier server-side, validates the asset against the asset catalog and consumes the entitlement quota. Client-side visibility must never be treated as authorization.

### Persistent quota contract

`public.user_quota` is extended with `buffett_value_check` and `subject_key`. `public.consume_user_quota(...)` performs atomic quota consumption under an advisory transaction lock. It is `SECURITY INVOKER` with `search_path = ''` and fully schema-qualified relation access.

The repository migration is:

`supabase/migrations/20260802203000_extend_user_quota_entitlement_kinds.sql`

Production application belongs to the controlled Supabase production handoff. This ADR does not authorize ad-hoc live DDL from the development workflow.

### Fail-closed fallback

If the production quota RPC is temporarily unavailable, the backend falls back to the existing process-local rate limiter rather than failing open. This preserves the entitlement boundary while the deployment/migration state is being reconciled.

## New component integration

The evidence-backed index, commodity and sovereign-benchmark scoring paths are screening capabilities and must consume the canonical `verified_screening` entitlement. A follow-up PR will add the shared gate to the verified-score/context/batch routes so the new provider/evidence architecture cannot bypass subscription limits.

## Stripe consistency finding

The code contract continues the product rule “Starter and Pro annual self-service = 10% discount.” The live Stripe configuration observed during the ADR review is not fully consistent with that rule:

- Starter: €7/month → €75.60/year, consistent with 10% discount.
- Pro: €29/month → expected €313.20/year at 10%, while the currently active Stripe yearly price observed was €248/year.

No Stripe price is mutated by this ADR/PR. Billing-price correction requires an explicit production billing decision and controlled Stripe change.

## Consequences

### Positive

- One code-level source of truth for plan entitlements.
- Guest Buffett access is fail-closed.
- Free/Starter Buffett sampling is enforceable server-side and device-independent after migration.
- Pro/Enterprise full Buffett access is explicit rather than inferred from UI text.
- New evidence-scoring components receive a defined subscription integration target.
- Annual pricing drift becomes observable instead of silently encoded in multiple UI calculations.

### Remaining work

1. Migrate `Abonnements.tsx` and `SubscriptionModal.tsx` to the canonical plan contract.
2. Update `BuffetValueCheck.tsx` to request server authorization before showing/switching evaluated assets.
3. Apply canonical screening gates to verified-score/context/batch endpoints for index, commodity and sovereign bond evidence scoring.
4. Migrate remaining feature-specific subscription checks to `canUseFeature()` / `getWindowedFeatureLimit()`.
5. During production handoff, apply the Supabase migration and validate Security Advisor/RLS behavior.
6. Resolve the live Stripe Pro yearly-price discrepancy through the billing lifecycle; do not silently change billing objects from application code.

## Acceptance

ADR-0034 may move to `resolved/` only when:

- backend tests for the plan matrix and rolling windows pass;
- Buffett UI consumes the authorization API;
- verified-score routes use the canonical screening entitlement;
- duplicated plan matrices are removed or reduced to presentation-only mappings from the canonical contract;
- the production Supabase migration is applied and verified;
- the Stripe annual-price decision is explicitly closed or documented as an accepted commercial exception.
