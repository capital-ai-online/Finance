# PRE-PR Production Snapshot — Subscription Entitlements Live Refresh

**Date:** 2026-08-03
**Scope:** Recreate the subscription-entitlements / Warren Buffett gating work on the latest production repository baseline after concurrent merges.
**Main SHA:** `afb25a0116beb867b9de37058f76aad3d7291187`
**Platform version:** `0.6.0`

## Live repository baseline

- PR #68 is merged on `main` and combines the GA4/CookieHub integration with the PlatformDirector manifest correction.
- The drift between the previous entitlement PR base (`07926dc...`) and current `main` affects only analytics/CookieHub/PlatformDirector files; no entitlement-scope file overlaps were observed.
- This branch was therefore created directly from `afb25a0116beb867b9de37058f76aad3d7291187` rather than reusing the older branch base.

## HTTP production smoke

- `https://capital-ai.online` and `/healthz` are `UNVERIFIABLE_FROM_RUNNER` in this execution environment because DNS resolution for `capital-ai.online` failed.
- This is an execution-runner limitation and is **not** classified as a production outage.

## Supabase live security state

Project: `ryzywoktpmyhwzxmstyu`

Known advisor state remains unchanged:

1. INFO `rls_enabled_no_policy` on `public.screening_slo_evidence` — intentional server-only/fail-closed table state.
2. WARN `auth_leaked_password_protection` — accepted Free-tier constraint under ADR-0031 until plan upgrade.

No Supabase DDL/DML is executed by this PR. The new quota migration remains repository-only for controlled production handoff.

## Stripe live recurring prices

Observed active live prices immediately before PR creation:

- Starter monthly: EUR 7.00 — `price_1TnEUEPKr4joNbEctWTgogW6`
- Starter yearly: EUR 75.60 — `price_1TpDDNPKr4joNbEcGm7ngSmp`
- Pro monthly: EUR 29.00 — `price_1TpDOhPKr4joNbEc50cS0PKr`
- Pro yearly: EUR 248.00 — `price_1TpDVYPKr4joNbEck8SdA1sK`
- Enterprise monthly: EUR 109.00 — `price_1Tl6GnPKr4joNbEckzqM3SoC`
- Enterprise yearly: EUR 1,280.00 — `price_1TpDZ1PKr4joNbEckxXITdTc`

The existing Pro yearly pricing discrepancy remains unresolved: 10% off EUR 29/month would be EUR 313.20/year, not EUR 248.00. This PR does not mutate Stripe.

## Decision

Proceed with a fresh PR from the current production repository baseline implementing only the canonical subscription entitlement contract, server-side quota enforcement, Buffett authorization API, tests, ADR, and repository migration. Manual merge only.
