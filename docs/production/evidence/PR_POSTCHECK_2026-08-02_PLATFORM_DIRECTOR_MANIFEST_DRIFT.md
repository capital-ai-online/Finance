# POST-PR Production Snapshot — PlatformDirector Manifest Drift

**Date:** 2026-08-02
**PR:** #67
**PR head before this evidence commit:** `0d5ba814681ebdaf7bd507633a9497d33e82d821`
**Main SHA after PR creation:** `07926dc021a1f3155de881014fbb6fe99eba2f47`

## Drift check

- `main` did not advance between PRE-PR and POST-PR snapshots.
- No new production merge was observed during this PR creation window.
- PR #67 therefore still targets the same production repository baseline that was inspected before branch creation.

## Production-connected state

- Supabase Security Advisor remains unchanged:
  - INFO `rls_enabled_no_policy` for `public.screening_slo_evidence` — intentional fail-closed table state.
  - WARN `auth_leaked_password_protection` — accepted Free-tier plan constraint under ADR-0031.
- Stripe live recurring EUR prices remain unchanged:
  - Starter: EUR 7.00/month and EUR 75.60/year.
  - Pro: EUR 29.00/month and EUR 248.00/year.
  - Enterprise: EUR 109.00/month.
  - The Pro annual pricing discrepancy remains unresolved and outside PR #67.
- Custom-domain HTTP smoke recheck remains `UNVERIFIABLE_FROM_RUNNER`: DNS resolution of `capital-ai.online` failed from the execution runner with HTTP status 000. This is not classified as a production outage.

## CI state

GitHub CI for PR #67 was in progress when this POST snapshot was recorded. The PR must not be considered merge-ready until the complete pipeline passes on the final PR head.

## Merge policy

No automatic merge. Human review and manual merge only.
