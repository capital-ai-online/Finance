# OPS-08-B-SH-02 — Autonomous Self-Healing Backend & Frontend

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08`  
**Supporting PVC:** `PVC-02`, `PVC-04`, `PVC-07`, `PVC-18`  
**Frontend participant:** `CAPITAL-AI-FE` (presentation/recovery only; no productive PVC)  
**Priority:** P0  
**Status:** ACTIVE / OWNER-DIRECTED / IMPLEMENTATION STARTED  
**Baseline:** `main@6889a7c5f7f5ac0176ea500b251ada795cf628e4`  
**Branch:** `agent/operations-autonomous-self-healing-platform-20260920`  
**Architecture:** `docs/architecture/AUTONOMOUS_SELF_HEALING_PLATFORM.md`

## Outcome

Deliver one bounded, evidence-driven recovery system that can detect failures, perform eligible reversible remediation, verify the resulting state and either converge or safely quarantine/escalate.

The work package must reuse the existing Supervisor, process lifecycle, Telemetry/logger, EventMesh, Recovery Evidence Harness, frontend architecture, GitHub CI/supply-chain path and Render runtime. Parallel control planes are prohibited.

## Work graph

| WP | Scope | Owner/PVC | Dependencies | Exit gate | State |
|---|---|---|---|---|---|
| SH-02.0 | Authority/supersession + architecture baseline | OPS / PVC-08 | current main | stale owner-gating projections reconciled to current trust root; no weakened gate | IMPLEMENTED_BRANCH |
| SH-02.1 | Backend liveness/lifecycle convergence | OPS / PVC-08,04 | 02.0 | one /healthz authority; fatal process state -> 503; duplicate fatal listeners removed | IN_IMPLEMENTATION |
| SH-02.2 | Frontend bounded recovery boundary | FE + OPS / cross-cutting | 02.0 | stale deployment-asset failures auto-reload at most once per fingerprint/session; persistent failures do not loop | IN_IMPLEMENTATION |
| SH-02.3 | Self-Healing finding/action contract | OPS / PVC-04,18 | 02.1 | deterministic drift taxonomy, action registry, budgets, cooldowns, kill switches, verification | QUEUED |
| SH-02.4 | Backend dependency resilience convergence | affected Primary Owners + OPS runtime | 02.3 | retry/circuit/LKG semantics owner-correct; side effects require idempotency | QUEUED |
| SH-02.5 | Worker/job recovery | OPS / PVC-02,08 | 02.3 | stalled-worker detection, lease/idempotency, bounded retry, quarantine evidence | QUEUED |
| SH-02.6 | Frontend degraded-mode + version-skew recovery | FE cross-cutting | 02.2,02.3 | feature-local degradation, reconnect/backoff, state rehydration, deployment skew recovery | QUEUED |
| SH-02.7 | Exact-SHA runtime recovery | OPS / PVC-07,08 | 02.3 + provenance | existing authorized deploy path can boundedly re-drive exact merged SHA and verify identity | QUEUED |
| SH-02.8 | Protected rollback/restore capability contracts | OPS + SEC/COMP/QM | 02.7 + recovery evidence | rollback/restore remain disabled until exact pre/post conditions and independent verification exist | HELD |
| SH-02.9 | Observability/SLO/incident convergence | OPS / PVC-18,08 | 02.3 | remediation evidence correlates finding -> action -> readback -> convergence without secret/PII leakage | QUEUED |
| SH-02.10 | Fault injection and convergence suite | OPS + QM + SEC | 02.4..02.9 | deterministic failure matrix proves bounded recovery and safe exhaustion | QUEUED |
| SH-02.11 | Staged production activation | OPS / PVC-08 | all enabled tiers verified | kill switch, budgets, production readback, independent verification, no unbounded loop | QUEUED |

## SH-02.0 — Supersession and architecture baseline

### Deliverables
- architecture concept;
- narrow supersession projection for stale SH-R2/per-run owner-gate language;
- current-main work claim;
- roadmap/work-package reconciliation.

### Exit
No change to `/AGENTS.md` is required because current main already contains the workflow-autonomy and bounded self-healing rules needed for this package.

## SH-02.1 — Backend liveness/lifecycle convergence

### Findings
Current main has:
- canonical fatal lifecycle bootstrap under `server/bootstrap/processLifecycle.ts`;
- process-health state under `server/runtime/processHealth.ts`;
- a modular `server/routes/health.ts`;
- a second inline `/healthz` in `server.application.ts`;
- a second set of process-fatal listeners in `server.application.ts` whose historical comment explicitly avoids process exit.

This duplicates health/lifecycle semantics.

### Implementation
- make `server/routes/health.ts` the single liveness route;
- include process-fatal state in the liveness snapshot;
- return 503 when the process has entered fatal shutdown;
- mount the router in canonical route composition;
- remove the inline shadow `/healthz`;
- remove duplicate legacy fatal listeners;
- keep the boot-installed process lifecycle as the single fatal-process path;
- keep external dependency checks out of liveness.

### Tests
Pure model tests must prove healthy -> 200 semantics and fatal -> unhealthy/503 semantics without network access.

## SH-02.2 — Frontend bounded recovery boundary

### Finding
The existing root Error Boundary has only a manual full-page reload path. It does not distinguish persistent render defects from stale dynamic-deployment assets.

### Implementation
Introduce a small reliability helper:
- classify known stale chunk/dynamic-import failures;
- derive a non-sensitive recovery fingerprint;
- allow exactly one automatic reload per fingerprint/session;
- never expose raw exception details in production-facing recovery UI;
- keep a manual recovery action after the automatic budget is exhausted.

### Tests
Classification and one-shot budget behavior are unit tested without requiring a browser network.

## SH-02.3 — Self-Healing control contract

Create one registry, not a second Supervisor:
- `FindingClass`;
- `RemediationAction`;
- `RemediationPolicy`;
- `RemediationBudget`;
- `VerificationResult`;
- `ConvergenceResult`.

Required state machine:

```text
OBSERVED
 -> DIAGNOSED
 -> ELIGIBLE | BLOCKED
 -> REMEDIATING
 -> VERIFYING
 -> CONVERGED | DEGRADED | QUARANTINED | ESCALATED
