# CAPITAL-AI Autonomous Self-Healing Platform

**Architecture ID:** `CAPITAL-AI-ASH-01`  
**Project:** `CAPITAL-AI-OPS` with cross-cutting Frontend participation  
**Primary PVC:** `PVC-08`  
**Supporting PVC:** `PVC-02`, `PVC-04`, `PVC-07`, `PVC-18`  
**Frontend role:** presentation/recovery consumer; no productive PVC ownership  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Status:** OWNER-DIRECTED / CURRENT SELF-HEALING ARCHITECTURE  
**Correlation baseline:** `main@39aeb4473ae3f0b26a174cf5654bb78b3a288c29`  
**Runtime contract:** `src/platform/Supervisor/selfHealingContract.ts` / `self-healing-contract/1.0.0`

## 1. Goal

CAPITAL-AI shall converge backend, frontend and production runtime around one bounded autonomous recovery model:

```text
Observe -> Detect -> Diagnose -> Plan -> Remediate -> Verify -> Converge
                                      \-> Quarantine / Escalate
```

"Autonomous" means that eligible recovery actions execute without an additional per-run approval when they are already inside an authorized repository/provider capability boundary and all configured controls permit them. It does not create new credentials, IAM grants, production authority, domain authority, merge authority, Security acceptance or Compliance acceptance.

"Self-healing" means that a reproducible drift is corrected by a bounded, reversible action and then verified against the actual observed state. A retry, restart or redeploy without verification is not convergence.

### 1.1 Canonical contract set and supersession

Within the Self-Healing subject-matter scope, the current contract set is deliberately singular:

- `/AGENTS.md@CURRENT_MAIN` remains the repository-wide trust root and is never superseded by this architecture;
- this document (`CAPITAL-AI-ASH-01`) is the current Self-Healing architecture contract;
- `src/platform/Supervisor/selfHealingContract.ts` (`self-healing-contract/1.0.0`) is the executable finding/action/eligibility/convergence contract;
- `OPS-08-B-SH-02` is an execution/status projection and cannot create authority.

After Human/CODEOWNER merge of the SH-02.3 contract change, all older Self-Healing execution-rule projections are retired. This includes `OPS-08-B-SH-01`, legacy `SH-R*` classifications, blanket per-run Owner-gating rules for eligible recovery, and historical claims that generic retry behavior alone constitutes current Self-Healing.

Historical material may remain only as clearly historical evidence or under `docs/archive/**`. It cannot activate, deny, broaden or weaken a current remediation. Current eligibility is derived only from the trust root, applicable current Security/Compliance/QM/domain controls and `self-healing-contract/1.0.0`.

The only current recovery tiers are `SH-0`, `SH-1`, `SH-2` and `SH-3`. Legacy `SH-R*` names have no current execution semantics.

### 1.2 Policy-homogeneity and priority invariant

Within `CAPITAL-AI-OPS`, `OPS-08-B-SH-02` is the highest executable P0 work package until SH-02.11 reaches a terminal state or a real dependency blocks the next slice. This priority does not transfer foreign-project ownership and cannot override Security, Compliance, QM or domain gates.

Repository-development instruction conflicts are classified as policy drift and fail closed to `/AGENTS.md@CURRENT_MAIN`. Self-Healing may correct OPS-owned stale projections directly; contradictions in GOV, DOC, SEC, COMP or QM are handed to their canonical Primary Owner with exact file, conflicting statement and exit gate. Historical evidence remains unchanged.

## 2. Non-negotiable invariants

1. `/AGENTS.md@CURRENT_MAIN` remains the single development trust root.
2. Human/CODEOWNER merge remains mandatory; agents never self-merge or enable auto-merge.
3. No second Supervisor, EventMesh, logger, telemetry plane, release plane, frontend architecture or deployment authority is introduced.
4. Domain truth remains with the canonical Primary Owner. Frontend renders truth; it never invents it.
5. Security/Compliance/QM findings remain independently owned.
6. Every remediation has a bounded budget, idempotency rule, cooldown and post-action verification.
7. Repeated failure opens a circuit and escalates; it never loops forever.
8. Secrets, IAM, Billing, DNS, destructive data changes and provider grants are never inferred from repository scope.
9. Evidence is truthful: `NOT_RUN`, `BLOCKED` and `FAIL` never become `PASS`.
10. A failed recovery may degrade safely, quarantine the affected capability or fail closed, but may not fabricate business/scoring/data output.

## 3. One control loop

### Observe
Reuse existing structured logger/Telemetry, EventMesh, process health, business readiness, provider health, exact-SHA deployment identity and frontend error boundary.

### Detect
Normalize signals into a bounded drift taxonomy:

- `PROCESS_FATAL`
- `LIVENESS_FAILED`
- `BUSINESS_NOT_READY`
- `DEPENDENCY_TRANSIENT`
- `DEPENDENCY_PERSISTENT`
- `PROVIDER_CIRCUIT_OPEN`
- `WORKER_STALLED`
- `DEPLOYMENT_IDENTITY_DRIFT`
- `FRONTEND_STALE_ASSET`
- `FRONTEND_RENDER_FAILURE`
- `VERSION_SKEW`
- `DATA_RECOVERY_REQUIRED`
- `SECURITY_OR_POLICY_BLOCKED`

### Diagnose
Each finding carries: source, correlation ID, scope/owner/PVC, observed state, desired state, root-cause confidence, action eligibility, remediation budget, evidence pointers and affected capability.

### Plan
Select only a remediation registered for the exact finding class and current capability boundary. Unknown or ambiguous findings fail closed into escalation.

### Remediate
Actions are tiered:

