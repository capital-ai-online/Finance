# CAPITAL-AI-DOC — Canonical Roadmap

**Project:** `CAPITAL-AI-DOC`  
**Folder:** `docs/projects/documentary/`  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-15 — current-main re-correlation after PR #924; valid WP-DOC-13 timeline delta folded; WP-DOC-16/17 resync dispositions synchronized  
**Baseline:** `main@86952c6ff3d6a287fa20d6d7f1ed5cf9b0d71a04`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only. PR #902 closed with zero effective diff and contributes no executable Documentary work package.

The historical branch `agent/documentary-roadmap-timeline-20260914` is `STALE / SUPERSEDED_AS_EXECUTION_WRITER` for current execution because it is based on an older main and carries only a Documentary Roadmap delta. Its valid WP-DOC-13 semantic correction is folded into this fresh current-main branch. The historical branch is not deleted or rewritten and remains evidentiary only.

The pre-sync branches `agent/documentary-plugin-extension-contract-20260915`, `agent/documentary-consumer-idempotency-evidence-20260915` and `agent/documentary-roadmap-wp16-wp17-status-20260915` are also evidentiary only after main advanced. Current PR-readiness uses the fresh resync branches named below.

## PR #900 / #901 normalized work packages

Timeline semantics: `NOW` = executable on current evidence, `NEXT` = after the named gate, `FOLLOW-ON` = downstream package, `CONDITIONAL` = explicit trigger required, `CONTINUOUS` = maintained obligation, `DONE` = terminal ledger. These are sequencing labels, not calendar deadlines.

### DOC-CARRY-01 — Existing non-terminal Documentary backlog
**Goal:** Preserve all non-terminal Documentary Engine, provenance, hygiene, knowledge, evidence and document-generation work without reopening terminal history.  
**Scope:** Documentary-owned backlog and owner-routed dependencies.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`.  
**Dependencies:** all projects as evidence sources; GOV authority; OPS execution; SEC/QM verification where applicable.  
**Timeline:** `CONTINUOUS`.  
**Gate:** each carried package retains its own current-main state and exit gate.  
**Exit criterion:** no non-terminal Documentary work is lost and no foreign work is marked complete by DOC.  
**State:** `ACTIVE CARRY-FORWARD`.

### DOC-PR900-01 — Source-chat closure completion
**Goal:** Complete source-chat coverage and terminal closure decisions while preserving every valid semantic delta.  
**Scope:** source-chat evidence, Owner/PVC routing and closure decisions only.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`.  
**Dependencies:** source-specific target owners for unresolved implementation.  
**Timeline:** `CONTINUOUS / NEXT` relative to source-specific evidence.  
**Gate:** each source is correlated against then-current main and existing preserved evidence.  
**Exit criterion:** `UNIQUE CONTENT NOT YET PRESERVED = NONE` for each closed source and no foreign work is marked complete by DOC.  
**State:** `ACTIVE / SOURCE-BY-SOURCE`.

### DOC-PR900-02 — Project-roadmap return flow
**Goal:** Return derived work packages into the canonical owning project roadmaps and keep master consolidation non-authoritative.  
**Scope:** canonical `docs/projects/*/ROADMAP.md` execution projections; no foreign domain implementation.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03` for documentary coordination; each target Roadmap retains its own Primary Owner.  
**Dependencies:** current Project/PVC mapping, target project Roadmaps and open-writer correlation.  
**Timeline:** `DONE_CURRENT_SNAPSHOT`.  
**Gate:** all target Roadmap work is based on one correlated current-main snapshot, changed-file readback is owner-local and open-writer overlap is resolved.  
**Exit criterion:** each canonical project `ROADMAP.md` is current for the evaluated snapshot; derived master state never overrides project truth.  
**State:** `DONE_CURRENT_SNAPSHOT`; re-run correlation after any new main/open-writer change before PR readiness.

### DOC-PR900-03 — Draft-PR handoff boundary (F02)
**Goal:** Keep automated document/Draft-PR preparation bounded to an approval-ready handoff.  
**Scope:** Documentary-owned draft preparation and attributable handoff evidence.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`.  
**Dependencies:** current PR-creation authority and downstream Human/Owner gate.  
**Timeline:** `CONTINUOUS`.  
**Gate:** approved workflow reaches the handoff boundary without synthesizing approval.  
**Exit criterion:** attributable handoff evidence exists and downstream PR/merge/protected-mutation authorization remains explicit.  
**State:** `ACTIVE CONTROL BOUNDARY`.

