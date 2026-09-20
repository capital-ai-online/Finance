# WP-06 — Application-wide Documentary Auto-Convergence

**Work package:** `CAPITAL-AI-DOC-REPO-STRUCTURE-ARCHIVE-01 / WP-06`  
**Project:** `CAPITAL-AI-DOC`  
**PVC:** `PVC-03`  
**Direction:** event-driven, branch-only, fail-closed  
**Target state:** every accepted application change produces a deterministic documentation-impact assessment and, where policy permits, a bounded background synchronization candidate.

**Parent work package:** `OPS-08-B-SH-02 — Autonomous Self-Healing Backend & Frontend`  
**Self-Healing role:** subordinate Documentary recovery/evidence specialization; no independent Finding/Action/Budget authority.

### Resolution order inside this work package

1. `/AGENTS.md@CURRENT_MAIN` remains the sole repository-wide trust root.
2. The merged `OPS-08-B-SH-02` Self-Healing package and its current contracts define recovery/convergence semantics for WP-06.
3. WP-06 defines the Documentary-specific implementation and evidence projection beneath SH-02.
4. Other Documentary/ADR/ESS/runbook material remains subject-matter evidence/constraints and cannot create a competing control plane.

When SH-02 and an older Documentary projection disagree on self-healing semantics, the current SH-02 contract wins. WP-06 must be reconciled rather than maintaining compatibility rules in parallel.

## 1. Goal

Application changes must not leave routes, dependency descriptions, ownership projections, runbooks, project indexes or other current documentation silently stale.

The Documentary pipeline therefore observes each accepted repository change and derives a repository-wide impact graph:

```text
accepted application change
  -> exact source commit + changed paths
  -> application change classification
  -> Documentary semantic freshness analysis
  -> impacted document/path/route/dependency graph
  -> mutation classification
       AUTO_SYNC
       SEMANTIC_PATCH
       REVIEW_ONLY
       NO_ACTION
  -> isolated agent/documentary-maintenance-* branch
  -> deterministic checks
  -> Draft PR
  -> Human/CODEOWNER merge
```

No background path writes directly to `main`.

## 2. Reused canonical components

WP-06 extends existing components rather than creating a parallel documentation control plane:

- `DocumentationHygieneValidator` — fail-closed structural/current-routing hygiene;
- `SemanticFreshnessAnalyzer` — registered-document/source dependency correlation;
- `ApplicationChangeImpactAnalyzer` — application-wide changed-path classification and impact projection;
- `DocumentaryMaintenanceAgent` — bounded semantic patch planning/apply;
- `DocumentaryMaintenanceOrchestrator` — Supervisor/Platform-Director/Agent-IAM gates;
- `runDocumentaryMaintenanceControlLoop.ts` — branch/commit/push host;
- `.github/workflows/open-agent-draft-pr.yml` — existing trusted Draft-PR handoff.

A second agent framework, PR workflow, document registry, route registry or dependency authority is prohibited.

## 3. Change-impact classes

Every changed path is classified deterministically:

| Class | Examples | Purpose |
|---|---|---|
| `ROUTE` | `server/routes/**`, routers, application route entry points | find route/runbook/navigation documentation |
| `DEPENDENCY` | `package.json`, lockfiles, dependency manifests | find architecture/runtime/dependency documentation |
| `RUNTIME` | `src/**`, `server/**`, `scripts/**` | find component/project documentation |
| `CONTRACT` | contract/schema surfaces | find consumers, compatibility docs and runbooks |
| `CONFIG` | YAML/JSON/configuration | find configuration and operational documentation |
| `DOCUMENTATION` | `docs/**` | propagate current-document references where applicable |
| `WORKFLOW` | `.github/workflows/**` | find CI/operations/governance documentation |
| `UNKNOWN` | other paths | preserve evidence and require conservative correlation |

Classification is evidence for impact discovery only; it does not transfer project/PVC ownership.

## 4. Impact graph

For the exact source SHA, the analyzer combines:

1. direct source-path references;
2. explicit `@depends on <path>` markers;
3. component semantic scope;
4. changed-document references;
5. route/dependency path classification;
6. Document Registry lifecycle and owner metadata;
7. current Documentation Hygiene findings.

Output is a machine-readable artifact such as:

```text
artifacts/documentary/change-impact.json
```

It contains changed paths, change classes, patchable document candidates, review-only candidates and the embedded semantic-freshness report.

## 5. Mutation classes

### AUTO_SYNC

Allowed only for deterministic transformations whose desired result is derivable without interpretation, for example:

- stale current project/owner routing;
- generated indexes;
- machine-readable current-path projections;
- deterministic version/reference projections.

AUTO_SYNC must have an explicit rule implementation and focused tests. There is no generic string-replacement authority.

### SEMANTIC_PATCH

Normal non-protected documentation may be patched by the existing Documentary Maintenance Agent when all existing ADR-0097 authorization/evidence gates are satisfied.

AI output remains advisory until deterministic validation and branch-only apply succeed.

### REVIEW_ONLY

The following remain review-only for semantic changes:

- ADRs;
- Governance;
- Security;
- Compliance/Legal;
- Evidence;
- Release evidence;
- Archive/history;
- root authority/instruction surfaces.

They may be detected automatically and attached to the Draft PR as review-required paths, but are not semantically rewritten in the background.

### NO_ACTION

No related current documentation was found, or all candidates are terminal/historical.

## 6. Background workflow target

The final event flow is triggered from an accepted `main` change, not from an untrusted PR head.

The background workflow must:

