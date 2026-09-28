# CAPITAL-AI-OPS — Canonical Roadmap

**Baseline:** `main@f61df72e717399e783824d0b12190f2e7f6a96fd`
**Project:** `CAPITAL-AI-OPS`  
**Folder:** `docs/projects/operations/`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-06, PVC-07, PVC-08, PVC-18`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-26 — CURRENT_MAIN `f961ce6c9a15a4c627b7e6a21adf840f1584b5e9`; SH-02.13 implementation correlates merged code/test evidence with owner work-package documentation, the leading Live Roadmap and claim lifecycle; #1463/#1466/#1467 OPS closure drift is reconciled without fabricating provider PASS, while #1465 remains an owner-correct GOV handoff.
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

`historical/non-terminal != active`

This file remains a temporary project execution projection until the separately requested Roadmap-removal Pull Request after completion of the Social Roadmap. Archive/superseded copies, old chat/work context, prior branch state and historical non-terminal markers are ledger/evidence only. A work item is executable only when it is currently active under `/AGENTS.md@CURRENT_MAIN` with a canonical identity or freshly defined/re-authorized by the Human/Owner in the current interaction. Terminal history is retained as ledger and is not reopened.

## Current execution priority — Owner-directed GitHub management inventory 2026-09-24

### OPS-GITHUB-MANAGEMENT-SETTINGS-INVENTORY-01

**State:** `FOLLOW_UP_ON_BRANCH / READ_ONLY / HUMAN_MERGE_REQUIRED`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08, PVC-18`  
**Source package:** `work-packages/OPS_GITHUB_MANAGEMENT_SETTINGS_INVENTORY_01_2026-09-24.md`  
**Follow-up:** `work-packages/OPS_GITHUB_SETTINGS_RUNNER_GROUPS_READBACK_FIX_2026-09-27.md`

The four-scope adapter implementation merged via PR #1399. Manual validation
run #18 on CURRENT_MAIN `f961ce6c9a15a4c627b7e6a21adf840f1584b5e9` reached all
independent reads, but the Enterprise runner-group response parser expected
`groups` instead of GitHub's documented `runner_groups` field; the settings
inventory and dependent storage report failed closed. The bounded correction is
on `operations/github-enterprise-runner-groups-20260927`; provider settings
remain unchanged and no provider mutation is introduced. Close only after exact
head checks, Human/CODEOWNER merge, and a fresh successful main workflow run.

### OPS-CI-VALIDATION-CLASSIFICATION-V2

**State:** `READY_AFTER_SETTINGS_INVENTORY / INDEPENDENT`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-06, PVC-07`  
**Source package:** `work-packages/OPS_CI_VALIDATION_CLASSIFICATION_V2_2026-09-24.md`

Reduce PR runner work through finer deterministic classification under the existing
`none/focused/full` planner. Main pushes and protected/high-risk/global-trigger
changes remain FULL. Persistent Render self-hosted runner deployment is not selected
as the initial optimization because it adds paid compute plus a larger persistent
trust boundary; ephemeral/JIT feasibility remains measurement-gated.

## Current execution priority — Owner-directed Enterprise Actions hardening 2026-09-24

### OPS-GITHUB-ENTERPRISE-WORKFLOW-PERMISSIONS-WRITER-01 — Bounded Enterprise PR-approval writer

**State:** `IMPLEMENTATION_ON_BRANCH / PROTECTED_PROVIDER_MUTATION_NOT_EXECUTED`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08, PVC-18`  
**Source package:** `work-packages/OPS_GITHUB_ENTERPRISE_WORKFLOW_PERMISSIONS_WRITER_01_2026-09-24.md`

Run `#35999363977` established complete Enterprise Actions readback and observed
`default_workflow_permissions=read` plus
`can_approve_pull_request_reviews=true`. Fresh Human Owner direction authorizes
one bounded writer capability whose only permitted transition is
`read/true -> read/false`. The writer must fail before mutation if the default
permission is not already `read`, expose no raw REST proxy, use no user-supplied
provider values and require exact post-write readback. Provider mutation cannot
occur from the PR branch and Human/CODEOWNER merge remains mandatory.

## Current execution priority — Human-directed Merge Cadence 2026-09-23

### OPS-MERGE-CADENCE-01 — Dual-Mode 5-Merge Deploy / 10-Merge Version Runtime

