# Security — SH-02.11A RETRY_SAFE_OPERATION Independent Verification

**Project:** `CAPITAL-AI-SEC`  
**Role:** cross-cutting Security requirements and independent verification  
**Verification target:** `OPS-08-B-SH-02 / SH-02.11A`  
**Verification baseline:** `main@7bcc6aee2700d6fa3f926ff8615b04cde136750c`  
**Pre-activation PR:** `#1314`  
**Pre-activation head:** `0be35d066c608d69ed9fb23294c64e15dc822065`  
**Contract generation:** `self-healing-contract/1.2.0` / `dependency-resilience/1.0.0`  
**Date:** 2026-09-23  
**Result:** `VERIFIED / RETRY_SAFETY_BOUNDARY_CONFIRMED`  
**Canonicalization gate:** this return becomes current Security assurance only after its exact-head checks pass and the SEC PR is Human/CODEOWNER-merged.

## Independence and generation

This verification is freshly bound to the Human-merged SH-02.11A pre-activation generation `7bcc6aee2700d6fa3f926ff8615b04cde136750c`.

Security performs no OPS remediation, runtime/provider mutation, deployment, production retry, rollback/restore or `HELD -> ENABLED` transition. The action remains held throughout this slice.

## Independent Security assertions

Security independently verifies the following invariants:

1. `SELF_HEALING_CONTRACT_VERSION === self-healing-contract/1.2.0`.
2. `RETRY_SAFE_OPERATION` remains `SH-1 / HELD / IDEMPOTENT / LOCAL_RUNTIME`.
3. The action requires no privileged capability and retains kill switch `self-healing.safe-retry`.
4. Verification remains bound to `dependency-operation-readback`.
5. The retry budget is exactly `maxAttempts=3`, `cooldownMs=500`, `timeoutMs=10000`.
6. Only `READ_ONLY` and explicitly `IDEMPOTENT` operations are retry-safe.
7. `SIDE_EFFECTING` and `PROTECTED` operations fail closed before invocation.
8. `DEPENDENCY_NATIVE` and `NO_AUTOMATIC_RETRY` owners cannot enter the generic retry executor.
9. `DEPENDENCY_TRANSIENT` is bounded to `RETRY_SAFE_OPERATION` or `OBSERVE_ONLY`; persistent, circuit-open and Security/policy-blocked findings do not gain generic retry.
10. While the candidate is held, even an otherwise safe read operation is not invoked.

## Exact source identities reviewed

- `src/platform/Supervisor/selfHealingContract.ts` → blob `bf926f6d2629344a36a2ed76499e33450ab3a3e2`;
- `src/platform/Supervisor/dependencyResilience.ts` → blob `e98f4d3ebb5c91479685170fe4a02284d1c1f944`;
- `tests/unit/sh0211RetrySafePreactivation.test.ts` → blob `fc32377df8320e26af68f8431565196b46f1088e`.

The dedicated independent test is `tests/unit/securitySh0211aRetrySafeIndependentAssurance.test.ts`. It validates the Security boundary directly from the canonical contract/runtime APIs and does not import or reuse the pre-activation test.

## Security verification matrix

| Security property | Expected boundary |
|---|---|
| Activation state | `HELD` |
| Generic automatic retry | disabled |
| Read-only operation | eligible class, but not executed while held |
| Explicitly idempotent operation | eligible class, but not executed while held |
| Side-effecting operation | blocked before invocation |
| Protected operation | blocked before invocation |
| Provider-native resilience | delegated; no nested generic retry |
| No-automatic-retry owner | blocked |
| Retry budget | finite: 3 / 500 ms / 10 s |
| Kill switch | mandatory metadata retained |
| Verification | `dependency-operation-readback` retained |
| New Security/Production authority | absent |

## Residual boundary

This return verifies only the repository-level Security boundary of the pre-activation candidate. It does not authorize production activation, accepted risk, provider capability expansion, retrying side effects, rollback/restore, auto-merge or Human/CODEOWNER bypass.

A fresh independent QM return for the same pre-activation generation remains mandatory. Any mutation of the candidate action, dependency-resilience executor, budget, idempotency boundary, resilience ownership or verification probe invalidates this assurance until re-verification.

## Security conclusion

At `main@7bcc6aee2700d6fa3f926ff8615b04cde136750c`, `RETRY_SAFE_OPERATION` preserves the declared bounded Security boundary and remains `HELD`.

The result is `VERIFIED / RETRY_SAFETY_BOUNDARY_CONFIRMED`, canonical only after exact-head checks pass and Human/CODEOWNER merges this Security PR.
