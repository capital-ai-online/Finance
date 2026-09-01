# CAPITAL-AI-GOV — User-Lifecycle-Simulation Status

**Prompt:** `CAPITAL-AI-USER-LIFECYCLE-SIMULATION-2026-09-01`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary stage:** `PVC-05`  
**Current correlation baseline:** `main@190f319ec8026d8141601b69a8bb4d97470ec5ea`  
**Bootstrap baseline:** `main@37bf7d954363d99d67083edbf520bd77892888dd`  
**Bootstrap PR:** `#656` — merged  
**Writer-release PR:** `#661` — merged  
**Current branch:** `agent/governance-user-lifecycle-recorrelation-20260901`  
**Status:** `GOV_RECORRELATION_IN_CANDIDATE / OWNER_SEQUENCE_PENDING`

## Scope boundary

This candidate is Governance coordination only. It updates stale current-state projections after the bootstrap and writer-release merges. It does not implement Frontend, Billing, Auth, Stripe, Supabase, Mail, Security or Compliance product logic and does not claim independent Security/Compliance verification.

No deployment, production mutation, live Stripe payment, production Supabase migration, production SMTP/Google-OAuth change or Stripe `automatic_tax` activation is authorized.

## Current correlation

- Current project resolution is `CAPITAL-AI-GOV / governance / PVC-05`.
- The historical SHA `d1a69971b3332bfec487b86c6ac210c973034d32` remains evidence only, not current authority.
- PR #656 merged the six non-authorizing Governance bootstrap artifacts.
- PR #661 released the correlated stale OPS, FE and COMP writer records. On current main, the relevant claims are `released/non-exclusive`.
- PR #669 is the only open pull request at this snapshot. It changes only `.ai/work-claims/CAPITAL-AI-GOV-PVC-CONSISTENCY-CHECK-2026-09-01.json` and has no file or semantic overlap with this candidate.
- No owner-specific User-Lifecycle implementation branch or PR exists.
- The bootstrap documents still projected the pre-#661 blocker state; this candidate corrects that drift without treating historical blocker evidence as current writer authority.

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
| `CAPITAL-AI-OPS` | lifecycle harness/provider evidence | `READY_FOR_OWNER_HANDOFF` |
| `CAPITAL-AI-FE` | lifecycle/pricing UI projection | `BLOCKED_BY_DECISIONS_AND_OPS_CONTRACT` |
| `CAPITAL-AI-SEC` | independent Security assurance | `BLOCKED_BY_OPS_FE_EVIDENCE` |
| `CAPITAL-AI-COMP` | purchase/cancellation assessment | `BLOCKED_BY_OPS_FE_EVIDENCE_AND_APPLICABILITY_REVIEW` |
| `CAPITAL-AI-GOV` | final evidence closeout | `BLOCKED_BY_OWNER_RETURNS` |

## Recorrelation exit gate

The current GOV candidate can become PR-ready only after:

1. stale blocker statements are replaced by current-main release evidence;
2. bootstrap PR #656 and writer-release PR #661 are represented as merged;
3. decision gates remain unresolved unless the Human/Owner explicitly decides them;
4. no foreign implementation or independent verification is claimed;
5. low-cost structural validation is recorded;
6. current `main`, open PRs and work claims are correlated again;
7. the current PR template and production-baseline rendering contract are read;
8. exact Base SHA and Head SHA are reported to the Owner;
9. explicit approval for that exact PR snapshot is received.

Until step 9, **no pull request may be created** under the current `/AGENTS.md` rule.

## Target end state

`EVIDENCE_READY_FOR_HUMAN_CLOSEOUT` remains unreachable from this recorrelation alone. It requires merged owner returns from OPS, FE, SEC and COMP, followed by a separate GOV closeout candidate that correlates their exact merged SHAs and preserves independent verification ownership.

