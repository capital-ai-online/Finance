# SH-02.11A — RETRY_SAFE_OPERATION Pre-Activation Evidence

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08`  
**Supporting PVCs:** `PVC-04`, `PVC-18`  
**Baseline:** `main@db4ad93bb3bac7d4f31242b7f74f8f300d24e757`  
**Parent:** `SH-02.11 — DEPENDENCY_READY / ACTIVATION_NOT_STARTED`  
**Candidate:** `RETRY_SAFE_OPERATION`  
**State in this slice:** `HELD / PREACTIVATION_VERIFIED_PENDING_INDEPENDENT_ASSURANCE`

## Candidate contract

The first staged activation candidate is the existing SH-1 action `RETRY_SAFE_OPERATION`.

Its contract is unchanged:

- tier: `SH-1`;
- activation: `HELD`;
- idempotency class: `IDEMPOTENT`;
- blast radius: `LOCAL_RUNTIME`;
- required capability: none;
- kill switch: `self-healing.safe-retry`;
- verification probe: `dependency-operation-readback`;
- max attempts: `3`;
- cooldown: `500 ms`;
- timeout: `10,000 ms`;
- exhaustion state: `DEGRADED`.

## Safety boundary

The generic executor remains eligible only for:

- `READ_ONLY` operations;
- explicitly `IDEMPOTENT` operations;
- resilience owner `SUPERVISOR_SAFE_RETRY`.

The executor remains prohibited for:

- `SIDE_EFFECTING`;
- `PROTECTED`;
- `DEPENDENCY_NATIVE` retry/circuit/LKG ownership;
- `NO_AUTOMATIC_RETRY`.

Provider-native resilience must never be wrapped by a second retry loop.

## Pre-activation regression

`tests/unit/sh0211RetrySafePreactivation.test.ts` proves that:

1. the action remains `HELD`;
2. budget, kill switch and verification probe exactly match the canonical contract;
3. only `READ_ONLY` and `IDEMPOTENT` are retry-safe;
4. `DEPENDENCY_TRANSIENT` permits only `RETRY_SAFE_OPERATION` or `OBSERVE_ONLY`;
5. the operation is never invoked while the candidate is held;
6. unsafe operation classes fail closed before execution;
7. provider-native and no-automatic-retry owners cannot enter the generic retry executor.

## Independent-assurance gate

This slice deliberately does not perform `HELD -> ENABLED`.

Before any later activation mutation:

- fresh `CAPITAL-AI-SEC` verification must bind this exact pre-activation generation;
- fresh `CAPITAL-AI-QM` assurance must bind the same generation;
- their exact-head checks must pass;
- current-main ancestry must be re-read;
- no later contract/budget/owner mutation may have occurred.

If any of those conditions fails, the candidate remains `HELD`.

## Conclusion

`RETRY_SAFE_OPERATION` is the first eligible SH-02.11 activation candidate, but is not activated by this slice. The current state is:

`PREACTIVATION_READY / SECURITY_ASSURANCE_PENDING / QM_ASSURANCE_PENDING / ACTION_HELD`