### DOC-PR900-04 — Mutation audit evidence (F03)
**Goal:** Preserve durable attributable mutation authorization, attempt, outcome and readback evidence for Documentary-owned mutation workflows.  
**Scope:** audit evidence only; no secret disclosure and no foreign verification claim.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`.  
**Dependencies:** the applicable authorized Documentary mutation workflow and downstream readback.  
**Timeline:** `CONTINUOUS / FOLLOW-ON` after each authorized mutation attempt.  
**Gate:** a Documentary-owned mutation workflow is explicitly authorized and executed.  
**Exit criterion:** audit evidence is complete without exposing secrets or claiming foreign verification.  
**State:** `ACTIVE EVIDENCE OBLIGATION`.

### DOC-PR900-05 — Sidecar retirement after canonical fold
**Goal:** Maintain exactly one active project execution projection while preserving historical ledger material.  
**Scope:** dated active project roadmaps, pointer-only routing files and archive/superseded copies.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03` for documentary consolidation; target project truth remains owner-local.  
**Dependencies:** unique-content preservation and target Roadmap readback.  
**Timeline:** `FOLLOW-ON` after each canonical fold; terminal only when preservation is proven.  
**Gate:** unique content of a sidecar/pointer is demonstrably represented in the canonical target Roadmap or retained historical ledger.  
**Exit criterion:** dated active sidecars and pointer-only execution sources are absent while archive/superseded evidence remains discoverable.  
**State:** `MAINTENANCE / VERIFY-BEFORE-CLOSE`.

## Source-chat closure ledger (from PR #900 evidence)

| Source | Disposition | Owning follow-up |
|---|---|---|
| CHAT-002 Action/storage evidence | CLOSURE documented | OPS/DATA evidence owners |
| CHAT-003 Security CI/telemetry | CLOSURE documented | SEC/OPS/QM |
| CHAT-005 LLM gateway topology | CLOSURE documented | OPS-PR900-04 |
| CHAT-006 Plugin/OSS tools | CLOSURE documented | CLIENT-08 / GOV plugin-use / OPS |
| CHAT-013 OPS Stage-2 revalidation | CLOSURE documented | OPS-PR900-02 |
| CHAT-019 Frontend Bond consumers | CLOSURE documented | FE-PR900-02 |
| CHAT-033 GitHub connector Enterprise read | CLOSURE documented | OPS-PR900-03 |
| CHAT-031 / DELTA-017 SEC project-roadmap | preserved into SEC-PR900-* | CAPITAL-AI-SEC |

## Carried-forward baseline (pre-2026-09-13)

