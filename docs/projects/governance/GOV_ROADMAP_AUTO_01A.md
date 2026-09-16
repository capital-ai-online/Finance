# GOV-ROADMAP-AUTO-01A — Canonical Roadmap Progress Projection

**Executing / Current Project:** `CAPITAL-AI-GOV`  
**Current Project Folder:** `docs/projects/governance/`  
**Primary PVC / Owner:** `PVC-05 — Platform Director / CAPITAL-AI-GOV`  
**Priority:** `5/5 — strategic`  
**State:** `IMPLEMENTED_ON_BRANCH / CLASSIFICATION_EVIDENCE_CAPTURED / VALIDATION_PENDING`  
**Baseline:** `main@89924f0b913198b8af39f70cd9666ad7980e20cb`  
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

## Current-main resynchronization

- predecessor PR `#982`: `MERGED`;
- resynchronization baseline: `main@89924f0b913198b8af39f70cd9666ad7980e20cb`;
- open Pull Requests at resynchronization: `0`;
- canonical project mapping still contains exactly 12 projects;
- the three 01A paths do not exist on the resynchronization baseline, so the merge snapshot introduces no same-file overwrite of current-main payload;
- merge-base after resynchronization is exactly `main@89924f0b913198b8af39f70cd9666ad7980e20cb` and the branch is `0 behind`;
- exact repository-native reporter/test execution remains `NOT RUN` until an execution host or hosted PR CI runs it; `NOT RUN` is not `PASS`.

## 12-project classification snapshot

The reporter semantics were applied to all twelve canonical `ROADMAP.md` files from the resynchronized repository snapshot. No percentage is emitted where any explicit work-item state remains unresolved.

| Project | Canonical folder | Result | Reproducible blocker example |
|---|---|---|---|
| `CAPITAL-AI-CLIENT` | `docs/projects/agent-client/` | `NOT_PROVEN` | `CLIENT-RUNTIME-01 = DEPENDENCY_HELD` is not an explicitly classified terminal/non-terminal reporter state; other legacy ledger wording is likewise not guessed |
| `CAPITAL-AI-OPS` | `docs/projects/operations/` | `NOT_PROVEN` | `OPS-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-DOC` | `docs/projects/documentary/` | `NOT_PROVEN` | `DOC-CARRY-01 = ACTIVE CARRY-FORWARD` is not mapped to a completion class |
| `CAPITAL-AI-GOV` | `docs/projects/governance/` | `NOT_PROVEN` | `GOV-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-DATA` | `docs/projects/data/` | `NOT_PROVEN` | `DATA-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-FINTECH` | `docs/projects/fintech/` | `NOT_PROVEN` | `FIN-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-QM` | `docs/projects/quality-management/` | `NOT_PROVEN` | `QM-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-SEC` | `docs/projects/security/` | `NOT_PROVEN` | `SEC-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-COMP` | `docs/projects/compliance/` | `NOT_PROVEN` | `COMP-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-FE` | `docs/projects/frontend/` | `NOT_PROVEN` | `FE-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-SEO` | `docs/projects/seo/` | `NOT_PROVEN` | `SEO-CARRY-01` has no explicit `State`/`Status` |
| `CAPITAL-AI-SOCIAL` | `docs/projects/social-media/` | `NOT_PROVEN` | `SOCIAL-CARRY-01 = ACTIVE CARRY-FORWARD` is not mapped to a completion class |

This snapshot intentionally does **not** normalize those Roadmap states inside 01A. Doing so would mutate owner Roadmaps merely to obtain a percentage and would turn the measurement slice into a status-authority migration. Future owner-correct Roadmap normalization may make individual percentages provable, but `NOT_PROVEN` is the correct 01A result for the current snapshot.

## Exit gate

`GOV-ROADMAP-AUTO-01A` is complete only when the exact branch/PR head proves that all 12 current canonical project Roadmaps are discovered and classified, every numeric progress value has a reproducible numerator/denominator, ambiguous state produces `NOT_PROVEN`, and no parallel Roadmap/status registry is introduced.

## Successor boundary

`GOV-ROADMAP-AUTO-01B` may add deterministic dependency-ready target selection only after this 01A PR reaches a terminal outcome under the ordered automated Roadmap lane. It must consume canonical Roadmaps directly rather than persisting a shadow queue.
