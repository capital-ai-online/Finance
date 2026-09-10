# Documentary D8 — Migration Planning & Legacy Compatibility

**Status:** DONE — HUMAN-MERGED / READ-ONLY PLANNING SLICE  
**Project:** `CAPITAL-AI-DOC`  
**PVC:** `PVC-03 — Documentary Engine`  
**Primary Authority:** ESS-0010 Documentary Engine  
**Repository trust root:** `/AGENTS.md`  
**Implementation:** `src/platform/Documentary/Migration/DocumentaryMigrationPlanner.ts`  
**Merged evidence:** PR #792 / merge `12b5ec1886984fb6815ba111108f7f353496de7d`

## Purpose

D8 provides a bounded, deterministic and read-only migration-planning capability for Documentary-owned documentation. It identifies migration/redirect candidates without performing repository mutations and without acquiring authority over foreign project content.

This slice deliberately separates **planning** from **execution**. A planning result is evidence for later Human/Owner-reviewed work; it is never itself authorization to move, delete, rewrite, register or redirect a document.

## Classification contract

The planner classifies a document into exactly one of:

- `canonical` — registered and already at its canonical path;
- `generated` — generated documentation under `docs/generated/**`;
- `evidence` — evidence material or content under `docs/evidence/**`;
- `legacy` — explicit legacy/deprecated content or registered content whose current path differs from its canonical path;
- `archive` — content under `docs/archive/**`;
- `unknown` — documentation that cannot be classified safely.

## Planning dispositions

The planner emits one of:

- `retain` — content remains in place;
- `migration-candidate` — a reproducible generated artifact has a known canonical target;
- `redirect-candidate` — legacy content has a known distinct canonical target;
- `owner-review` — ambiguity prevents an automatic planning recommendation;
- `blocked` — unsafe paths or foreign ownership prevent Documentary-local action.

Every assessment and aggregate plan declares `mutationPerformed=false`.

## Fail-closed boundaries

The planner blocks or retains rather than broadening authority:

- paths outside `docs/**`, absolute paths and traversal paths are blocked;
- canonical targets outside `docs/**` or containing traversal are blocked;
- `ownerProject` values other than `CAPITAL-AI-DOC` are blocked;
- authority artifacts are retained;
- Security/Compliance artifacts are retained;
- evidence artifacts are retained;
- referenced documents are retained;
- archive material is retained by this migration planner and remains subject to its own retention/archive controls;
- generated artifacts are not migration candidates unless reproducibility is explicitly proven;
- missing/ambiguous canonical targets remain `owner-review`.

## Registry and lifecycle boundary

The planner consumes document identity/path evidence but does not mutate `docs/governance/document-registry.json`, lifecycle state, version state, provenance, Knowledge, EventMesh, Release or Governance authorities.

Any future migration execution that changes a registered document must separately preserve the canonical document identity, lifecycle/provenance rules, compatibility requirements and applicable review/approval gates.

## Foreign-owner boundary

CAPITAL-AI-DOC does not use D8 to relocate or rewrite foreign project/runtime content. Foreign ownership is resolved through:

- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- the target owner's current Roadmap.

No withdrawn post-PVC handoff-policy overlay is required or recreated.

## Validation

Targeted regression coverage: `tests/unit/documentaryMigrationPlanner.test.ts`.

Negative tests cover:

- foreign project ownership;
- traversal/non-documentation source paths;
- invalid canonical targets;
- protected evidence/authority/Security/Compliance/referenced/archive material;
- non-reproducible generated artifacts;
- unknown/ambiguous documentation;
- deterministic aggregate plans with no mutation side effect.

The merged D8 planning implementation is historical/current implementation evidence only; it does not authorize the separate physical/semantic Migration Execution work package. Future execution work must be correlated against then-current `main`, applicable ADR/ESS, Project/PVC ownership and protected-mutation gates.

## Exit boundary

The read-only D8 planning slice is complete on current `main`. Physical/semantic Migration Execution remains a separate future work item and requires its own current-main correlation, owner boundary, dry-run/rollback/verification contract and explicit authorization before any physical mutation is considered.