**State:** `ACTIVE / CADENCE_5_10 / CURRENT_MAIN_DERIVED`  
**Baseline:** `cadenceEpoch=PR #1336 / merge f340654adab7198c13fa82cc8f177846c1c66ece`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-06, PVC-07, PVC-08`  
**Dependency:** cadence authority is active on CURRENT_MAIN; live ordinal/deploy/version progress is derived read-only by `/api/roadmap/cadence`.

Fresh Owner direction requires the productive chain to be prepared before the Governance activation merge. This slice therefore makes the existing CI/Post-Merge/Exact-SHA-Recovery/Release-Gate paths dual-mode rather than creating replacements. Pre-v1.1 authority preserves per-main-merge deployment; after the fixed cadence contract becomes CURRENT_MAIN, normal deployment occurs at 5/10/15/... PR-merge ordinals and the next PR at ordinal 9 mod 10 receives the strict next PATCH through the existing registered PR Autofix writer and Release Version Gate.

CI, PR synchronization, Self-Healing continuation and the read-only live cadence projection remain bound to latest CURRENT_MAIN. Healthy expected Production lag below a due 5-merge boundary is DEPLOYMENT_QUEUED and cannot trigger Exact-SHA Recovery. Real due/failed/unhealthy/diverged Production remains fail-closed drift.

Detailed package: work-packages/OPS_MERGE_CADENCE_01_2026-09-23.md.

**Exit:** dual-mode implementation is Human-merged and verified before GOV #1336 activation; no second controller/registry exists; FE can consume the read-only /api/roadmap/cadence projection in an owner-correct successor.

## Terminal Version-Management evidence — Artifact Version Inventory

### OPS-ARTIFACT-VERSION-INVENTORY — VAI-01..04

**State:** `DONE_MAIN / TERMINAL / ISSUE_1429_CLOSURE_READY`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-06`; supporting `PVC-04, PVC-07`  
**Source packages:** `OPS_ARTIFACT_VERSION_INVENTORY_VAI01_2026-09-24.md` through `OPS_ARTIFACT_VERSION_INVENTORY_VAI04_2026-09-25.md`

