# DEVELOPMENT Chain Phase Evidence Template

> Template only. Copy into the phase-specific `docs/evidence/<phase>/` directory. Never store reusable credentials, TOTP secrets/codes, recovery codes, private keys, raw bearer tokens or unredacted sensitive payloads.

## Header

- Phase:
- Roadmap Item:
- Evidence Status: `DRAFT | VERIFIED READ-ONLY | VERIFIED PASS | FAILED | ROLLED BACK`
- Date / UTC time:
- Repository: `SvenKulessa/Finance`
- Baseline branch: `main`
- Baseline SHA:
- Production baseline / target state:
- Authority refs:
- Evidence owner:

## 1. Scope

### In scope

- ...

### Explicitly out of scope

- ...

## 2. Risk / Check Classification

- PR Check Class: `D | C | R | M`
- Effective Risk: `LOW | MEDIUM | HIGH | CRITICAL`
- Mutation Class:
- Platform(s):
- Reserved Human/Owner action involved: `YES / NO`
- Kill switch / stop mechanism:

## 3. Repository Lifecycle

- Work branch:
- Branch created from SHA:
- Concurrent PR overlap result:
- Final PR number:
- Final Head SHA:
- Human file review evidence:
- Required CI run(s):
- Human merge evidence:
- Merge SHA:
- Finance remote branch deleted: `YES / NO / N/A`
- Ephemeral clone/worktree cleanup: `DONE / N/A`

## 4. Implementation Summary

- Changed components:
- Security controls changed:
- Data / runtime behavior changed:
- Documentation/contracts changed:

## 5. Tests

### Positive tests

| Test | Expected | Actual | Evidence ref | Result |
|---|---|---|---|---|
| | | | | |

### Negative / fail-closed tests

| Test | Expected DENY/failure | Actual | Evidence ref | Result |
|---|---|---|---|---|
| | | | | |

## 6. External Mutation Classification

- External mutation required: `YES / NO`
- Mutation state: `NOT REQUIRED | PLANNED | HUMAN APPROVED | MUTATED | VERIFIED PASS | FAILED / ROLLED BACK`
- Handoff Contract ID:
- Exact target resource:
- Allowed operation(s):
- Explicitly forbidden operation(s):
- Idempotency key / replay control:
- Concurrency key:
- Approval Evidence Reference:
- Approval expiry / freshness:

## 7. Pre-Mutation Verification

| Check | Baseline / Expected | Observed | Result |
|---|---|---|---|
| Correct account/project/service/environment | | | |
| Baseline / head / deployment drift | | | |
| Current platform health | | | |
| Last-known-good / backup | | | |
| Rollback executable | | | |
| No competing writer | | | |
| Mandate / approval valid | | | |

Pre-Mutation Gate: `PASS / FAILED / INCONCLUSIVE / N/A`

## 8. Authorization / Audit

- Human actor:
- Agent / executor:
- Execution host:
- REM / Policy decision reference:
- Authorization Audit Reference:
- Audit timestamp:
- Capability / risk / target binding:
- Secret redaction review: `PASS / FAIL`

## 9. Mutation Execution

- Mutation started:
- Exact semantic operation(s):
- Mutation outcome: `SUCCESS / ERROR / N/A`
- Outcome Audit Reference:
- Unexpected side effects:

Do not paste raw secrets or sensitive request/response bodies.

## 10. Post-Mutation Verification

| Check | Expected | Observed | Evidence ref | Result |
|---|---|---|---|---|
| Intended state | | | | |
| Health/readiness | | | | |
| Authorization boundary | | | | |
| Negative/deny path | | | | |
| Audit correlation | | | | |
| Drift / unexpected changes | | | | |

Post-Mutation Gate: `VERIFIED PASS / FAILED / INCONCLUSIVE / N/A`

## 11. Rollback

- Rollback trigger reached: `YES / NO`
- Procedure ref:
- Rollback action:
- Rollback verification:
- Final rollback state: `NOT REQUIRED | VERIFIED RESTORED | FAILED`

## 12. Traceability

| Requirement | Authority | Implementation / Mutation | Test | Evidence | State |
|---|---|---|---|---|---|
| | | | | | |

## 13. Residual Risk

- Open findings:
- Accepted residual risk:
- Owner acceptance ref, if required:

## 14. Final State

- Phase state:
- Mutation state:
- All required tests `VERIFIED PASS`: `YES / NO`
- Evidence complete: `YES / NO`
- Roadmap synchronized: `YES / NO`
- Traceability synchronized: `YES / NO`
- Branch lifecycle closed: `YES / NO`
- Next gate:

### Closure statement

A PR merge alone does not close the phase. Closure requires all required repository tests, external mutations, post-verification, rollback state, evidence and roadmap/traceability synchronization to be complete.