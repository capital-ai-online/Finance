# GOV-ROADMAP-AUTO-01B — Deterministic Dependency-Ready Target Selection

**Executing / Current Project:** `CAPITAL-AI-GOV`  
**Current Project Folder:** `docs/projects/governance/`  
**Primary PVC / Owner:** `PVC-05 — Platform Director / CAPITAL-AI-GOV`  
**Priority:** `5/5 — strategic`  
**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`  
**Baseline:** `main@7e083b6c99327884fbc4169525bf8646519d06a7`  
**Predecessor:** `GOV-ROADMAP-AUTO-01A` — Human-merged via PR `#987`, merge SHA `7e083b6c99327884fbc4169525bf8646519d06a7`  
**Authority:** `/AGENTS.md@current-main`, ADR-0096, canonical Project/PVC mapping and canonical project Roadmaps

## Objective

Select exactly one dependency-ready Roadmap target from the canonical project Roadmaps, or emit `NO_EXECUTABLE_TARGET` with concrete blocker evidence when no target can be proven ready.

01B extends the read-only 01A projection only. It does not persist a queue, copy Roadmap state into a registry, transfer project/PVC ownership, authorize execution, create a second Governance plane or mutate any target Roadmap.

## Predecessor and serial-lane evidence

The ordered automated Roadmap lane prerequisite is satisfied for this slice:

- PR `#987` reached a terminal **Human-merged** outcome on 2026-09-16;
- the resulting then-current baseline is `main@7e083b6c99327884fbc4169525bf8646519d06a7`;
- 01B starts from a fresh branch created directly from that merge commit;
- the pre-write open-PR readback on this baseline returned zero open Pull Requests;
- no existing `GOV-ROADMAP-AUTO-01B` branch or repository materialization was found during correlation.

No payload from an unmerged predecessor branch is reused.

## Selection contract

### Canonical input

01B reuses `scripts/governance/roadmapProgress.mjs` for canonical project discovery and work-item state parsing.

The only execution-source inputs are:

1. `docs/projects/README.md` for canonical project/folder/branch-slug mapping;
2. `docs/projects/PROJECT_VALUE_CHAIN.md` for ownership projection;
3. each canonical `docs/projects/<project>/ROADMAP.md` for work-item state and dependency evidence.

No shadow Roadmap, task registry, scheduler database or persistent queue is introduced.

### Explicit readiness

A work item is eligible only when its explicit `State`/`Status` contains an execution-ready state segment:

- `READY`;
- `READY_FOR_IMPLEMENTATION`;
- `READY_FOR_EXECUTION`;
- `REPOSITORY_EXECUTABLE`;
- `EXECUTABLE`.

Readiness is not inferred from suffixes or narrative prose. For example, `FE_OWNER_RETURN_READY` is not an execution-ready state under this contract.

Terminal items are never selected. States containing unfinished/held markers such as `PARTIAL`, `BLOCKED`, `WAITING`, `CONDITIONAL`, `DEPENDENCY_HELD`, `REFERRED`, `NOT RUN`, `EVIDENCE_READY`, `IMPLEMENTED_ON_BRANCH`, `IN_IMPLEMENTATION`, `VALIDATION_PENDING`, `PENDING` or `OPEN` remain ineligible even if other wording contains `READY`.

### Dependency proof

For an otherwise eligible item:

- no `Dependencies` declaration means no explicit dependency blocker was declared by that work-item section;
- explicit `none`, `N/A`, `not applicable`, `no dependencies` or `none declared` means no dependency blocker;
- structured work-item dependency IDs must resolve uniquely across the canonical Roadmaps;
- every referenced work-item dependency must be terminal under the existing 01A state classifier;
- an unknown dependency ID fails closed as `UNKNOWN_DEPENDENCY_REFERENCE`;
- a dependency declaration that cannot be reduced to known work-item IDs fails closed as `UNSTRUCTURED_DEPENDENCY_DECLARATION` rather than being guessed ready;
- a known non-terminal dependency fails closed as `DEPENDENCY_NOT_TERMINAL`.

Duplicate work-item IDs across canonical projects fail the whole selection as `NO_EXECUTABLE_TARGET / DUPLICATE_WORK_ITEM_ID` because dependency identity would be ambiguous.

### Deterministic tie-break

If multiple items are dependency-ready, the selector returns exactly one target using the stable order:

```text
canonical project order in docs/projects/README.md
→ source order inside that project's canonical ROADMAP.md
→ work-item ID as final deterministic tie-break
```

The selected target retains the canonical project, PVC relationship, project folder, branch slug and Roadmap path. Selection does not transfer ownership or authorize execution.

## Materialization

- `scripts/governance/roadmapNextTarget.mjs`
  - reuses the 01A project/state parser;
  - recognizes only explicit execution-ready states;
  - resolves structured dependencies against canonical Roadmap work-item IDs;
  - fails closed on unknown/unstructured/non-terminal dependencies and duplicate IDs;
  - returns exactly one `TARGET_SELECTED` record or `NO_EXECUTABLE_TARGET` with blockers;
  - performs no writes or persistence.
- `tests/unit/roadmapNextTarget.test.ts`
  - verifies explicit-ready vs pseudo-ready states;
  - verifies canonical-project and Roadmap-source ordering;
  - verifies terminal dependency satisfaction;
  - verifies unknown/unstructured dependency failure;
  - verifies duplicate-ID failure;
  - executes the selector against the current twelve-project repository and permits only `TARGET_SELECTED` or `NO_EXECUTABLE_TARGET` with concrete evidence and `shadowQueue=false`.

## Validation truth

Repository-native execution from this connector session is `NOT RUN` before PR creation; `NOT RUN` is not `PASS`.

The branch is intended for normal correlation-gated Draft PR creation after final current-main/open-writer/changed-file/semantic/authority correlation. Hosted PR CI remains the exact remote-head evidence source for TypeScript/Vitest and other applicable checks.

## Exit gate

`GOV-ROADMAP-AUTO-01B` is complete only when the exact PR head proves all of the following:

1. all canonical projects are read from the current Project/PVC mapping and their canonical Roadmaps;
2. the selector emits exactly one `TARGET_SELECTED` record or exactly one `NO_EXECUTABLE_TARGET` result with concrete blocker evidence;
3. readiness is explicit rather than inferred;
4. known dependencies must be terminal; ambiguous dependencies fail closed;
5. duplicate work-item identity fails closed;
6. target Project/PVC/Primary Owner remain unchanged;
7. no persistent queue, shadow Roadmap, second registry or second status authority is created;
8. validation is truthfully classified and final PR-head/current-main correlation passes before Human/CODEOWNER merge consideration.

## Successor boundary

01B selects and reports only. It does not execute the selected foreign-project work package.

After 01B reaches a terminal outcome, the next execution pass must refresh then-current `main`, open PRs/writers and the canonical Roadmaps before acting on any previously selected target. A target selected on an older snapshot is not an execution credential and must be revalidated under the target project's canonical ownership and applicable Roadmap/ADR/ESS boundaries.
