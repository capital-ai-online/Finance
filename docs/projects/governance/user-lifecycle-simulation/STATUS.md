# CAPITAL-AI-GOV — User-Lifecycle-Simulation Status

**Prompt:** `CAPITAL-AI-USER-LIFECYCLE-SIMULATION-2026-09-01`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary stage:** `PVC-05`  
**Execution baseline:** `main@85d821a58851d769fde9c95558c03d9e5608efd7`  
**Initial baseline:** `main@88286e1cfd58b314a818276b5cf61b2ff0b4128d`  
**Branch:** `agent/governance-user-lifecycle-control-20260901`  
**Status:** `GOVERNANCE_BOOTSTRAP_IN_CANDIDATE`

## Scope boundary

This candidate is Governance coordination only. It does not implement Frontend, Billing, Auth, Stripe, Supabase, Mail, Security or Compliance product logic and does not claim independent Security/Compliance verification.

No deployment, production mutation, live Stripe payment, production Supabase migration, production SMTP/Google-OAuth change or Stripe `automatic_tax` activation is authorized.

## Current correlation

- Current project resolution is `CAPITAL-AI-GOV / governance / PVC-05`.
- The historical SHA `d1a69971b3332bfec487b86c6ac210c973034d32` is evidence only, not current authority.
- PR #652 (Compliance project surface) merged while this candidate was in progress; the GOV branch was synchronized with merge commit `85d821a58851d769fde9c95558c03d9e5608efd7` before PR readiness.
- Open PRs #653 (Frontend), #654 (SEO) and #655 (Social) do not overlap the GOV bootstrap files.
- #653 remains a downstream FE prerequisite because it materializes the target project surface used by the later lifecycle owner PR.
- `CAPITAL-AI-OPS-SECURITY-HANDOFF-SYNC-2026-08-31` is active/exclusive and blocks overlapping OPS lifecycle work until OPS correlation resolves it.
- `GOVERNANCE-FRONTEND-AUTHORITY-CORRELATION-2026-08-20` is stale active writer metadata although PR #463 is merged; it does not overlap this candidate.
- The earlier SEC stale-writer statement is obsolete: the SEC handoff claim is released and Security project-surface PR #647 is merged.
- `CAPITAL-AI-COMP-PROJECT-SURFACE-2026-09-01` remains active/exclusive after merged PR #652; the Compliance project surface exists, but overlapping COMP lifecycle work stays blocked until that writer is resolved.

## Decision gates

| Decision | State | Effect |
|---|---|---|
| `GOV-ULS-DEC-001` Pro annual price | `UNRESOLVED` | FE annual Pro projection is blocked |
| `GOV-ULS-DEC-002` Logout semantics | `RECOMMENDED_PENDING_OWNER_DECISION` | FE local/global logout UX is blocked |
| `GOV-ULS-DEC-003` Stripe payment methods | `DEFAULT_FOR_SIMULATION` | Card-only; no production change |
| `GOV-ULS-DEC-004` Cancellation timing | `DEFAULT_FOR_SIMULATION` | Period-end; no production change |
| `GOV-ULS-DEC-005` Stripe Tax | `DECIDED` | `automatic_tax` remains disabled |

## Owner return state

| Owner | Planned return | Current state |
|---|---|---|
| `CAPITAL-AI-OPS` | lifecycle harness/provider evidence | `REFERRED_NOT_EXECUTED / BLOCKED_BY_CORRELATION` |
| `CAPITAL-AI-FE` | lifecycle/pricing UI projection | `REFERRED_NOT_EXECUTED / DECISION_AND_PR_PREREQUISITES` |
| `CAPITAL-AI-SEC` | independent Security assurance | `REFERRED_NOT_EXECUTED` |
| `CAPITAL-AI-COMP` | purchase/cancellation assessment | `REFERRED_NOT_EXECUTED / BLOCKED_BY_STALE_WRITER` |
| `CAPITAL-AI-GOV` | final evidence closeout | `BLOCKED_BY_OWNER_RETURNS` |

## Bootstrap exit gate

The GOV bootstrap can become PR-ready only after:

1. all six required Governance artifacts are present and structurally readable;
2. Governance roadmap/task projection is updated without foreign implementation;
3. scope-specific low-cost validation is recorded;
4. current `main`, open PRs and work claims are correlated again;
5. the current PR template and production-baseline rendering contract are read;
6. exact Base SHA and Head SHA are reported to the Owner;
7. explicit approval for that exact PR snapshot is received.

Until step 7, **no pull request may be created** under the current `/AGENTS.md` rule.

## Target end state

`EVIDENCE_READY_FOR_HUMAN_CLOSEOUT` is not reachable from this bootstrap alone. It requires merged owner returns from OPS, FE, SEC and COMP, followed by a separate GOV closeout candidate that correlates their exact merged SHAs and preserves independent verification ownership.
