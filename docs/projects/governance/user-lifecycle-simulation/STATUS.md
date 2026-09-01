# CAPITAL-AI-GOV — User-Lifecycle-Simulation Status

**Prompt:** `CAPITAL-AI-USER-LIFECYCLE-SIMULATION-2026-09-01`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary stage:** `PVC-05`  
**Current correlation baseline:** `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`  
**Bootstrap baseline:** `main@37bf7d954363d99d67083edbf520bd77892888dd`  
**Bootstrap PR:** `#656` — merged  
**Writer-release PR:** `#661` — merged  
**Recorrelation PR:** `#675` — merged  
**Current branch:** `agent/governance-user-lifecycle-decisions-20260901`  
**Status:** `OWNER_DECISIONS_RECORDED_IN_CANDIDATE / OPS_HANDOFF_NEXT`

## Scope boundary

This candidate is Governance coordination only. It records the two explicit Owner decisions, releases the fulfilled PR #675 writer and updates the owner/PR sequence. It does not implement Frontend, Billing, Auth, Stripe, Supabase, Mail, Security or Compliance product logic and does not claim independent Security/Compliance verification.

No deployment, production mutation, live Stripe payment, production Supabase migration, production SMTP/Google-OAuth change or Stripe `automatic_tax` activation is authorized.

## Current correlation

- Current project resolution is `CAPITAL-AI-GOV / governance / PVC-05`.
- The historical SHA `d1a69971b3332bfec487b86c6ac210c973034d32` remains evidence only, not current authority.
- PR #656 merged the six non-authorizing Governance bootstrap artifacts.
- PR #661 released the correlated stale OPS, FE and COMP writer records. On current main, the relevant claims are `released/non-exclusive`.
- PR #675 merged the owner-sequence recorrelation at `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`; this candidate atomically releases its fulfilled writer.
- PR #669 is the only open pull request at this snapshot. It changes only `.ai/work-claims/CAPITAL-AI-GOV-PVC-CONSISTENCY-CHECK-2026-09-01.json` and has no file or semantic overlap with this decision candidate.
- No owner-specific User-Lifecycle implementation branch or PR exists.
- The Human/Owner decision source is the current chat; the repository documents remain non-authorizing projections and perform no live provider mutation.

## Decision gates

| Decision | State | Effect |
|---|---|---|
| `GOV-ULS-DEC-001` Pro annual price | `DECIDED` — `248 EUR` current catalog | Price gate clears after decision-projection merge; no Stripe migration authorized |
| `GOV-ULS-DEC-002` Logout semantics | `DECIDED` — local + global, local default | Logout gate clears after decision-projection merge; global remains explicit/confirmed |
| `GOV-ULS-DEC-003` Stripe payment methods | `DEFAULT_FOR_SIMULATION` | Card-only; no production change |
| `GOV-ULS-DEC-004` Cancellation timing | `DEFAULT_FOR_SIMULATION` | Period-end; no production change |
| `GOV-ULS-DEC-005` Stripe Tax | `DECIDED` | `automatic_tax` remains disabled |

## Owner return state

| Owner | Planned return | Current state |
|---|---|---|
| `CAPITAL-AI-OPS` | lifecycle harness/provider evidence | `READY_AFTER_GOV_DECISION_PROJECTION_MERGE` |
| `CAPITAL-AI-FE` | lifecycle/pricing UI projection | `BLOCKED_BY_OPS_CONTRACT` |
| `CAPITAL-AI-SEC` | independent Security assurance | `BLOCKED_BY_OPS_FE_EVIDENCE` |
| `CAPITAL-AI-COMP` | purchase/cancellation assessment | `BLOCKED_BY_OPS_FE_EVIDENCE_AND_APPLICABILITY_REVIEW` |
| `CAPITAL-AI-GOV` | final evidence closeout | `BLOCKED_BY_OWNER_RETURNS` |

## Recorrelation exit gate

The current GOV decision candidate can become PR-ready only after:

1. PR #675 merge evidence and the atomic predecessor-writer release are represented;
2. decisions 001/002 exactly match the explicit Human/Owner selections;
3. no live Billing/Auth/provider mutation or foreign implementation is included;
4. low-cost structural validation is recorded;
5. current `main`, open PRs and work claims are correlated again;
6. the current PR template and production-baseline rendering contract are read;
7. exact Base SHA and Head SHA are reported to the Owner;
8. explicit approval for that exact PR snapshot is received.

The standing chat authorization covers preparation through step 7. Until step 8, **no pull request may be created** under the current `/AGENTS.md` rule. Human/CODEOWNER merge and protected production-mutation gates remain separate.

## Target end state

`EVIDENCE_READY_FOR_HUMAN_CLOSEOUT` remains unreachable from this recorrelation alone. It requires merged owner returns from OPS, FE, SEC and COMP, followed by a separate GOV closeout candidate that correlates their exact merged SHAs and preserves independent verification ownership.
