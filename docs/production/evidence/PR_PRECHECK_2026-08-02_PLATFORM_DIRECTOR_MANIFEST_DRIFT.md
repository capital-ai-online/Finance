# PRE-PR Production Snapshot — PlatformDirector Manifest Drift

**Date:** 2026-08-02
**Scope:** Baseline integrity fix required after concurrent PlatformDirector code landed on `main`.
**Main SHA:** `07926dc021a1f3155de881014fbb6fe99eba2f47`

## Production-connected state

- Supabase Security Advisor: unchanged known state — `rls_enabled_no_policy` INFO for `public.screening_slo_evidence` and `auth_leaked_password_protection` WARN under the accepted Free-tier exception.
- Stripe live recurring EUR prices observed: Starter 7.00/month, Starter 75.60/year, Pro 29.00/month, Pro 248.00/year, Enterprise 109.00/month. The Pro annual pricing discrepancy remains unresolved under ADR-0017/ADR-0034 and is outside this PR.
- Custom-domain HTTP smoke check: `UNVERIFIABLE_FROM_RUNNER` because the execution runner could not resolve `capital-ai.online`; this is not classified as a production outage.

## Repository drift

Commit `cd5c93137074dc7f8a8ba562aff09ea7f54f6a70` added `src/platform/PlatformDirector/Contracts/PlatformDecision.ts`, while `src/platform/PlatformDirector/manifest.json` and README still claim the component has no code and is `unspecified`.

The combined PR #65 CI therefore fails `tests/unit/platformManifestIntegrity.test.ts` before reaching build/readiness gates.

## Decision

Create a narrow baseline PR that synchronizes PlatformDirector metadata with the code actually present. Do not merge automatically. ADR-0006 remains active because only the decision contract exists; runtime orchestration/decision execution is not complete.
