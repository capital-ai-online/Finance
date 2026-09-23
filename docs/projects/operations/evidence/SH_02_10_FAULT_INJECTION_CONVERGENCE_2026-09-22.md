# SH-02.10 — Fault Injection & Convergence Evidence

**Work package:** `OPS-08-B-SH-02 / SH-02.10`  
**Project / Owner:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08`  
**Supporting PVCs:** `PVC-04`, `PVC-18`  
**Independent assurance:** `CAPITAL-AI-QM`, `CAPITAL-AI-SEC`  
**Correlation baseline:** `main@c3181b37987598511b3eb3e2d313102458fed415`  
**Branch:** `agent/operations-sh02-10-fault-convergence-v2-20260922`  
**Status:** `IMPLEMENTED_BRANCH / HOSTED_VALIDATION_PENDING / INDEPENDENT_ASSURANCE_PENDING`

## Dependency convergence

SH-02.9 functional implementation is Human-merged through PR #1262 as
`75ae1ff92e80ef68a77803d2c41ee272bc003b3b`.

The owner-correct SH-02.9 post-merge projection is also Human-merged through
PR #1271 as `886486e057fea2fe833104b23f7a36d05d0b9b58`. Its exact head
`d282aa38f7d658b2dadc3641c54415c402c03e61` completed CI, Governance,
Container Security and Project Execution Directive validation successfully.

Therefore the historical blocker "SH-02.9 post-merge projection pending" is terminal. SH-02.10 is dependency-ready for deterministic non-destructive verification. SH-02.8 remains HELD and is exercised only as a negative-control capability state; no rollback/restore activation is inferred.

## Injection boundary

SH-02.10 is deliberately non-destructive. Faults are injected only through
in-memory state, pure model inputs, mocked HTTP responses and existing test seams.

The suite does **not**:

- crash a production process;
- mutate a real provider;
- recycle a production runtime;
- trigger a Render/GitHub deployment;
- activate `REDEPLOY_EXACT_SHA`;
- perform rollback or restore;
- change credentials, IAM, Billing, DNS or data;
- enable auto-merge or self-merge.

`RUNTIME_PROCESS_RECYCLE`, `REDEPLOY_EXACT_SHA` and
`PROTECTED_ROLLBACK_RESTORE` must remain `HELD`.

## Deterministic fault matrix

| Scenario | Existing authority exercised | Required result |
|---|---|---|
| PROCESS_FATAL | process health + canonical /healthz model | unhealthy liveness; protected recycle remains held |
| PROVIDER_TRANSIENT_5XX_TIMEOUT | dependencyResilience | transient finding; no nested retry owner |
| PROVIDER_PERSISTENT_FAILURE | dependencyResilience | persistent finding; observe/escalate |
| WORKER_STALL | selfHealingContract + ADR-0054 worker contract | quarantine policy; generic quarantine action remains held |
| FRONTEND_STALE_CHUNK | frontendRecovery | exactly one automatic reload per fingerprint/session |
| FRONTEND_RENDER_FAILURE | frontendRecovery | no automatic reload |
| API_503 | frontendDegradedMode | bounded retry for safe reads only |
| API_429 | frontendDegradedMode | bounded retry for safe reads; mutation methods never auto-retried |
| DEPLOYMENT_IDENTITY_MISMATCH | selfHealingContract | exact-SHA action classified but held |
| FAILED_EXACT_SHA_REDEPLOY_VERIFICATION | convergence contract | READBACK_FAILED => ESCALATED |
| CURRENT_STATE_PROJECTION_BASELINE_STALE | Current-State Baseline Autofix + selfHealingContract | classify as repository current-state projection drift; one bounded idempotent specialist attempt; exact-head CI/Governance readback required |
| POLICY_CAPABILITY_BLOCKED | eligibility contract | missing external capability => fail-closed BLOCKED |
| RECOVERY_BUDGET_EXHAUSTION | eligibility contract | no further attempt admitted |

The canonical matrix is implemented in
`src/platform/Supervisor/faultInjectionConvergence.ts` and exercised by
`tests/unit/faultInjectionConvergence.test.ts`.

## Observed #1289 baseline-drift case

CI run `35724329044` observed
`CURRENT_STATE_PROJECTION_BASELINE_STALE` for
`docs/projects/operations/ROADMAP.md`: branch projection
`main@d5829ff2fd40228cc938d07638563f56e178dfa6` did not match
`CURRENT_MAIN c3181b37987598511b3eb3e2d313102458fed415`.

The repair is the existing bounded path, not a new writer:
`REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION`.
The action remains SH-1, idempotent, maximum one attempt, capability-bound to
`repository.pr.autofix`, and requires
`exact-pr-head-ci-governance-readback`. The Supervisor Control Panel exposes
this coverage read-only; it cannot commit, merge, alter required checks, or
grant the autofix capability.

## Assurance boundary

OPS may produce reproducible implementation/test evidence. It may not issue
independent `QM=VERIFIED` or `SECURITY=VERIFIED` state for its own implementation.
Those remain owner-correct assurance results.

Until hosted exact-head validation and the required independent assurance are read
back, SH-02.10 must not be represented as terminal PASS and SH-02.11 production
activation remains blocked.


## Observed PR #1294 consent/runtime regression

PR #1294 (`FE-CONSENT-INCOGNITO-DORMANT-03`) produced two reproducible failure
modes before its corrected exact head `37a27177df265691885d7674a95a94e36878c01f`
completed CI, Governance, Container Security and the PR workflow successfully:

1. **Optional frontend initialization rejection**
   - observed symptom: a stylesheet readiness failure was logged and then escaped
     as an unhandled rejected Promise;
   - canonical classification:
     `FRONTEND_OPTIONAL_INIT_FAILURE -> OBSERVE_ONLY`;
   - boundary: the Self-Healing contract must not invent a generic retry or silently
     suppress arbitrary async failures. The owning runtime contains the optional
     failure fail-closed, keeps optional services disabled and preserves page
     availability; persistent/repeated failure remains observable/escalated.

2. **Stale CI expectation after an intentional runtime contract change**
   - observed symptom: the dependency-free consent runtime suite still expected
     eager `CookieConsent.run()` initialization although the new first-visit
     contract deliberately keeps the vendor runtime dormant until explicit user
     action;
   - canonical classification:
     `REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT -> RECONCILE_REPOSITORY_PROJECTION`;
   - boundary: use the existing `repository.pr.autofix` specialist only for a
     deterministic allowlisted expectation repair, at most once, followed by
     exact-head CI/Governance readback.

These cases are now first-class deterministic SH-02.10 scenarios:
`FRONTEND_OPTIONAL_INIT_REJECTION` and
`STALE_TEST_EXPECTATION_AFTER_RUNTIME_CONTRACT_CHANGE`.

This extension does not activate SH-2/SH-3, does not add a second frontend recovery
loop, and does not authorize test weakening. The observed #1294 repair remains
historical evidence; future occurrences must be re-observed and revalidated against
their exact generation.
