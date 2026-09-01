# CAPITAL-AI-GOV — User-Lifecycle-Simulation Status

**Prompt:** `CAPITAL-AI-USER-LIFECYCLE-SIMULATION-2026-09-01`  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary stage:** `PVC-05`  
**Current correlation baseline:** `main@57a5dc6fc7ee4e66419903015b7ba1cd0e1b5065`  
**Bootstrap baseline:** `main@37bf7d954363d99d67083edbf520bd77892888dd`  
**Bootstrap PR:** `#656` — merged  
**Writer-release PR:** `#661` — merged  
**Recorrelation PR:** `#675` — merged  
**Decision PR:** `#676` — merged  
**Current branch:** `agent/governance-user-lifecycle-decision-closure-20260901`  
**Status:** `OWNER_DECISIONS_MERGED / OPS_HANDOFF_READY`

## Scope boundary

The current branch is a Governance post-merge closure only. It terminalizes the fulfilled PR #676 decision writer, converts stale `IN_CANDIDATE` projections to merged-main state, records exact PR #676 merge evidence and prepares the mandatory foreign-project handoff boundary. It does not implement Frontend, Billing, Auth, Stripe, Supabase, Mail, Security or Compliance product logic and does not claim independent Security/Compliance verification.

No deployment, production mutation, live Stripe payment, production Supabase migration, production SMTP/Google-OAuth change or Stripe `automatic_tax` activation is authorized.

## Current correlation

- Current project resolution is `CAPITAL-AI-GOV / governance / PVC-05`.
- PR #656 merged the six non-authorizing Governance bootstrap artifacts.
- PR #661 released the correlated stale OPS, FE and COMP writer records.
- PR #675 merged the owner-sequence recorrelation at `main@a90dc644fb5c8efacdf25e464f2b20c62474501f`.
- PR #676 merged the Owner decision projection with terminal head `80842461e2caf874622a6002e171b8d4abcc9110` into merge commit `57a5dc6fc7ee4e66419903015b7ba1cd0e1b5065` at `2026-09-01T13:21:15Z`.
- The PR #676 decision claim reached its declared `Human merge` release condition; this closure candidate changes it to `released/non-exclusive` and records the exact merge evidence.
- PR #669 is the only open pull request at this snapshot. It changes only `.ai/work-claims/CAPITAL-AI-GOV-PVC-CONSISTENCY-CHECK-2026-09-01.json` and has no file or semantic overlap with this User-Lifecycle closure scope.
- No owner-specific User-Lifecycle OPS implementation branch or PR was found during this correlation.
- Productive implementation remains foreign to GOV. The next Primary Owner is `CAPITAL-AI-OPS`, canonical project folder `docs/projects/operations/`, primary affected stage `PVC-02` with provider/runtime evidence also touching OPS-owned `PVC-08`.

## Decision gates

| Decision | State | Effect |
|---|---|---|
| `GOV-ULS-DEC-001` Pro annual price | `DECIDED_ON_MAIN` — `248 EUR` current catalog | Price decision merged via PR #676; no Stripe migration authorized |
| `GOV-ULS-DEC-002` Logout semantics | `DECIDED_ON_MAIN` — local + global, local default | Logout decision merged via PR #676; global remains explicit/confirmed |
| `GOV-ULS-DEC-003` Stripe payment methods | `DEFAULT_FOR_SIMULATION` | Card-only; no production change |
| `GOV-ULS-DEC-004` Cancellation timing | `DEFAULT_FOR_SIMULATION` | Period-end; no production change |
| `GOV-ULS-DEC-005` Stripe Tax | `DECIDED` | `automatic_tax` remains disabled |

## Owner return state

| Owner | Planned return | Current state |
|---|---|---|
| `CAPITAL-AI-OPS` | lifecycle harness/provider evidence | `READY_FOR_HANDOFF` |
| `CAPITAL-AI-FE` | lifecycle/pricing UI projection | `BLOCKED_BY_OPS_CONTRACT` |
| `CAPITAL-AI-SEC` | independent Security assurance | `BLOCKED_BY_OPS_FE_EVIDENCE` |
| `CAPITAL-AI-COMP` | purchase/cancellation assessment | `BLOCKED_BY_OPS_FE_EVIDENCE_AND_APPLICABILITY_REVIEW` |
| `CAPITAL-AI-GOV` | final evidence closeout | `BLOCKED_BY_OWNER_RETURNS` |

## Post-merge closure exit gate

The current GOV closure candidate is complete for PR preparation when:

1. the PR #676 decision claim is `released/non-exclusive` with exact terminal head, merge commit and merge timestamp;
2. `GOV-CHAT-038`, `GOV-CHAT-039` and `GOV-CHAT-050` are projected as `DONE_MAIN` because their substantive decision work is already merged via PR #676;
3. P7 and the PR dependency map state `DECISIONS_MERGED / OPS_HANDOFF_READY` without claiming OPS implementation;
4. Decision Register, Evidence Index and Execution Manifest carry the same PR #676 merge identity;
5. no live Billing/Auth/provider mutation or foreign implementation is included;
6. current `main`, open PRs and work claims are correlated again immediately before PR approval;
7. the exact Base SHA and closure Head SHA are reported to the Human/Owner and explicitly approved before PR creation.

This closure branch does not create a new recursive work claim solely to close the fulfilled claim. Human/CODEOWNER merge remains separate. Productive OPS execution must perform its own fresh current-main precheck and project-local branch/claim lifecycle.

## Target end state

`EVIDENCE_READY_FOR_HUMAN_CLOSEOUT` remains unreachable from the decision merge alone. The next productive stage is the owner-scoped `CAPITAL-AI-OPS / PVC-02` lifecycle harness and provider-test package. After a stable OPS return, FE may consume the test contract; SEC and COMP remain independent downstream gates before the final GOV closeout.