| Tier | Meaning | Examples | Default |
|---|---|---|---|
| `SH-0` | observe only | evidence, diagnostics, alerting | enabled |
| `SH-1` | local/reversible | bounded retry, cache refresh, circuit reset after cooldown, stale frontend asset reload | action-specific; only `activation=ENABLED` actions are executable |
| `SH-2` | runtime/provider bounded | graceful process recycle, exact-SHA redeploy/readback through an already-authorized workflow | eligible only inside existing protected capability |
| `SH-3` | state-changing protected recovery | deployment rollback, database restore, IAM/secret/Billing/DNS mutation | disabled until an explicit capability contract and verification gate exists |

### Verify
The system re-reads the actual state after every action. Verification must be independent from the mutation result where possible: health/readiness, deployment identity, runtime evidence, provider readback, UI boot success or data-integrity evidence.

### Converge
A recovery closes only when observed state satisfies the exit gate. Otherwise the action budget decrements and the next bounded action may run.

### Quarantine / Escalate
When the budget is exhausted, root cause is ambiguous, policy denies mutation, or independent verification fails, the affected capability is degraded/quarantined and evidence is emitted. Other independent capabilities continue.

## 4. Backend architecture

### Process safety
The canonical process lifecycle marks fatal state unhealthy, performs bounded shutdown and relies on the platform to restart the process. Duplicate fatal handlers are prohibited.

### Liveness and readiness
- `/healthz`: network-independent **process liveness** only; returns 503 after fatal process state.
- `/healthz/readiness`: diagnostic business-readiness projection; always inspectable.
- `/readyz`: strict business readiness 200/503; not the Render liveness path.

Liveness must not depend on Supabase, AI providers, market-data providers or any other external network.

### Dependency resilience
Existing provider-specific retry/backoff/circuit-breaker/LKG semantics are preserved. SH-02.4 binds dependency resilience to the shared remediation contract without adding a generic retry-everything wrapper; `RETRY_SAFE_OPERATION` remains `HELD`. SH-02.5 hardens the existing ADR-0054 outbox worker lifecycle while generic `QUARANTINE_WORK_ITEM` remains `HELD`. Side-effecting operations require explicit replay/idempotency evidence before retry.

### Workers and jobs
Durable outbox/job handlers gain lease/stall detection, bounded retry, dead-letter/quarantine evidence and restart-safe idempotency. A stalled worker may restart locally; data repair is a separate action class.

## 5. Frontend architecture

The existing React Error Boundary remains the single application-level presentation recovery boundary.

Automatic recovery is limited to failures that strongly indicate stale deployment assets or dynamic-import version skew. The browser may perform one automatic reload per bounded failure fingerprint/session. Persistent render failures remain user-visible and do not enter a reload loop.

Later slices add:
- connection/retry state for transient API failures;
- stale-version detection from deployment headers;
- cache invalidation and state rehydration;
- feature-level degradation instead of whole-app failure;
- accessible recovery states and telemetry without exposing raw exception detail.

Frontend recovery never fabricates backend data or business decisions.

## 6. Release and production recovery

The existing GitHub CI -> supply-chain attestation -> exact-SHA Render deploy hook -> post-deploy identity verification path remains the only production promotion path.

Self-healing may later request an exact-SHA redeploy when:
- the target SHA is already Human-merged;
- provenance/required checks remain valid;
- the workflow capability already authorizes the mutation;
- a retry budget and cooldown apply;
- post-deploy identity and health verify convergence.

Rollback is `SH-3` and remains disabled until a dedicated rollback contract defines admissible target SHA selection, provenance, database compatibility, migration safety, audit evidence and forward-recovery strategy.

## 7. Data recovery

The existing Recovery Evidence Harness is reused. No second backup/restore mechanism is created.

Autonomous restore is not enabled by this architecture document. It requires a separate capability contract covering:
- immutable backup identity;
- encrypted artifact verification;
- isolated restore;
- schema/application compatibility;
- RPO/RTO evidence;
- integrity verification;
- Security review;
- production cutover and forward recovery.

## 8. Safety budgets

Every action declares:

```text
maxAttempts
cooldownMs
timeoutMs
idempotencyClass
blastRadius
rollbackStrategy
verificationProbe
owner/PVC
requiredCapability
killSwitch
```

Global rules:
- no unbounded polling;
- no nested retry storms;
- exponential backoff with jitter where retry is appropriate;
- circuit open after repeated failures;
- independent recovery domains have separate budgets;
- a recovery event cannot recursively trigger the same action without cooldown and state change.

## 9. Evidence model

Every remediation emits a stable record:

```text
findingId
correlationId
detectedAt
classification
owner
pvc
desiredState
observedStateBefore
rootCause
selectedAction
actionTier
attempt
result
observedStateAfter
verification
convergence
escalationReason
deploymentVersion
commitSha
```

Operational telemetry and durable Security/Compliance evidence remain separate according to their existing authorities.

## 10. Rollout

1. **Foundation** — consolidate process health/lifecycle, bounded frontend stale-asset recovery, architecture/supersession.
2. **Control loop** — deterministic finding/action registry, budgets, cooldown, verification.
3. **Backend resilience** — dependency and worker recovery adapters.
4. **Frontend resilience** — version-skew, network/degraded-state recovery.
5. **Runtime recovery** — exact-SHA redeploy and deployment drift convergence.
6. **Protected recovery** — separately gated rollback/restore capabilities.
7. **Fault injection** — deterministic failure scenarios and convergence evidence.
8. **Production rollout** — kill switches, staged activation, SLO/incident evidence and independent Security/QM verification.

## 11. Exit gate

The platform is considered converged only when all enabled remediation classes have deterministic tests, bounded budgets, real readback verification, no competing authority/control plane, and production evidence demonstrates recovery or safe degradation without violating Security, Compliance, domain or Human-merge boundaries.