| Horizon | Work package | State |
|---|---|---|
| NOW | WP-DOC-13 GOV-DOC-007 unresolved reference | `IMPLEMENTED_ON_MAIN / ROADMAP_RECORRELATED / CURRENT-PASS TEST EXECUTION NOT RUN` |
| NEXT | WP-DOC-14 D8 Migration Execution contract & dry-run | branch-level evidence exists; main/PR status must be independently correlated before projection changes |
| LATER | WP-DOC-15 Documentary quality/SLO model | branch-level evidence exists; main/PR status must be independently correlated before projection changes |
| LATER | WP-DOC-16 Plugin extension model | `EVIDENCE_READY_ON_RESYNC_BRANCH / PR-HUMAN-MERGE PENDING`; existing Enterprise framework reused; no connector/registry mutation |
| CONDITIONAL | WP-DOC-17 Consumer retry/idempotency | `DEPENDENCY_HELD / NOT_APPLICABLE_FOR_IMPLEMENTATION`; no reproducible Documentary-local failure evidence; EventMesh remains OPS |
| CONTINUOUS | WP-DOC-02 lifecycle/maintenance | ACTIVE |
| CONTINUOUS | WP-DOC-03 Vocabulary/Knowledge/Wiki | ACTIVE BASELINE |
| DONE | WP-DOC-00..12 | HUMAN-MERGED (PRs #645–#866 sequence) |

### WP-DOC-13 — GOV-DOC-007 current-main correlation

**Goal:** Reconcile the Documentary roadmap with the actual current-main `GOV-DOC-007` implementation without rebuilding an already merged validator.  
**Scope:** current-main repository evidence for the bounded read-only `GOV-DOC-007` local-reference validator and its focused unit coverage; no new validator/runtime/version mutation.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`.  
**Dependencies:** `ESS-0012 — Documentation Governance`, `ESS-0012-CONTRACTS`, current Documentary Governance component.  
**Timeline:** `NOW` — roadmap/evidence synchronization only.  
**Gate:** current main contains the bounded validator and targeted unit coverage and merge provenance is attributable.  
**Exit criterion:** roadmap no longer claims GOV-DOC-007 is absent or awaiting reimplementation; any test result is reported only if actually executed on the evaluated snapshot.  
**State:** `IMPLEMENTED_ON_MAIN / REPOSITORY_READBACK_VERIFIED / TEST_EXECUTION_NOT_RUN_THIS_PASS`.

Current-main evidence at this baseline:

- Human-merged PR #916 is present in main history (merge commit `cc09689f4b9b24dc0d28ac7fc6bd4aa17075354d`).
- `src/platform/Documentary/Governance/Validators/GovDoc007Validator.ts` defines the bounded `GOV-DOC-007` v1.0.0 read-only `FileReference` validation.
- `tests/unit/documentaryGovDoc007Validator.test.ts` contains focused positive/negative/fail-closed coverage.
- `src/platform/Documentary/Governance/README.md` projects `GOV-DOC-007` as implemented while the broader ESS-0012 rule suite remains partial/incremental.
- the historical `agent/documentary-gov-doc-007-20260914` branch is no longer an active execution dependency; historical branch identity is evidence only and is not required for continuation.
- no current-pass unit test or hosted CI was executed for this roadmap-only re-correlation, so no fresh `PASS` is claimed.

This Documentary slice changes no component version, document-schema version, platform version, productive validator code or foreign authority.

### WP-DOC-16 — Documentary Plugin Extension Model

**Goal:** Materialize only the Documentary-local validation/projection boundary required by the existing Enterprise Plugin & Extension contracts, without introducing a second plugin registry, loader, provider or connector plane.  
**Scope:** `agent/documentary-plugin-extension-contract-resync-20260915` at head `28a219a6c5659a47167b3e185c587c5667b2edf2`; four changed files covering the Documentary extension contract, focused tests, architecture note and current-main evidence.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`.  
**Dependencies:** `ESS-0001-CONTRACTS` Chapter 13, `ADR-0010`, `ESS-0010`, existing Enterprise Registry and current reuse/plugin-use controls.  
**Timeline:** `LATER -> PR-CREATION GATE`.  
**Gate:** branch remains current-main-correlated, effective-change identity is reproducible, no parallel registry/provider/connector system is introduced, and separate Owner approval is obtained before PR creation.  
**Exit criterion:** bounded contract/evidence is Human/CODEOWNER merged and then-current main is re-read; until then `DONE_MAIN=false`.  
**State:** `EVIDENCE_READY_ON_RESYNC_BRANCH / PR-HUMAN-MERGE PENDING`.

Branch evidence states:

- only `VALID_FOR_REGISTRATION_REQUEST` or `BLOCKED` can be returned;
- `registryMutationPerformed=false`;
- `activationAuthorized=false`;
- `externalCapabilityAuthorized=false`;
- duplicate identity, unsafe path, foreign/dynamic code, implicit network/database capability and missing Security Review evidence fail closed;
- focused local TypeScript/behavior validation remains applicable to the byte-identical code/test payload; repository Vitest, project-wide TypeScript, Documentation Hygiene and hosted CI remain `NOT RUN` and are not represented as PASS.

### WP-DOC-17 — Documentary Consumer Retry / Idempotency

**Goal:** Add Documentary-local retry/idempotency hardening only when a reproducible Documentary-local failure justifies it; otherwise remain dependency-held without speculative retry logic.  
**Scope:** `agent/documentary-consumer-idempotency-evidence-resync-20260915` at head `4ff8a3bed1debf346030a9ad67c9f67ea80ed8bc`; two Documentary evidence/assessment documents only.  
**Owner/PVC:** `CAPITAL-AI-DOC / PVC-03`; EventMesh replay/delivery runtime remains `CAPITAL-AI-OPS / PVC-18`.  
**Dependencies:** current Documentary consumer behavior, EventMesh replay guard and reproducible failure evidence.  
**Timeline:** `CONDITIONAL / DEPENDENCY_HELD`.  
**Gate:** implementation may reopen only with deterministic Documentary-local failure evidence including exact consumer path, event/correlation identity, side-effect/replay outcome and proof that bounded retry is safe and Documentary-owned.  
**Exit criterion:** current evidence baseline is correctly recorded as not requiring a retry implementation; no second EventMesh/retry queue/replay registry is introduced.  
**State:** `DEPENDENCY_HELD / NOT_APPLICABLE_FOR_IMPLEMENTATION`.

Current evidence establishes:

- `DocumentaryEventConsumer.ts` validates/projects event metadata and has no evidenced mutating side effect, retry loop, queue or local replay state;
- no current call site for `consumeDocumentaryTrigger` was found beyond its definition on the correlated relevant payload;
- `EventReplayGuard.ts` already owns EventMesh duplicate/stale classification using `eventId`/`correlationId` under OPS/PVC-18;
- the generic EventMesh test fixture naming Documentary does not reproduce the Documentary consumer and is not sufficient local failure evidence;
- repository Vitest, TypeScript, Documentation Hygiene, hosted CI and production/runtime failure probes remain truthfully `NOT RUN` or `NOT AVAILABLE`, not PASS.

## Dependencies
All projects as evidence sources; GOV authority; OPS execution; SEC/QM verification where applicable.

## Project exit gate
One active Documentary roadmap; chat-preservation work is terminalized or explicitly routed; stale branch references are re-correlated before being presented as current; WP-DOC-16 and WP-DOC-17 states are projected without claiming unmerged branch work as current-main implementation; EventMesh/Traceability runtime ownership remains with OPS.
