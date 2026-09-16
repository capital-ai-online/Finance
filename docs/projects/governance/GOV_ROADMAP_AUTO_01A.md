# GOV-ROADMAP-AUTO-01A — Canonical Roadmap Progress Projection

**Executing / Current Project:** `CAPITAL-AI-GOV`  
**Current Project Folder:** `docs/projects/governance/`  
**Primary PVC / Owner:** `PVC-05 — Platform Director / CAPITAL-AI-GOV`  
**Priority:** `5/5 — strategic`  
**State:** `IMPLEMENTED_ON_BRANCH / VALIDATION_PENDING`  
**Baseline:** `main@afa259fc786479386a6ea0e165c3d8dc3363aae8`  
**Authority:** `/AGENTS.md@current-main`, `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`, `CTRL-GOV-OPS-FOREIGN-EXEC-001`

## Objective

Implement a read-only, reproducible progress projection for every canonical CAPITAL-AI project Roadmap without creating a second Roadmap, queue, registry or project-status authority.

Canonical project discovery is derived only from `docs/projects/README.md`; the Project Value Chain file is required as the ownership projection. Each discovered project's `ROADMAP.md` remains the source of execution truth.

## Measurement contract

A percentage is emitted only when all explicitly discovered work items have a resolvable `State` or `Status` classification.

- **Denominator:** all explicit work-item IDs discovered from work-item headings or ID-bearing `State`/`Status` table rows.
- **Numerator:** denominator items whose explicit state is terminal.
- **Terminal markers:** explicit `DONE_MAIN`, `DONE`, `CLOSED`, `COMPLETE/COMPLETED`, `VERIFIED`, `RETIRED`, `SUPERSEDED` or `TERMINAL` states.
- **Non-terminal precedence:** `PARTIAL`, `READY`, `NOT RUN`, `NOT_PROVEN`, `WAITING`, `BLOCKED`, `CONDITIONAL`, `CONTINUOUS`, `IMPLEMENTED_ON_BRANCH`, `IN_IMPLEMENTATION`, `PENDING`, `OPEN`, `REFERRED`, `EVIDENCE_READY` and `VALIDATION_PENDING` never count as done even when terminal words also occur in the same state text.
- **Fail closed:** missing, unknown or conflicting work-item state, or a missing canonical Roadmap, yields `NOT_PROVEN` and no percentage.

This projection is derived evidence only. It does not write Roadmap state and does not become a new status authority.

## Materialization

- `scripts/governance/roadmapProgress.mjs`
  - parses the canonical project mapping;
  - rejects duplicate project/folder/branch-slug mappings;
  - discovers each canonical `ROADMAP.md`;
  - classifies explicit work items;
  - emits `PROVEN` with numerator/denominator/percentage or `NOT_PROVEN` with the blocker reason.
- `tests/unit/roadmapProgress.test.ts`
  - proves the forbidden pseudo-DONE states remain non-terminal;
  - proves terminal classification and non-terminal precedence;
  - proves unknown/conflicting states produce `NOT_PROVEN`;
  - integrates against the repository mapping and requires exactly the current 12 canonical projects to be classified.

## Exit gate

`GOV-ROADMAP-AUTO-01A` is complete only when the exact branch/PR head proves that all 12 current canonical project Roadmaps are discovered and classified, every numeric progress value has a reproducible numerator/denominator, ambiguous state produces `NOT_PROVEN`, and no parallel Roadmap/status registry is introduced.

## Successor boundary

`GOV-ROADMAP-AUTO-01B` may add deterministic dependency-ready target selection only after this 01A PR reaches a terminal outcome under the ordered automated Roadmap lane. It must consume canonical Roadmaps directly rather than persisting a shadow queue.
