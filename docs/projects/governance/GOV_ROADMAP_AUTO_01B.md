# GOV-ROADMAP-AUTO-01B — Deterministic Dependency-Ready Target Selection

**Executing / Current Project:** `CAPITAL-AI-GOV`  
**Current Project Folder:** `docs/projects/governance/`  
**Primary PVC / Owner:** `PVC-05 — Platform Director / CAPITAL-AI-GOV`  
**Priority:** `5/5 — strategic`  
**State:** `IMPLEMENTED_ON_BRANCH / CURRENT_SNAPSHOT_NO_EXECUTABLE_TARGET / VALIDATION_PENDING`  
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

A narrow read-only compatibility adapter accepts `WP` as an ID-column alias only when the same Markdown table also contains a `State` or `Status` column. The adapter normalizes that header in memory before delegating to the existing 01A state parser. It does not create a second parser, persist normalized data or rewrite the source Roadmap.

### Explicit readiness

A work item is eligible only when its explicit `State`/`Status` contains an execution-ready state segment:

- `READY`;
- `READY_FOR_IMPLEMENTATION`;
- `READY_FOR_EXECUTION`;
- `REPOSITORY_EXECUTABLE`;
- `EXECUTABLE`.

Readiness is not inferred from suffixes or narrative prose. For example, `FE_OWNER_RETURN_READY` is not an execution-ready state under this contract.

Terminal items are never selected. States containing unfinished/held markers such as `PARTIAL`, `BLOCKED`, `WAITING`, `CONDITIONAL`, `DEPENDENCY_HELD`, `REFERRED`, `NOT RUN`, `EVIDENCE_READY`, `IMPLEMENTED_ON_BRANCH`, `IN_IMPLEMENTATION`, `VALIDATION_PENDING`, `PENDING` or `OPEN` remain ineligible even if other wording contains `READY`.

### Identity and dependency proof

A work-item ID must be unique enough to identify one dependency target. Two representations of the same item through one heading plus one State/Status table row may corroborate each other, but repeated occurrences from the same source class — for example two rows with the same ID in one canonical State table — are ambiguous and fail the whole selection closed as `NO_EXECUTABLE_TARGET / DUPLICATE_WORK_ITEM_ID`. The same fail-closed result applies when the same work-item ID exists in more than one canonical project.

For an otherwise eligible item:

- no `Dependencies` declaration means no explicit dependency blocker was declared by that work-item section;
- explicit `none`, `N/A`, `not applicable`, `no dependencies` or `none declared` means no dependency blocker;
- structured work-item dependency IDs must resolve uniquely across the canonical Roadmaps;
- every referenced work-item dependency must be terminal under the existing 01A state classifier;
- an unknown dependency ID fails closed as `UNKNOWN_DEPENDENCY_REFERENCE`;
- a dependency declaration that cannot be reduced to known work-item IDs fails closed as `UNSTRUCTURED_DEPENDENCY_DECLARATION` rather than being guessed ready;
- a known non-terminal dependency fails closed as `DEPENDENCY_NOT_TERMINAL`.

### Deterministic tie-break

If multiple items are dependency-ready and work-item identity is unambiguous, the selector returns exactly one target using the stable order:

```text
canonical project order in docs/projects/README.md
→ source order inside that project's canonical ROADMAP.md
→ work-item ID as final deterministic tie-break
```

The selected target retains the canonical project, PVC relationship, project folder, branch slug and Roadmap path. Selection does not transfer ownership or authorize execution.

## Current snapshot result

For `main@7e083b6c99327884fbc4169525bf8646519d06a7`, the deterministic result is:

```text
NO_EXECUTABLE_TARGET
reason: DUPLICATE_WORK_ITEM_ID
blocker: CAPITAL-AI-DATA / docs/projects/data/ROADMAP.md / DATA-09
```

The canonical DATA State table contains two distinct rows that both start with the work-item identity `DATA-09`:

- `DATA-09 UAI / Data Ingestion` → `READY / ACTIVE BACKLOG`;
- `DATA-09 GOV-07 Newsfeed entitlement` → `PARTIAL — product access closed; authority-unavailable distinction open`.

That ambiguity prevents 01B from proving a unique dependency identity. Later explicit ready candidates such as `DATA-15`, the QM `READY` rows and SEO `WP-SEO-SPAM = REPOSITORY_EXECUTABLE` are therefore not selected on this snapshot. The selector stops at the identity-integrity gate rather than silently choosing around it.