1. bind `before` and `after` SHA;
2. calculate changed paths from the exact Git diff;
3. run `documentary:impact:plan`;
4. run `docs:hygiene:check`;
5. stop with `NO_ACTION` when no affected current document exists;
6. create no branch when only review-only paths are present;
7. for approved AUTO_SYNC/SEMANTIC_PATCH work, reuse the existing Documentary Maintenance Control Loop;
8. create a fresh `agent/documentary-maintenance-*` branch;
9. abort if `main` moves during execution;
10. run focused local checks on the exact candidate;
11. hand off through the existing Draft-PR workflow;
12. never merge, deploy or mutate production.

Workflow concurrency is serialized by Documentary source/base identity so stale maintenance candidates cannot race newer main changes.

## 7. Cost model

The trigger is event-driven rather than polling.

To minimize Actions cost:

- analyze only the exact changed-path set first;
- do not install/run full application suites for `NO_ACTION`;
- use focused Documentary tests before broad checks;
- reuse dependency caches in the hosted implementation;
- cancel or supersede stale impact analysis where the newer source commit makes it irrelevant;
- never trigger a second CI workflow solely to duplicate evidence already produced for the exact candidate.

## 8. Security and governance boundaries

The automation has no capability to:

- write directly to `main`;
- self-merge or auto-merge;
- deploy;
- mutate Supabase, Stripe, Render, secrets, IAM or production state;
- rewrite historical evidence merely to remove old terminology;
- alter ADR/GOV/SEC/COMP/Legal meaning autonomously;
- infer a missing owner/PVC.

Ambiguous ownership or conflicting authority is `BLOCKED`, not auto-fixed.

## 9. Delivery slices

### WP-06A — Detection foundation

- extend Documentation Hygiene for known stale routing invariants;
- add application-wide changed-path classification;
- emit deterministic change-impact JSON;
- focused unit tests.

**Exit:** exact source changes deterministically produce patchable/review-only impact candidates.

### WP-06B — Event workflow

- main-push event binding;
- exact `before..after` correlation;
- concurrency/stale-run protection;
- low-cost `NO_ACTION` fast path;
- artifact retention.

**Exit:** every accepted main change receives an impact assessment without polling.

### WP-06C — Deterministic AUTO_SYNC rules

- rule registry for mechanically derivable current projections;
- rule-specific allowlists and tests;
- branch-only patch application;
- no protected-document semantic writes.

**Exit:** supported drift classes automatically produce a clean maintenance branch.

### WP-06D — Semantic maintenance handoff

- connect impact candidates to existing Supervisor/Platform-Director/Agent-IAM evidence;
- reuse Documentary Maintenance Agent;
- reuse `open-agent-draft-pr.yml`;
- surface review-only paths in PR evidence.

**Exit:** eligible semantic drift is repaired in the background on a branch and surfaced as a Draft PR, never silently merged.

### WP-06E — Closure and self-healing evidence

- stale-main restart evidence;
- branch collision evidence;
- route/dependency regression fixtures;
- current/historical separation tests;
- cost/concurrency telemetry.

**Exit:** application-wide documentary convergence is deterministic, auditable, branch-only and fail-closed.

## Current implementation status

- **WP-06A — Detection foundation:** `DONE_MAIN` through Human-merged PR #1108.
- **WP-06B — Event workflow:** `DONE_MAIN` through Human-merged PR #1109; exact `main` push identity, stale-run cancellation, exact `before..after` impact planning, fail-closed documentation hygiene, low-cost state classification and 7-day impact artifact retention.
- **WP-06C — Deterministic AUTO_SYNC rules:** `DONE_MAIN` through Human-merged PR #1110; explicit allowlisted rules generate SHA-256-bound patch plans and a separated `contents: write` job may materialize only those validated patches plus one work claim on an isolated `agent/documentary-autosync-*` branch.
- **WP-06D — Semantic maintenance handoff:** `DONE_MAIN` through Human-merged PR #1121. Validated AUTO_SYNC branches are handed to the existing `open-agent-draft-pr.yml` through a trusted-main `workflow_call`; review-only and semantic-maintenance candidate paths are carried in the work claim and rendered as PR evidence. Semantic mutation itself still requires the existing Supervisor/Platform-Director/Agent-IAM authorization chain; no missing approval evidence is synthesized.
- **WP-06E — Closure/self-healing evidence:** implemented on the current branch as an `EVIDENCE_PROJECTION_ONLY` specialization beneath `OPS-08-B-SH-02 / SH-02.3`; exact-source correlation, stale-main rejection, idempotent branch-collision handling, route/dependency fixtures, current/history separation and concurrency/cost evidence are covered. The evidence builder binds directly to `self-healing-contract/1.0.0`, fails closed on invalid contract state and never creates a second Self-Healing registry. Direct typed binding to `src/platform/Supervisor/selfHealingContract.ts` is active on the current branch because SH-02.3 is now merged to `main`; invalid contract snapshots fail closed. WP-06 consumes the canonical contract snapshot only and does not duplicate Finding/Action/Eligibility/Convergence rules.

## 10. Definition of Done

WP-06 is complete when a representative set of route, runtime, dependency, contract, config and workflow changes proves:

- affected current documentation is detected;
- unaffected/historical material does not cause false auto-writes;
- protected docs are review-only;
- deterministic supported drift is corrected on an isolated branch;
- semantic patches reuse the existing Maintenance Agent and authorization chain;
- exact source/main identity is preserved;
- stale candidates abort/restart;
- one Draft PR is produced without duplicate writer lanes;
- all merge/deploy authority remains Human/CODEOWNER-controlled.