```

No self-healing action may recursively authorize itself.

## SH-02.4 — Backend dependency resilience

For each dependency:
- classify read-only/idempotent/side-effecting;
- use existing provider-specific resilience where present;
- normalize retry/backoff/jitter/circuit evidence;
- preserve domain freshness/provenance rules;
- prohibit heuristic business-data fabrication as "recovery".

## SH-02.5 — Worker/job recovery

Apply to durable outbox and other recurring workers:
- heartbeat/lease;
- stalled-work detection;
- retry-safe handler contract;
- dead-letter/quarantine after budget exhaustion;
- process-restart safety;
- replay evidence.

## SH-02.6 — Frontend degraded mode

- API transient-error retry with bounded backoff only for safe requests;
- per-feature error/degraded boundaries;
- last-known-good UI only when source contract permits staleness;
- connection status and accessible recovery feedback;
- server deployment version/commit skew detection;
- cache/state reset without full user-session destruction where possible.

## SH-02.7 — Exact-SHA runtime recovery

Reuse the existing production chain. Eligible recovery may re-drive deployment only for an already merged, provenance-valid SHA and only through the existing protected workflow/provider path. Mandatory readback:
- expected SHA;
- observed production SHA;
- liveness;
- readiness;
- repository/branch/provider identity.

Repeated failure opens the deployment circuit and escalates.

## SH-02.8 — Rollback/restore

Held by default. Before activation prove:
- admissible rollback target;
- artifact/provenance validity;
- DB/schema compatibility;
- migration direction;
- immutable backup identity;
- restore integrity;
- RPO/RTO;
- Security verification;
- kill switch and forward recovery.

## SH-02.9 — Observability

Reuse current structured logger/Telemetry/EventMesh. Add only missing recovery event schemas and durable evidence routing. No second observability backend is introduced.

## SH-02.10 — Fault matrix

At minimum simulate:
- fatal process error;
- transient provider 5xx/timeout;
- persistent provider failure;
- worker stall;
- stale frontend chunk;
- persistent React render failure;
- API 503/429;
- deployment identity mismatch;
- failed exact-SHA redeploy verification;
- blocked policy/capability;
- recovery-budget exhaustion.

## SH-02.11 — Rollout

Activation order:
1. SH-0 observation;
2. SH-1 local reversible actions;
3. SH-2 exact-SHA runtime actions;
4. SH-3 only after separate verified capability contracts.

Each tier has an independent kill switch.

## Pull Request / merge policy

Repository implementation may be automated and eligible workflows may execute according to the current trust root. The final merge remains Human/CODEOWNER-only. No work-package state may infer merge authority from green checks.
