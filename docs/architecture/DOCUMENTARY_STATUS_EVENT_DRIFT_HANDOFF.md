# Documentary Status-Event-Drift — Handoff

**Date:** 2026-08-16  
**Authority:** ESS-0010 / ESS-0004  
**Contract:** `docs/architecture/DOCUMENTARY_STATUS_EVENT_DRIFT_CONTRACT.md`

## Delivered

| Phase | Artifact | PR |
| --- | --- | --- |
| A | Contract | #346 (merged) |
| B | Read-only detector + tests | #358 (merged) |
| C | Controlled updater + SEO_WP_S1 header hygiene + scan CLI | #364 (Draft) |

### Code

- `src/platform/Documentary/Discovery/StatusEventEvidence.ts`
- `src/platform/Documentary/Discovery/StatusEventDriftDetector.ts`
- `src/platform/Documentary/Discovery/StatusEventDriftUpdater.ts`
- `tests/unit/statusEventDriftDetector.test.ts`
- `tests/unit/statusEventDriftUpdater.test.ts`
- `scripts/automation/scanStatusEventDrift.ts` (dry-run by default)

### Operational scan

```bash
npx tsx scripts/automation/scanStatusEventDrift.ts
npx tsx scripts/automation/scanStatusEventDrift.ts --path docs/runbooks/FOO.md
# write headers only in local Draft-PR working tree:
npx tsx scripts/automation/scanStatusEventDrift.ts --apply
```

Exit code `2` when drift findings exist in dry-run (advisory signal only; not a CI gate).

## What is detected automatically

- Header class vs work-claim `applied` + `externalMutations[]`
- Header class vs completed Apply-Evidenz / Apply Evidence section
- Recommended header (`APPLIED` / `VERIFIED PASS`) when sources agree
- Merge-success as optional **trigger annotation** (not a write)

## What stays manual / Owner

- Opening and merging Draft-PRs
- Exact final wording beyond the recommended class
- Resolving conflicting evidence
- Any Supabase / Render / Stripe mutation
- Promotion of remaining open PRE_MUTATION runbooks that have **not** been applied

## Inventory (2026-08-16) — remaining PRE_MUTATION (no false upgrade)

These headers are **correctly** still PRE_MUTATION / owner-required: no applied claim with mutations and no completed Apply-Evidenz success.

| Document | Header | Detector expectation |
| --- | --- | --- |
| `docs/runbooks/GITGUARDIAN_SNYK_APP_INTEGRATION.md` | PRE-MUTATION / OWNER ACTION REQUIRED | no drift |
| `docs/runbooks/M5_SUPABASE_AGENT_AUDIT_MUTATION.md` | PRE-MUTATION / HUMAN APPROVAL REQUIRED | no drift |
| `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md` | PLANNED — NO PRODUCTION MUTATION AUTHORIZED | OTHER / no upgrade |

### Hygiene already proposed (Phase C Draft-PR #364)

| Document | Change |
| --- | --- |
| `docs/runbooks/SEO_WP_S1_LEDGER_RECONCILIATION.md` | PRE-MUTATION → **VERIFIED PASS** (Apply-Evidenz body unchanged) |

Only one work-claim with `status: "applied"` was found under `.ai/work-claims/` at inventory time: `SEO-WP-S1-FOLLOWUP-HARDENING-2026-08-15`.

## Owner next steps

1. Review and merge Draft-PR **#364** (updater + SEO_WP_S1 header + scan CLI + this handoff).
2. After merge, run `npx tsx scripts/automation/scanStatusEventDrift.ts` on `main` — expect **0 drift** for the SEO_WP_S1 path.
3. Further header hygiene: only when new Apply-Evidenz + applied claims appear; always via new Draft-PR.

## Non-goals (still out of scope)

- Second CI pipeline solely for status hygiene
- Silent write to `main`
- Auto-merge
- Rewriting historical evidence sections