VAI-01 (#1430), VAI-02 (#1443), VAI-03 (#1445) and VAI-04 (#1456) are Human/CODEOWNER-merged. The repository now has deterministic tracked-artifact classification, producer/consumer fingerprint evidence, Artifact-Version identity in the existing Self-Healing evidence generation and bounded drift routing onto the existing `RECONCILE_REPOSITORY_PROJECTION` writer. Unknown, ambiguous or unclassified evidence remains fail-closed `OBSERVE_ONLY`. VAI-03/VAI-04 stale claims are released by the #1429 closure slice; no second version or Self-Healing authority is introduced.

## Current execution priority — Owner-directed Self-Healing 2026-09-20

### SH-02 Issue #1355 — TypeScript literal-union drift intake

**State:** `DONE_MAIN / TERMINAL / OBSERVE_ONLY`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-08, PVC-18`

The existing PR Autofix classifier recognizes the exact PR #1352 `TS2322`
literal-union widening family without enabling generic code mutation.
Disposition is `BLOCKED_NOT_PROVEN` / `OBSERVE_ONLY`; all unknown TypeScript
failures stay blocked. PR #1380 is Human/CODEOWNER-merged as `67f9be45e41d78ca5d5c58f9be860d1887e4afad`; the classifier extension is current-main behavior and remains `OBSERVE_ONLY / BLOCKED_NOT_PROVEN` with no source-repair authority.


### SH-02.11 activation update — 2026-09-23

**State:** `ACTIVE / RETRY_SAFE_OPERATION_ENABLED`  
**Activation evidence:** merged PR #1330 plus independent Security/QM assurance; broader protected SH-2/SH-3 actions remain HELD.

- Security assurance PR #1316 and QM assurance PR #1318 are Human/CODEOWNER-merged and bind the same pre-activation implementation generation.
- `RETRY_SAFE_OPERATION` transitions from `HELD` to `ENABLED` only for `READ_ONLY` and explicitly `IDEMPOTENT` operations owned by `SUPERVISOR_SAFE_RETRY`.
- `DEPENDENCY_NATIVE` and `NO_AUTOMATIC_RETRY` remain outside generic retry ownership.
- `SIDE_EFFECTING` and `PROTECTED` operation classes still fail closed before invocation.
- Budget remains `maxAttempts=3 / cooldownMs=500 / timeoutMs=10000`; kill switch remains `self-healing.safe-retry`; verification probe remains `dependency-operation-readback`.
- `QUARANTINE_WORK_ITEM`, `RUNTIME_PROCESS_RECYCLE`, `REDEPLOY_EXACT_SHA` and `PROTECTED_ROLLBACK_RESTORE` remain `HELD`.

### SH-02.12 — Routed Issue Auto-Fix

**State:** `HELD / SH-02.12B IMPLEMENTED_ON_BRANCH / NO_EXECUTOR`.

Already present on CURRENT_MAIN:
- Governance issue router and `READY_FOR_PROJECT_EXECUTION` dispatch;
- SH-0 `VERIFY_ISSUE_PROJECT_DISPATCH`;
- SH-1 `RECONCILE_REPOSITORY_PROJECTION` via existing `repository.pr.autofix` for narrowly allowlisted reproducible repository-projection/expectation drift;
- SH-02.12A TypeScript literal-union intake is terminal/observe-only through PR #1380.

SH-02.12B on this branch adds only a read-only `self-healing-issue-repair-eligibility/1.0.0` contract. It correlates canonical route generation, fresh CURRENT_MAIN, Project/Owner/PVC, exact registered repair evidence, path allowlist, writer overlap and protected-mutation boundaries. An eligible result may only derive an owner-correct bounded work package; `mutationAuthorized=false` and `executionAuthority=false` remain mandatory.

Still not present and therefore not claimed as active:
- no generic `Issue -> code remediation -> branch -> PR` executor;
- no `repository.issue.autofix` capability;
- no permission to execute free-form Issue body/comment/attachment/link instructions;
- no new repairer, writer or protected provider capability.

Any later SH-02.12 execution capability still requires fresh CURRENT_MAIN + canonical Owner/PVC + reproducible repository evidence, bounded branch-only remediation, exact-head verification, protected-mutation exclusion and Human/CODEOWNER merge authority.

### SH-02.13 — Post-Merge Roadmap Closure Correlation

**State:** `IMPLEMENTATION_ON_BRANCH / CURRENT_MAIN_CORRELATED / HUMAN_MERGE_REQUIRED`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-04, PVC-18`  
**Source package:** `work-packages/OPS_SH02_POST_MERGE_ROADMAP_CLOSURE_2026-09-24.md`

After each Human/CODEOWNER merge, the existing post-merge convergence path shall
re-read exact `CURRENT_MAIN`, bind the merged PR to its canonical Roadmap/work
package and verify the package exit evidence. Fully proven packages become
`DONE_MAIN / TERMINAL`; partial or downstream-evidence-gated packages remain
open. The live Roadmap may project the verified state immediately, while any
persistent Markdown/work-claim terminalization remains branch-only and requires
ordinary Human/CODEOWNER merge. No second Roadmap writer, scheduler, registry or
direct-main mutation path is introduced.

**Exit:** deterministic tests cover full/partial/ambiguous/foreign/evidence-gated
closure, idempotent replay and recursion prevention; persistent reconciliation
reuses the canonical repository-projection lane and remains Human-merge gated.


**Current implementation materialization:** pure contract `src/platform/Supervisor/postMergeRoadmapClosure.ts` plus the existing post-merge continuation workflow. The workflow remains read-only for repository contents and may write only non-authorizing drift/handoff Issues. It never checks out candidate code, writes `main`, approves or merges.

**Bootstrap reconciliation:**
- PR #1463 / OPS Security Posture: repository implementation merged; `MERGED_MAIN / EVIDENCE_GATE` because provider readback exits remain open.
- PR #1466 / OPS Auth Session: exact-head required evidence PASS + Human merge; `DONE_MAIN / TERMINAL`.
- PR #1465 / GOV Release Authority: merged evidence observed; package/claim closure is foreign-owner and remains `OWNER_CORRECT_HANDOFF`.
- PR #1467 / OPS Supabase Ledger: repository reconciliation is merged; `MERGED_MAIN / EVIDENCE_GATE` because the explicit Supabase Preview check was observed `skipped` and therefore is not proven.


### OPS-AUTH-RENDER-MGMT-TOKEN-RECOVERY-01 — Supabase Auth control recovery

**State:** `IN_PROGRESS / AUTH_CONTROL_PLAN_CONSTRAINT_REMEDIATION`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08`  
**Source package:** `work-packages/OPS_AUTH_RENDER_MANAGEMENT_TOKEN_RECOVERY_2026-09-23.md`

Production runtime recovery and the explicit Management API control host are merged. PR #1349 materialized the plan-aware recovery and platform version 0.6.1. Remaining owner-correct completion is provider readback of the available Auth controls, explicit `UNAVAILABLE_BY_PLAN / ADR-0031` evidence for the Pro-only leaked-password control when applicable, the sequenced database migration/advisors, and the registration user-test handoff. No Billing/plan mutation is implied.

### OPS-RENDER-MCP-AI-DEBUG-01 — Hosted Render MCP build debugging

**State:** `HELD / REPOSITORY_READY / HOST_ASSURANCE_PENDING`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08`  
**Source package:** `work-packages/OPS_RENDER_MCP_AI_DEBUG_2026-09-24.md`

Repository configuration is merged through PR #1342. Human OAuth plus read-only host/workspace/service readback remains required before external-host assurance can become complete. Repository readiness does not imply provider authorization or mutation authority.

### OPS-LIVE-ROADMAP-CURRENT-MAIN-STATE-01 — Application-wide CURRENT_MAIN Roadmap projection

**State:** `DONE_MAIN / PR_1356_MERGED`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08`  
**Source package:** `work-packages/OPS_LIVE_ROADMAP_CURRENT_MAIN_STATE_2026-09-24.md`

The existing `/api/roadmap` runtime is extended with one exact-SHA-bound current-state projection so the public Roadmap can follow latest CURRENT_MAIN even while healthy Production intentionally lags between five-merge deployment boundaries. Canonical project Roadmaps remain the task sources; this runtime is read-only and non-authorizing.

### OPS-ROADMAP-BRANCH-EVIDENCE-01 — Live Branch Readback

**State:** `DONE_MAIN / PR_1479_MERGED / TERMINAL`  
**Owner/PVC:** `CAPITAL-AI-OPS / PVC-02, PVC-08`  
**Source package:** `work-packages/OPS_ROADMAP_BRANCH_EVIDENCE_2026-09-28.md`

Fresh Human/Owner direction adds a subordinate `GET /api/roadmap/branches` projection. It reads repository branches and GitHub comparisons against one exact CURRENT_MAIN and returns only descendants with `behindBy=0` and `aheadBy>0`. Project Owner/Folder/Label are resolved from the canonical branch slug mapping; unresolved branch ownership remains explicit. The projection is read-only, cached, non-authorizing and cannot activate work, mutate branches or expose provider credentials. PR #1479 is Human/CODEOWNER-merged as `8862857f962a681c7853268e15822c719654412f`; FE successor PR #1476 is also merged. Fresh closure readback binds the terminal state to CURRENT_MAIN `f0b9b9f3368b3c9cc241fadef3100af89dc5256a`.

SH-02.0..02.7, SH-02.9A and SH-02.9 are Human-merged on main; SH-02.9 post-merge convergence is terminal through PR #1271 (`886486e057fea2fe833104b23f7a36d05d0b9b58`). SH-02.10 is now terminal for implementation generation `bc7edc096450be6b368ea706b97479567cc6ee55`: Security PR #1311 and QM PR #1312 independently verified that same generation and are Human/CODEOWNER-merged. Current main `db4ad93bb3bac7d4f31242b7f74f8f300d24e757` completed main CI #5849, Container Security #2851 and Post-Merge Production Correlation #246 successfully, and Render deployment `dep-daptgsad0e5s73acahjg` is live on the same exact SHA. The currently enabled action set is limited to five bounded SH-0/SH-1 actions with one-attempt budgets, kill switches and verification probes; all generic retry/quarantine plus SH-2/SH-3 actions remain HELD. SH-02.11 remains `DEPENDENCY_READY / ACTIVATION_NOT_STARTED`. The current child `SH-02.11A` prepares only `RETRY_SAFE_OPERATION`; it remains `HELD` until fresh independent Security and QM assurance passes for the exact pre-activation generation.

Current Self-Healing semantics resolve through `/AGENTS.md@CURRENT_MAIN`, `CAPITAL-AI-ASH-01` and `self-healing-contract/1.2.0`. The predecessor SH-01 rule set is archived at `docs/archive/projects/operations/superseded/OPS_08_B_SH_01_SELF_HEALING_READINESS_2026-09-10.md` and has no execution authority.

Detailed package: `work-packages/OPS_08_B_SH_02_AUTONOMOUS_SELF_HEALING_PLATFORM_2026-09-20.md`.

### Existing OPS backlog context

**Priority rule:** while a dependency-ready SH-02 slice exists, `OPS-08-B-SH-02` is the highest executable OPS priority. The backlog below remains valid but is not selected ahead of SH-02 unless Self-Healing is genuinely blocked by a real dependency.

1. `OPS-PR900-06 — Security owner returns` is the next normal executable OPS Roadmap evidence-return slice only if fresh current-main correlation still confirms that exact active identity. `OPS-PR900-05` repository materialization is Human-merged via PR #980; its deterministic evidence contract is ready while real live SLO/incident/RPO/RTO/vendor measurements remain explicitly open and must not be synthesized.
2. `OPS-02-CI-01 — Build/Test Cost & Scope Reduction` is repository-integrated for the current bounded slices: PR #988 merged the `NONE / FOCUSED / FULL / REUSE` cost-profile policy and PR #996 merged snapshot-bound stale-event/concurrency hardening. Remaining hosted cost/race observations stay real-evidence-only; no unobserved race or saving is promoted to PASS. Fresh Owner direction activates child `OPS-02-CI-01E — ChatGPT Preflight & Runner-Minute Convergence` at P0 for a machine-readable pre-PR evidence contract and a three-day full-lifecycle runner-minute baseline. This child does not change Required Check, Security, QM, Governance, Human or CODEOWNER semantics; P1 workflow reduction waits on the measured baseline.
3. `OPS-PR900-03B` remains historical `BLOCKED / NOT_STARTED — PROVIDER_HOST / EFFECTIVE-GRANT / READBACK GAP` until fresh current-main correlation explicitly revalidates it. PR #970 and PR #982 put the Reader contract and bounded GitHub Work-Management adapter on main, but no separately authorized provider host with Finance-only effective grants plus real Projects/Fields, Issue Types/Fields, Milestone and Wiki `Read -> Write -> Readback` evidence exists yet.
4. `OPS-PR900-04` repository preparation is current: 04A and 04B are merged. GitHub App creation/installation, permission grants, repository selection, OAuth/MCP connection changes, Vault/private-key provisioning and any PAT provisioning remain `HELD_EXTERNAL_OWNER_AUTHORIZATION` until a separate explicit Human/Owner request authorizes the exact protected mutation.
5. Historical unmerged/diverged OPS branches are search input only and are not successor bases. In particular, `agent/operations-roadmap-current-main-sync-20260916`, `agent/operations-roadmap-post996-sync-20260916`, `agent/operations-github-status-sync-20260916` and `agent/operations-ops18-main-projection-20260915` are not used as current-main integration bases.

At this reconciliation point PR #1001 is terminal/Human-merged into current main. Its historical execution-model text is evidence only and does not create a continuation trigger, chat wake-up, task resurrection or protected external-mutation authority. Provider-host setup remains a distinct Human/Owner-authorized action and is not aggregated into repository documentation work.

## PR #900 / #901 work packages

### OPS-PR900-01 — Event-driven development chain
Correlate the Option-C/project-listener work against current main and applicable authority. Define trigger payloads, deterministic state transitions, idempotency/replay, owner-correct evidence and events; prefer event-native triggers to polling.

**Exit:** one current listener/event flow; no duplicate active listener; every event records source, owner/PVC and exit evidence without becoming task-activation authority.

### OPS-PR900-02 — Deterministic version/release/deploy identity
Complete Stage-2 PVC-06/PVC-07 validation, reconcile version-rule and Release Version Gate semantics, and prove exact-SHA promotion plus post-deploy identity. Render native Auto Deploy remains off unless separately authorized.

**State:** `MERGED / IMPLEMENTED_ON_MAIN / EXACT_SHA_PRODUCTION_IDENTITY_VERIFIED` via Human-merged PR #977 (`merge SHA c89add85ca43a31bff61a27b33eef49f891ffba4`).

**Current result:** the terminal PR #977 evidence proved one exact snapshot across successful main CI/build/test/supply-chain workflow, exact-SHA Render deploy-hook target and post-deploy commit/health verification. Later current-main commits do not reopen that terminal package; each future promotion requires its own exact-SHA evidence. `package.json#version` remains the sole platform-version authority.

**Authority boundary:** the verified promotion/readback proves identity and health for the executed snapshot. It does not grant automatic Release Acceptance, tag, merge, future deployment or other protected production-mutation authority.

**Exit:** `PASS` — one exact snapshot has truthful successful checks, deterministic version/release agreement and production identity evidence.

### OPS-PR900-03 — GitHub Enterprise capability matrix
Complete read/write capability coverage for Enterprise controls, custom properties, efficient Actions/artifact/cache usage and repository integration. Governance/Security/QM constraints remain authoritative.

**Exit:** capability matrix distinguishes available, unavailable, read-only and protected-mutation paths with evidence.

#### OPS-PR900-03A — GitHub Work-Management Inventory & Package Materialization
Inventory the currently connected GitHub work-management surfaces and materialize the coordination-only contract without duplicating Roadmap, Project/PVC, platform-version, Governance, Security, Release, Deployment, PR or merge authority.

**State:** `MERGED / CAPABILITY_GAP_VERIFIED` via Human-merged PR #950 (`merge SHA 1ef0b91ca6b3f61f23f8f1e449ae0deadf6b1ff3`).

**Provider vs connector capability:** Finance repository metadata confirms GitHub-native Issues/Projects/Wiki feature availability where observed, while current connector capability remains a separate evidence class. Provider feature availability does not prove complete object-level inventory, mutation or readback through the connected execution surface.

**Exit:** `PASS` for 03A — requested metadata categories have a reproducible provider-versus-connector classification; no partial 03B pilot is represented as success.

Detail: `work-packages/OPS_PR900_03A_GITHUB_WORK_MANAGEMENT_2026-09-15.md`.

#### OPS-PR900-03B — GitHub Work-Management Pilot
Sequence: `Taxonomy -> Issue Intake -> Organization Project -> Milestone -> PR -> Done -> Wiki Navigation`.

**State:** historical `BLOCKED / NOT_STARTED — PROVIDER_HOST / EFFECTIVE-GRANT / READBACK GAP`; not active by status alone.

**Current blocker:** repository-side prerequisites have advanced but do not constitute a live authorized provider path. PR #970 materialized the least-privileged Reader contract and PR #982 materialized the bounded repository adapter that complements the official GitHub MCP Server for Milestone object management and navigation-only Wiki read/write/readback. Any future execution still requires fresh canonical activation plus one separately authorized execution host, real effective grants, Finance-only repository scope and reproducible provider `Read -> Write -> Readback`.

No connector, OAuth, permission, GitHub App, Vault or provider integration mutation is implied by this Roadmap state.

#### OPS-PR900-03C — GitHub Enterprise API Authority & Capability Matrix
**State:** `MERGED / REVALIDATED / PROVIDER_MUTATION_NOT_AUTHORIZED` via Human-merged PR #962 (`merge SHA 770756209b6248395ce4eedce63981355728004f`).

Provider-native API capability, connected execution-surface capability and effective credential grants remain separate evidence classes. Effective Enterprise/Organization admin grants remain `NOT_PROVEN` until real provider readback exists. Reader and Controller capabilities remain separate and deny-by-default. No provider write is authorized by this slice.

### OPS-PR900-04 — Multi-LLM gateway / OAuth2 / MCP convergence
Correlate existing gateway foundations; select/reuse one canonical architecture; retire or justify duplicates. Protected provider operations must be least-privileged, attributable and auditable; migration requires rollback/compatibility evidence.

**State:** `REPOSITORY_PREPARATION_READY / PROVIDER_SETUP_HELD` — 04A and 04B are Human-merged on main; protected provider-host/credential setup remains separately authorized.

#### OPS-PR900-04A — GitHub App / MCP Reader Setup
**State:** `MERGED / READER_CONTRACT_READY / PROVIDER_MUTATION_HELD` via Human-merged PR #970 (`merge SHA 7f680c432dbf172a5b672ae0a3bd521b36b11dbe`).

The normal target identity is a GitHub App with short-lived installation tokens behind the CAPITAL-AI MCP gateway. Reader capabilities are explicitly allowlisted. No Controller/write grant, universal admin PAT, GitHub credential in model context or speculative `.codex` GitHub endpoint is introduced. Protected setup requires a separate explicit Human/Owner request.

#### OPS-PR900-04B — GitHub Work-Management Gateway Adapter
**State:** `MERGED / REPOSITORY_ADAPTER_READY / PROVIDER_HOST_HELD` via Human-merged PR #982 (`merge SHA 89d10a14830285ca8d7abd344f6f0da7b3b4c399`).

Projects, Issue Types, Issue Fields and normal Issue lifecycle operations remain delegated to the official GitHub MCP Server. The bounded CAPITAL-AI adapter adds only Finance-bound Milestone object inventory/create/update/readback and generated navigation-only Wiki read/write/readback. Real gateway/Vault-host provisioning and effective-grant readback remain separately authorized.

### OPS-PR900-05 — Production observability/readiness
Define measurable SLI/SLO, incident, release, post-deploy and telemetry evidence; integrate vendor export/readback only when authorized. PostHog/provider telemetry must respect SEC/privacy constraints.

**State:** `MERGED / EVIDENCE_CONTRACT_READY / LIVE_MEASUREMENT_OPEN` via Human-merged PR #980 (`merge SHA b95f9b74a01b6d0e1228a8d5291b0fb54ea80489`).

The canonical package defines a deterministic evidence model over existing liveness/readiness, exact-SHA release/deployment identity, structured request telemetry and incident evidence. Numerical SLO targets/windows, measured incident/RPO/RTO drills and vendor telemetry remain `NOT_PROVEN` until real observations exist. No synthetic readiness percentage/PASS or provider mutation is inferred from repository completion.

### OPS-PR900-06 — Security owner returns
Return reproducible evidence for CORS composition, CSP reporting/strict-CSP promotion, unsupported-method denial, auth audit coverage, deployed supervisor behavior, ULS Stripe→auth.users→subscriptions lineage, recovery/RPO/RTO and demo-billing isolation where owned by OPS.

**Historical state:** prior projection marked this `NEXT_EXECUTABLE / PRIORITY_1`. That marker does not activate work. Execution requires fresh current-main confirmation of this exact identity.

## Historical baseline (pre-2026-09-13) — non-active ledger

| Workstream | PVC | Historical state |
|---|---|---|
| OPS-02 Controlled Implementation | PVC-02 | ACTIVE in prior projection; not active by status alone |
| OPS-04 Supervisor | PVC-04 | PARTIAL — post-deploy evidence open |
| OPS-06 Version Management | PVC-06 | deterministic materialization integrated |
| OPS-07 Release Management | PVC-07 | PARTIAL — broader release evidence may remain |
| OPS-08 Production Operations | PVC-08 | PARTIAL — measured operational evidence may remain |
| OPS-18 EventMesh / Traceability | PVC-18 | PARTIAL |
| OPS-POST851-EDGE-01 | PVC-02/08 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-OBS-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-PI-01 | PVC-02/18 | IMPLEMENTED_ON_MAIN / EVIDENCE_READY |
| OPS-POST851-ID-02 | — | historical BLOCKED state |
| OPS-08-SEC-07 Recovery / RPO / RTO | PVC-08 | harness on main; measured evidence may remain |
| OPS-02-SEC-06 Entitlement inventory | PVC-02 | parent complete; child/SEC evidence may remain |
| OPS-02-CI-01 Build/Test Cost & Scope Reduction | PVC-02 | integrated via PR #988 and PR #996; child OPS-02-CI-01E ACTIVE / P0 for preflight + three-day lifecycle telemetry |
| DR-03 | — | historical blocked state |
| OPS-08-B-SH-01 Self-Healing readiness | PVC-08 | ARCHIVED / NON-AUTHORIZING — `docs/archive/projects/operations/superseded/OPS_08_B_SH_01_SELF_HEALING_READINESS_2026-09-10.md` |

Invariants: Render native Auto Deploy remains off; productive M10 is `RETIRED / OFF`; new provider capability/credential provisioning remains separately authorized, while eligible mutations already inside an authorized workflow/provider capability boundary follow `/AGENTS.md@CURRENT_MAIN`; GitGuardian health/audit is management evidence, not a second scanner.

## Dependencies
GOV authority, QM gate classification, SEC/COMP verification, CLIENT request boundary, FINTECH child returns. PVC-09..11 no longer route to a separate DATA project.

## Project exit gate
One active OPS roadmap; active work is selected only from current canonical state or fresh Human/Owner direction; historical/non-terminal state never self-activates; repository state distinguishes merged materialization from open live/provider evidence; deployment/provider mutation is never inferred from repository implementation.
