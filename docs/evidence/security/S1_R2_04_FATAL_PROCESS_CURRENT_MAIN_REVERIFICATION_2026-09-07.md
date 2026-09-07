# S1-R2-04 — Fatal Process Current-Main Re-Verification

**Project:** `CAPITAL-AI-SEC`  
**Finding:** `S1-R2-04`  
**Date:** `2026-09-07`  
**Verification baseline:** `main@09ab297c1fd954c37fa2cb8b2fba718cb58402cb`  
**Security role:** independent verification only  
**Productive owner:** `CAPITAL-AI-OPS / PVC-04`; runtime/post-deploy evidence `CAPITAL-AI-OPS / PVC-08`  
**Status:** `REPOSITORY_CONTRACT_VERIFIED / POST_DEPLOY_EVIDENCE_OPEN`

## Scope

This re-verification inspects the exact current-main implementation and tests for fatal Node.js process behavior. It does not mutate productive runtime, Render configuration, deployment, IAM, billing or provider state. It does not infer supervisor/restart behavior from source code.

## Current-main observations

### Fatal state and fail-fast path

`server/bootstrap/processLifecycle.ts` installs handlers for both `unhandledRejection` and `uncaughtException`. On the first fatal event it:

1. normalizes the error;
2. latches process health to fatal through `markProcessFatal()`;
3. emits a Security-relevant error log with source/message/stack;
4. starts the bounded fatal action only once;
5. sets `process.exitCode = 1` before delegating termination through `SIGTERM`;
6. falls back to `process.exit(1)` if signaling fails;
7. protects the final process exit from returning code `0` while health is fatal.

Secondary fatal events are logged but do not start a second shutdown sequence.

### Latched unhealthy readiness

`server/runtime/processHealth.ts` stores the first fatal source/time and reports `healthy: false` after the fatal latch.

`server/runtime/businessReadiness.ts` reads this process-health state before the normal readiness cache. A fatal process bypasses normal cached-ready behavior and is projected as `not-ready` with `blockingChecks.processHealthy: false`. It intentionally avoids starting new external dependency probes during fatal shutdown.

### Repository test contract

`tests/unit/processLifecycle.test.ts` contains negative behavior coverage for:

- `uncaughtException` latching fatal state before bounded shutdown;
- `unhandledRejection` latching fatal state;
- exactly one shutdown start across repeated fatal events;
- listener disposal behavior.

`tests/unit/processLifecycleChild.test.ts` contains a child-process assertion that the process exits with status `1` even where delegated SIGTERM cleanup completes with an exit-0 path.

## Verification disposition

| Claim | Current-main evidence | Disposition |
|---|---|---|
| uncaught exceptions become fatal | handler + unit contract present | `VERIFIED_REPOSITORY_CONTRACT` |
| unhandled rejections become fatal | handler + unit contract present | `VERIFIED_REPOSITORY_CONTRACT` |
| fatal health becomes not-ready | latched process health + readiness bypass present | `VERIFIED_REPOSITORY_CONTRACT` |
| fatal path preserves non-zero exit intent | `exitCode = 1`, fallback `exit(1)`, exit guard + child-process test contract | `VERIFIED_REPOSITORY_CONTRACT` |
| duplicate fatal events do not start duplicate shutdown | first-event latch + unit contract | `VERIFIED_REPOSITORY_CONTRACT` |
| hosted tests currently pass on this branch head | not executed in this connector session | `NOT_RUN` |
| deployed supervisor observes non-zero exit | no exact deployment/runtime observation in this re-verification | `NOT_VERIFIED` |
| deployed supervisor restarts/replaces the unhealthy process correctly | no exact post-deploy supervisor evidence in this re-verification | `NOT_VERIFIED` |
| deployed `/readyz`/readiness projection transitions on a real fatal event | no destructive production fault injection performed | `NOT_VERIFIED` |

## Security conclusion

The **repository contract** for `S1-R2-04` is independently re-verified against current main: the implementation is fail-fast, latches unhealthy state, prevents duplicate fatal shutdown initiation, and preserves non-zero fatal termination intent.

This does **not** close the complete runtime finding. Post-deploy evidence remains owned by `CAPITAL-AI-OPS / PVC-08` and must demonstrate the applicable supervisor/restart and deployed readiness behavior against an exact deployed identity. Missing runtime evidence is not PASS.

No productive remediation is performed by `CAPITAL-AI-SEC` in this slice.