01B does **not** mutate the DATA Roadmap to manufacture a target. Any normalization of `DATA-09` identities belongs to `CAPITAL-AI-DATA / PVC-09..11`; after such an owner-correct terminal change, a future execution pass must recompute selection from then-current main.

## Materialization

- `scripts/governance/roadmapNextTarget.mjs`
  - reuses the 01A project/state parser;
  - accepts the canonical `WP` table header through a narrow in-memory alias adapter;
  - recognizes only explicit execution-ready states;
  - rejects repeated same-source or cross-project work-item identities;
  - resolves structured dependencies against canonical Roadmap work-item IDs;
  - fails closed on unknown/unstructured/non-terminal dependencies and duplicate IDs;
  - returns exactly one `TARGET_SELECTED` record or `NO_EXECUTABLE_TARGET` with blockers;
  - performs no writes or persistence.
- `tests/unit/roadmapNextTarget.test.ts`
  - verifies explicit-ready vs pseudo-ready states;
  - verifies canonical `WP` table alias handling;
  - verifies canonical-project and Roadmap-source ordering;
  - verifies terminal dependency satisfaction;
  - verifies unknown/unstructured dependency failure;
  - verifies repeated same-source and cross-project duplicate-ID failure while allowing one heading + one table corroboration;
  - executes the selector against the current twelve-project repository and requires the concrete `CAPITAL-AI-DATA / DATA-09 / DUPLICATE_WORK_ITEM_ID` `NO_EXECUTABLE_TARGET` result with `shadowQueue=false`.

## Validation truth

Initial hosted checks on the first PR #989 head `fa3bf0a079cf66d25ddc9cf2ca8ff8d7408e8eb2` passed TypeScript, diff-scoped Vitest, Governance, selective CodeQL and Container Security. Those results are historical after the identity-integrity follow-up commits and do not prove the new exact PR head.

The updated exact PR head requires a fresh hosted validation cycle. Full-suite/build/deploy/container-image work remains governed by the trusted-base PR validation plan; intentionally skipped checks remain `SKIPPED / NOT RUN`, never `PASS`.

## Concurrent-writer correlation

After PR #989 creation, additional independent Draft PRs appeared while current main remained `7e083b6c99327884fbc4169525bf8646519d06a7`:

- PR #988 (`CAPITAL-AI-OPS`) changes CI/planner/provider-workflow control surfaces but none of the 01B files or canonical Roadmaps;
- PR #990 (`CAPITAL-AI-COMP`) changes `docs/projects/compliance/ROADMAP.md`, which is a read-only 01B input. Its observed patch terminalizes `COMP-REQ-033` and adds an execution-order table without a `State`/`Status` column; it does not alter the 01B parser/selector contract. If #990 merges before #989, the changed main snapshot still mandates full resynchronization and re-selection;
- PR #991 (`CAPITAL-AI-SEO`) changes only the prerender script and its focused SEO regression, not the canonical SEO Roadmap.

These writers are correlation triggers. Any merge that changes current main invalidates the prior final correlation and requires resync/revalidation before merge readiness may be asserted.

## Exit gate

`GOV-ROADMAP-AUTO-01B` is complete only when the exact PR head proves all of the following:

1. all canonical projects are read from the current Project/PVC mapping and their canonical Roadmaps;
2. the selector emits exactly one `TARGET_SELECTED` record or exactly one `NO_EXECUTABLE_TARGET` result with concrete blocker evidence;
3. readiness is explicit rather than inferred;
4. canonical `WP` State/Status tables remain readable without source mutation;
5. known dependencies must be terminal; ambiguous dependencies fail closed;
6. repeated same-source and cross-project work-item identity fails closed;
7. target Project/PVC/Primary Owner remain unchanged;
8. no persistent queue, shadow Roadmap, second registry or second status authority is created;
9. validation is truthfully classified and final PR-head/current-main correlation passes before Human/CODEOWNER merge consideration.

## Successor boundary

01B selects and reports only. It does not execute the selected foreign-project work package and it does not normalize a foreign-owner Roadmap.

After 01B reaches a terminal outcome, the next execution pass must refresh then-current `main`, open PRs/writers and the canonical Roadmaps before acting on any previously selected target or blocker. A result selected or blocked on an older snapshot is not an execution credential and must be revalidated under the affected target project's canonical ownership and applicable Roadmap/ADR/ESS boundaries.
