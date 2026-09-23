# SH-02.10 — Fault Injection & Convergence Evidence

**Work package:** `OPS-08-B-SH-02 / SH-02.10`  
**Project / Owner:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-08`  
**Supporting PVCs:** `PVC-04`, `PVC-18`  
**Independent assurance:** `CAPITAL-AI-QM`, `CAPITAL-AI-SEC`  
**Correlation baseline:** `main@05892a28d179316962c19bd52843c2e0e3cfbc9d`  
**Current generation:** `main@05892a28d179316962c19bd52843c2e0e3cfbc9d`  
**Status:** `IMPLEMENTED_ON_MAIN / REPOSITORY_VALIDATED / PRODUCTION_IDENTITY_VERIFIED / INDEPENDENT_ASSURANCE_PENDING`

## Dependency convergence

SH-02.9 functional implementation is Human-merged through PR #1262 as
`75ae1ff92e80ef68a77803d2c41ee272bc003b3b`.

The owner-correct SH-02.9 post-merge projection is also Human-merged through
PR #1271 as `886486e057fea2fe833104b23f7a36d05d0b9b58`. Its exact head
`d282aa38f7d658b2dadc3641c54415c402c03e61` completed CI, Governance,
Container Security and Project Execution Directive validation successfully.

Therefore the historical blocker "SH-02.9 post-merge projection pending" is terminal. SH-02.10 is dependency-ready for deterministic non-destructive verification. SH-02.8 remains HELD and is exercised only as a negative-control capability state; no rollback/restore activation is inferred.

## Current generation readback — PR #1306 → #1308

- PR #1306 Human-merged the Single-Writer convergence and #1298 regression coverage. The current runtime contract is `self-healing-contract/1.2.0`; the current fault suite is `sh-02.10-fault-convergence/1.3.0` with seventeen required scenarios.
- PR #1307 and PR #1308 removed the two stale full-suite tests that still asserted the superseded second PR-body writer. They did not reintroduce workflow or runtime mutation authority.
- `CURRENT_MAIN=05892a28d179316962c19bd52843c2e0e3cfbc9d` completed main CI run #5836 successfully, including the full test suite, production build, provenance and verified Render deployment.
- Container Security run #2838 completed successfully, including the HIGH/CRITICAL CVE gate and signed private GHCR exact-digest publication.
- Post-Merge Production Correlation run #242 completed successfully.
- Render production readback is live on the same exact SHA `05892a28d179316962c19bd52843c2e0e3cfbc9d`.
- Open PRs #1299, #1300 and #1304 do not contain current main; the leading PR Decision Evidence Reconciler correctly refuses baseline mutation for those stale heads. This is fail-closed behavior, not a second writer or a failed convergence of the current generation.

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
| FRONTEND_OPTIONAL_INIT_REJECTION | frontend optional initialization + selfHealingContract | fail-closed containment; observe/escalate; no generic retry |
| STALE_TEST_EXPECTATION_AFTER_RUNTIME_CONTRACT_CHANGE | PR autofix + selfHealingContract | deterministic allowlisted expectation repair; one attempt; exact-head readback |
| PR_GOVERNANCE_V18_METADATA_OMISSION | PR Decision Evidence Reconciler + selfHealingContract | reconstruct only missing required v1.8 Technical-Evidence metadata from canonical banner/trusted scope/durable claim evidence; one attempt; ambiguity fails closed; exact-head/base Governance readback |
| PR_GOVERNANCE_V18_HYBRID_BASELINE_SECTION | PR Decision Evidence Reconciler + selfHealingContract | exact #1298 shape: v1.8 machine-baseline details with canonical NOT_RUN sentinel plus trailing legacy `## 7`; repair to exactly three H2 sections and one canonical baseline block; no second writer; ambiguity fails closed |
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

Hosted repository validation and exact-SHA production identity are now read back for `main@05892a28d179316962c19bd52843c2e0e3cfbc9d`. SH-02.10 still must not be represented as terminal PASS until the required fresh independent QM and Security assurance is read back. SH-02.11 production activation remains blocked until both owner-correct assurance returns exist.


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


## Observed PR #1297 Governance metadata regression

PR #1297 failed the canonical v1.8 Governance validator even though its visible
three-section structure and production-baseline block were valid. The failing
validator evidence was:

`PR #1297 enthält keine gültige Prioritätsbewertung (P0–P3) der Vorlage v1.8.0.`

The root cause was a contract gap between structure repair and semantic metadata
validation. `repairCurrentDecisionBodyStructure()` treated a body as
`already-canonical` when the three level-two sections and baseline cardinality
were correct. It only normalized the historical `P0-HIGHEST` token and did not
materialize missing v1.8 Technical-Evidence fields such as `Priorität`,
`Versionsimpact`, `Version-Manager-Check`, the explicit Human/CODEOWNER merge
gate, or durable claim-path evidence.

The bounded fix is:
`REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT -> RECONCILE_PR_GOVERNANCE_METADATA`.

The action remains SH-1, idempotent and limited to one attempt. After PR #1306, all PR-body repair/baseline/Decision-Evidence mutation delegates to the single leading `PR Decision Evidence Reconciler` writer. `PR Production Baseline Auto-Refresh` is a compatibility observer/relay and has no PR-body write authority. Missing priority
and version impact may be reconstructed only when the existing canonical v1.8
banner resolves them unambiguously. PR class comes from trusted scope
classification, durable Claim evidence only from the actual branch diff, and a
missing Version-Manager state is materialized as `NOT_RUN`, never PASS.
Conflicting or ambiguous metadata remains fail-closed.

Regression coverage reproduces the #1297 body shape and preserves Decision/Evidence ownership, required checks, Human/CODEOWNER merge authority and held SH-2/SH-3 actions. PR #1306 additionally fixes the #1298 hybrid v1.8 baseline shape at its formation source, removes the legacy `## 7` fallback for v1.8 and converges all PR-body self-healing through one writer.


## Historical concurrent-writer correlation — PR #1302

After PR #1305 was opened, the canonical Decision/Evidence reconciler discovered
PR #1302 as a concurrent writer of
`docs/projects/operations/work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md`.

This slice therefore restored that work-package path exactly to
`CURRENT_MAIN@444393b1b1db9dfd95ef6aae42261bf0085663e3` and removed it from the
exclusive claim. PR #1302 remains the active writer for the SH-02.10
current-main/status projection.

The implementation slice retains only code, tests, its exclusive claim and this
dedicated evidence document. Changed-file overlap is therefore removed. A
semantic dependency remains: PR #1302's terminal/status statements must be
re-correlated to the then-current SH-02.10 implementation generation before its
own merge if this implementation lands first. No merge order or PASS state is
manufactured by this evidence.
