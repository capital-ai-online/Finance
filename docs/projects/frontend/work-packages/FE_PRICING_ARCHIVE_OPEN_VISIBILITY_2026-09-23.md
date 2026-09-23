# FE Pricing Archive & Open Visibility — 2026-09-23

## Authority / scope

- Trust root: `/AGENTS.md@CURRENT_MAIN`
- Baseline: `main@84137c8d24507523c59cf22d6b888a24329a56e5`
- Project: `CAPITAL-AI-FE` (cross-cutting presentation)
- Owner direction: current pricing model is disabled and archived; all components are visible independent of subscription.

## Implemented presentation state

- Current pricing model state: `ARCHIVED_DISABLED`.
- Historical price table is retained only under `docs/archive/billing/PRICING_MODEL_2026-08-23.md`.
- `Abonnements` no longer renders Starter/Pro/Enterprise price cards, plan comparison, upgrade CTA, checkout start or billing-portal controls.
- The screen communicates temporary open visibility and treats the server-reported tier as account metadata only.
- Landing Newsfeed copy no longer advertises Pro/Enterprise visibility or login-as-paywall behavior.

## Boundary

This Frontend package does not:

- change Stripe products/prices/subscriptions;
- mutate Supabase subscription rows;
- disable authentication or protected execution gates;
- grant anonymous Backtest/Monte-Carlo/full-AI/Billing execution;
- alter FINTECH scoring/evidence authority.

The shared read-only News/Evidence visibility boundary is handled owner-correctly by the separate OPS package `OPS-PUBLIC-VISIBILITY-MODE-20260923`.

## Compliance handoff

Current legal/FAQ text may still contain historical tariff references. Because those pages declare `CAPITAL-AI-COMP` content ownership, this package does not silently rewrite legal meaning. A COMP-owned follow-up should reconcile visible legal pricing/subscription wording with the temporary disabled-pricing state before a future monetization launch.

## Exit evidence

- active pricing UI contains no price cards or checkout start;
- archive preserves historical values;
- no subscription tier hides Landing Newsfeed presentation;
- protected execution semantics are not changed by Frontend;
- regression test protects the archived/disabled state.
