# OPS-08-B-SH-02 — Autonomous Self-Healing Backend & Frontend

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08`  
**Supporting PVC:** `PVC-02`, `PVC-04`, `PVC-07`, `PVC-18`  
**Frontend participant:** `CAPITAL-AI-FE` (presentation/recovery only; no productive PVC)  
**Priority:** P0  
**Status:** ACTIVE / OWNER-DIRECTED / IMPLEMENTATION STARTED  
**Initial baseline:** `main@6889a7c5f7f5ac0176ea500b251ada795cf628e4`  
**Initial slice:** merged via PR #1122  
**SH-02.3 merge:** PR #1125 → `70c33dc0f283584275798b2e186e3771b2bfccf8`  
**SH-02.4 merged baseline:** `main@3a9a55262dbb8ee87dac087a863b1e3369e71d22` via PR #1136  
**SH-02.5 merge:** PR #1141 → `5a89e8ab0f12267838c30994b6e84ccbe002605f`  
**Policy-homogeneity merge:** PR #1147 → `f0c14ed5571a4b681c4360e27bc84bbd0ab3527f`  
**SH-02.3E Evidence Integrity merge:** PR #1150 → `f0e145cea02e2ddd72df5f35aee8ee8426c67f8d`  
**SH-02.6 merge:** PR #1161 → `24850d31cc503b28b1ff786b377826733bf9671f`  
**Auto-Merge Safety Contract merge:** PR #1164 → `6207e1cc094b1d5d599963dc7f1ed25c73bab928`  
**Current implementation baseline:** `main@53c38dbeaf85262ed1784ce3458d61b54f6da3bb`  
**Current coordination slice:** `SH-02.7` exact-SHA runtime recovery capability implementation on `agent/operations-sh02-7-exact-sha-runtime-recovery-20260921`  
**Next functional slice:** `SH-02.7` — Exact-SHA runtime recovery  
**Architecture:** `docs/architecture/AUTONOMOUS_SELF_HEALING_PLATFORM.md`

## Outcome

**P0 priority invariant:** until SH-02.11 is terminal, the next dependency-ready SH-02 slice is the highest executable CAPITAL-AI-OPS work item. Other normal OPS backlog items are deferred while a SH-02 slice is executable. Real Security/Compliance/QM/domain dependencies remain blocking and are never bypassed.

**Policy-homogeneity gate:** before advancing a functional slice, active repository-development projections must not contradict `/AGENTS.md@CURRENT_MAIN` or the action activation state in `self-healing-contract/1.0.0`. OPS-owned drift is corrected in this package; foreign-owner drift becomes a traceable handoff and does not silently transfer ownership.

Deliver one bounded, evidence-driven recovery system that can detect failures, perform eligible reversible remediation, verify the resulting state and either converge or safely quarantine/escalate.

The work package must reuse the existing Supervisor, process lifecycle, Telemetry/logger, EventMesh, Recovery Evidence Harness, frontend architecture, GitHub CI/supply-chain path and Render runtime. Parallel control planes are prohibited.

## Work graph

| WP | Scope | Owner/PVC | Dependencies | Exit gate | State |
|---|---|---|---|---|---|
| SH-02.0 | Authority/supersession + architecture baseline | OPS / PVC-08 | current main | stale owner-gating projections reconciled to current trust root; no weakened gate | IMPLEMENTED_ON_MAIN |
| SH-02.1 | Backend liveness/lifecycle convergence | OPS / PVC-08,04 | 02.0 | one /healthz authority; fatal process state -> 503; duplicate fatal listeners removed | IMPLEMENTED_ON_MAIN |
| SH-02.2 | Frontend bounded recovery boundary | FE + OPS / cross-cutting | 02.0 | stale deployment-asset failures auto-reload at most once per fingerprint/session; persistent failures do not loop | IMPLEMENTED_ON_MAIN |
| SH-02.3 | Self-Healing finding/action contract | OPS / PVC-04,18 | 02.1 | deterministic drift taxonomy, action registry, budgets, cooldowns, kill switches, verification | IMPLEMENTED_ON_MAIN / VALIDATED via PR #1125 |
| SH-02.3E | Evidence Integrity + read-only Control Panel projection | OPS / PVC-08,18 | 02.3 | positive states require generation/source/integrity/readback evidence; SH-3 additionally requires independent QM + Security assurance | IMPLEMENTED_ON_MAIN / VALIDATED via PR #1150 |
| SH-02.4 | Backend dependency resilience convergence | affected Primary Owners + OPS runtime | 02.3 | retry/circuit/LKG semantics owner-correct; side effects require idempotency | IMPLEMENTED_ON_MAIN / VALIDATED via PR #1136 / ACTIVATION_HELD |
| SH-02.5 | Worker/job recovery | OPS / PVC-02,08 | 02.3 | stalled-worker detection, lease/idempotency, bounded retry, quarantine evidence | IMPLEMENTED_ON_MAIN / VALIDATED via PR #1141 / GENERIC_ACTION_HELD |
| SH-02.6 | Frontend degraded-mode + version-skew recovery | FE cross-cutting | 02.2,02.3 | feature-local degradation, reconnect/backoff, state rehydration, deployment skew recovery | IMPLEMENTED_ON_MAIN / VALIDATED via PR #1161 |
| SH-02.7 | Exact-SHA runtime recovery | OPS / PVC-07,08 | 02.3 + provenance | existing authorized deploy path can boundedly re-drive exact merged SHA and verify identity | IN_PROGRESS / CAPABILITY_IMPLEMENTED / ACTIVATION_HELD / HOSTED_VALIDATION_PENDING |
| SH-02.8 | Protected rollback/restore capability contracts | OPS + SEC/COMP/QM | 02.7 + recovery evidence | rollback/restore remain disabled until exact pre/post conditions and independent verification exist | HELD |
| SH-02.9 | Observability/SLO/incident convergence | OPS / PVC-18,08 | 02.3 | remediation evidence correlates finding -> action -> readback -> convergence without secret/PII leakage | QUEUED |
| SH-02.10 | Fault injection and convergence suite | OPS + QM + SEC | 02.4..02.9 | deterministic failure matrix proves bounded recovery and safe exhaustion | QUEUED |
| SH-02.11 | Staged production activation | OPS / PVC-08 | all enabled tiers verified | kill switch, budgets, production readback, independent verification, no unbounded loop | QUEUED |

## SH-02.0 — Supersession and architecture baseline

### Deliverables
- architecture concept;
- canonical `self-healing-contract/1.0.0`;
- archive and deactivate predecessor Self-Healing rule projections;
- current-main work claim;
- roadmap/work-package reconciliation;
- deterministic supersession validation/evidence.

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

## Current branch implementation evidence

Implemented on the branch before PR validation:
- canonical `server/routes/health.ts` now projects process fatal state and drives 200/503 liveness without dependency network calls;
- `registerApplicationRoutes.ts` mounts the canonical health router once;
- `server.application.ts` no longer owns a shadow `/healthz` or duplicate fatal process listeners;
- `src/app/reliability/frontendRecovery.ts` provides one-shot stale-asset recovery budgeting;
- the root `ErrorBoundary` consumes that policy and does not expose raw exception messages in the recovery UI;
- focused unit tests cover backend liveness state and frontend recovery classification/budget behavior.

Validation is intentionally represented as pending until repository CI executes against the PR head. No unexecuted test is labeled PASS.

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

### Canonical supersession rule

After Human/CODEOWNER merge of SH-02.3, `self-healing-contract/1.0.0` is the only executable Self-Healing finding/action/eligibility/convergence contract. It does not supersede `/AGENTS.md@CURRENT_MAIN` or current Security/Compliance/QM/domain controls; it supersedes only older Self-Healing-specific execution rules and projections.

The predecessor `OPS-08-B-SH-01`, legacy `SH-R*` labels and the narrow `AUTONOMOUS_SELF_HEALING_RUNTIME_SUPERSESSION_2026-09-20.md` control-plane projection are archived/non-authorizing. They cannot be used to activate, deny or classify remediation.

Archive evidence:
- `docs/archive/projects/operations/superseded/OPS_08_B_SH_01_SELF_HEALING_READINESS_2026-09-10.md`;
- `docs/archive/governance/superseded/AUTONOMOUS_SELF_HEALING_RUNTIME_SUPERSESSION_2026-09-20.md`.

### SH-02.3 branch implementation

- `src/platform/Supervisor/selfHealingContract.ts` is the single pure contract/registry surface; it creates no second Supervisor and performs no provider mutation.
- all canonical finding classes resolve to deterministic remediation policies;
- every action carries tier, activation state, idempotency class, blast radius, bounded attempt/cooldown/timeout budget, kill switch and verification probe;
- SH-2/SH-3 actions are `HELD` and require an external capability contract; the registry cannot grant its own capability;
- the only state-changing SH-1 action already marked `ENABLED` is the previously implemented one-shot frontend stale-asset reload;
- the Supervisor exposes contract validity separately from executable runtime self-healing and now reports `capabilities.selfHealing=false` until SH-02.4+ bind and verify concrete executors;
- focused unit tests cover taxonomy completeness, held protected actions, one-shot budgeting, fail-closed eligibility, legal state transitions and verification-to-convergence semantics.

Validation remains `VALIDATION_PENDING` until repository CI evaluates the final PR head. `tests/unit/selfHealingSupersession.test.ts` additionally verifies that active Self-Healing surfaces contain no legacy `SH-R*` execution rules and that predecessor artifacts exist only in the archive paths.

## SH-02.4 — Backend dependency resilience

For each dependency:
- classify read-only/idempotent/side-effecting;
- use existing provider-specific resilience where present;
- normalize retry/backoff/jitter/circuit evidence;
- preserve domain freshness/provenance rules;
- prohibit heuristic business-data fabrication as "recovery".

### SH-02.4 branch implementation

- `RETRY_SAFE_OPERATION` remains `HELD` in `self-healing-contract/1.0.0`; SH-02.4 implements and verifies the boundary without performing the staged SH-1 production activation reserved for SH-02.11.
- `src/platform/Supervisor/dependencyResilience.ts` is the bounded executor/projection contract. Raw `SIDE_EFFECTING` and `PROTECTED` operations fail closed before execution; provider-native owners are never wrapped in another retry loop.
- `executeSupervised()` now defaults unclassified work to `SIDE_EFFECTING` and suppresses automatic retries unless the caller explicitly declares `READ_ONLY` or `IDEMPOTENT`; safe retries use bounded exponential backoff plus jitter.
- The contract-bound generic dependency executor carries the existing budget (timeout, max attempts, cooldown, kill switch and mandatory post-action verification) but returns fail-closed `ACTION_HELD` until staged activation.
- Dependencies that already own retry/circuit/LKG behavior are classified `DEPENDENCY_NATIVE` and receive no second outer retry loop. Their health state is projected into the canonical finding taxonomy only.
- Provider circuit-open, authentication, schema/configuration and persistent-failure states are normalized to `PROVIDER_CIRCUIT_OPEN`, `SECURITY_OR_POLICY_BLOCKED` or `DEPENDENCY_PERSISTENT`; these states are observed/escalated rather than blindly retried.
- Existing MarketDataGateway, CoinGecko and DeFiLlama retry/circuit/rate-limit/LKG semantics remain owner-correct and are not duplicated.
- Supervisor status exposes the SH-02.4 contract and provider-native resilience projection. Runtime `capabilities.selfHealing` remains `false`; SH-1 generic retry and all SH-2/SH-3 actions stay held until their staged activation gates.

### Continuous Self-Healing package continuation

Fresh Owner direction on 2026-09-20 establishes this continuation rule for the currently active `OPS-08-B-SH-02` work package:

1. after a Self-Healing PR is Human/CODEOWNER-merged, the exact merge/current-main state and Production identity must first satisfy the canonical post-merge correlation gate;
2. after that PASS, the next lowest-numbered `QUEUED` SH-02 slice whose explicit SH dependencies are terminal on main becomes the continuation candidate immediately; no additional per-slice Owner prompt is required while it remains inside this already active Owner-directed package;
3. every continuation still starts from freshly read `CURRENT_MAIN`, uses a fresh exclusive claim and branch, re-resolves writers/owners/security constraints, validates truthfully and delivers a new PR;
4. `HELD` slices, unresolved textual prerequisites (for example provenance/recovery evidence), foreign-owner implementation, protected external capability expansion, Security/Compliance/QM acceptance, or ambiguous dependency state stop automatic continuation fail-closed;
5. `.github/workflows/self-healing-package-continuation.yml` records the post-merge handoff as a deduplicated issue. That issue is a non-authorizing orchestration/evidence surface; it does not create a second task registry and does not implement code by itself;
6. final merge remains Human/CODEOWNER-only under `/AGENTS.md@CURRENT_MAIN`. The continuation workflow must not enable auto-merge, merge a PR, weaken checks or bypass protection.

This rule advances the package without idle owner prompts while preserving the repository's current merge-authority boundary.

## SH-02.5 — Worker/job recovery

Apply to durable outbox and other recurring workers:
- heartbeat/lease;
- stalled-work detection;
- retry-safe handler contract;
- dead-letter/quarantine after budget exhaustion;
- process-restart safety;
- replay evidence.

### SH-02.5 branch implementation

- ADR-0054 `public.outbox_jobs` remains the single durable queue, retry-budget and dead-letter authority; no second worker control plane or queue is introduced.
- `heartbeat_outbox_job` extends only a currently owned, still-unexpired processing lease. A late heartbeat cannot resurrect an expired lease.
- `claim_outbox_job_v2` receives the exact set of job types whose handlers are registered as `IDEMPOTENT`. An expired processing lease is automatically reclaimed only for those types and only while `attempts < max_attempts`.
- Expired jobs that exhausted their attempt budget, or whose handler is not proven replay-safe, move fail-closed to the existing `dead_letter` state instead of being re-executed.
- `outbox_recovery_events` persists bounded `stale_lease_reclaimed` and `work_item_quarantined` evidence with job identity, lease-owner correlation, attempt budget and reason.
- The legacy `claim_outbox_job` RPC remains available for rolling rollback compatibility but delegates with an empty replay-safe set, so an older application revision cannot silently restore unsafe stale replay.
- Runtime handler registration now requires explicit `IDEMPOTENT` or `REQUIRES_RECONCILIATION` replay safety. Existing SMTP jobs are conservatively classified `REQUIRES_RECONCILIATION` because provider acceptance can be ambiguous across process failure; they quarantine rather than risk duplicate side effects.
- Handler failure for an explicitly idempotent type continues through the existing bounded `fail_outbox_job` backoff/max-attempt authority. Missing handlers and uncertain side-effect failures quarantine immediately.
- The generic Self-Healing `QUARANTINE_WORK_ITEM` action remains `HELD`; this slice hardens the pre-existing outbox-native dead-letter lifecycle and does not activate generic SH-1 remediation.
- The canonical OPS/PVC-02 Supabase migration ledger records `20260920141000_outbox_worker_recovery.sql` as a new local-only migration (`local_total=56`, `local_only=11`), keeping migration reconciliation evidence consistent with the checked-in schema set.
- Focused tests cover replay-safety filtering, lost-lease completion, idempotent bounded retry, reconciliation-required quarantine and SQL migration invariants. Validation remains `VALIDATION_PENDING` until hosted repository checks execute against the final PR head.

## SH-02.6 — Frontend degraded mode

- API transient-error retry with bounded backoff only for safe requests;
- per-feature error/degraded boundaries;
- last-known-good UI only when source contract permits staleness;
- connection status and accessible recovery feedback;
- server deployment version/commit skew detection;
- cache/state reset without full user-session destruction where possible.

## SH-02.7 precondition — Auto-Merge Safety Contract

Before SH-02.7 may arm provider-managed auto-merge, the repository trust root must contain the Human-merged Auto-Merge Safety Contract. The contract is a governance prerequisite only; it does not make SH-02.7 auto-merge eligible by default. SH-02.7 is P0 and Production-runtime/deployment-sensitive, so it remains `HUMAN_MERGE_REQUIRED` under the initial contract unless a later Human Owner trust-root change explicitly admits that class.

## SH-02.7 — Exact-SHA runtime recovery

Reuse the existing production chain. Eligible recovery may re-drive deployment only for an already merged, provenance-valid SHA and only through the existing protected workflow/provider path. Mandatory readback:
- expected SHA;
- observed production SHA;
- liveness;
- readiness;
- repository/branch/provider identity.

Repeated failure opens the deployment circuit and escalates.

### SH-02.7 capability implementation

- `.github/workflows/ops-exact-sha-runtime-recovery.yml` is an event-driven adapter around the existing `ci.yml` production deployment job; it never calls Render directly and never reads the Render deploy-hook secret.
- Eligibility is bound to the still-current `main` SHA, the exact same-repository `ci.yml` push run and its non-expired SHA-named supply-chain provenance artifact.
- Production identity is read before mutation; a bare liveness failure does not get reclassified as `DEPLOYMENT_IDENTITY_DRIFT`.
- The action re-runs only `Deployment verifiziert / Render-Produktion` via the GitHub Actions job-rerun API. The existing production Environment remains the sole holder of provider mutation capability.
- One recovery attempt is allowed, followed by circuit exhaustion. The contract cooldown remains `300000 ms`; the action timeout remains `900000 ms`.
- `CAPITAL_AI_ENABLE_EXACT_SHA_RECOVERY=true` is an explicit activation gate; absent/false keeps the new mutation path fail-closed while the current shared Supervisor writer overlap remains non-terminal.
- `CAPITAL_AI_DISABLE_EXACT_SHA_RECOVERY=true` is the repository-variable kill switch and overrides activation.
- A successful second CI attempt is independently read back against `/healthz` and strict `/readyz`, including commit, branch, repository and provider identity.
- `REDEPLOY_EXACT_SHA` remains `HELD` in the Self-Healing registry in this capability slice. Activation is a separate convergence step after the competing `tests/unit/supervisor.test.ts` writer is terminal and current-main correlation is repeated; `PROTECTED_ROLLBACK_RESTORE` remains `HELD`.
- Hosted validation is `PENDING` until the final PR head is evaluated by repository checks. No unexecuted result is represented as PASS.

Capability-correlation evidence: `docs/projects/operations/evidence/SH_02_7_EXACT_SHA_RUNTIME_RECOVERY_2026-09-21.md`.

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
