# OPS Public Visibility Mode — 2026-09-23

## Authority / owner resolution

- Trust root: `/AGENTS.md@CURRENT_MAIN`
- Baseline: `main@84137c8d24507523c59cf22d6b888a24329a56e5`
- Primary implementation owner: `CAPITAL-AI-OPS / PVC-02` for shared controlled-implementation entitlement/runtime boundary
- FINTECH remains owner of news evidence and scoring semantics (`PVC-09..17`)
- Frontend remains presentation-only and gains no execution authority.

## Owner direction

The current pricing/tier model is temporarily disabled for product visibility. All components must be visible independent of subscription tier.

This package interprets that direction narrowly and safely:

- **visibility/read-only access** may not depend on subscription tier;
- **protected execution, quota, billing, IAM and mutation** remain governed by their existing server-side controls;
- no subscription tier is forged or rewritten;
- Stripe/Supabase/provider state is not mutated.

## Implementation

1. `PRODUCT_VISIBILITY_MODE = PUBLIC_ALL_COMPONENTS` is introduced alongside, not instead of, `canUseFeature()`.
2. `isFeaturePubliclyVisible(feature)` governs presentation/read-only visibility only.
3. The existing `/api/news` boundary allows anonymous/read-only `GET` access while retaining the old verified-identity + entitlement path for any future non-GET capability.
4. Provider evidence, freshness, heuristic sentiment and score authority are unchanged.

## Security boundary

This change deliberately does **not** make Backtest, Monte Carlo, full AI analysis, billing/checkout, PDF export or other protected execution anonymous. It removes subscription-tier visibility restrictions, not security controls.

## Exit evidence

- Anonymous GET to the existing News router passes the parent visibility boundary.
- No subscription lookup is required for read-only GET.
- Non-GET requests still require verified identity and the canonical entitlement decision.
- Provider/scoring routes are unchanged.
- Unit tests cover both public-read and protected-execution behavior.
