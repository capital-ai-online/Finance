# Documentary D8 — Migration Planning & Legacy Compatibility

**Status:** HUMAN-MERGED READ-ONLY PLANNING + WP-DOC-14 DRY-RUN CONTRACT ON SCOPED BRANCH  
**Project:** `CAPITAL-AI-DOC`  
**PVC:** `PVC-03 — Documentary Engine`  
**Primary Authority:** ESS-0010 Documentary Engine  
**Contract Authority:** ESS-0001-CONTRACTS Chapter 14  
**Repository trust root:** `/AGENTS.md`  
**Planning implementation:** `src/platform/Documentary/Migration/DocumentaryMigrationPlanner.ts`  
**Dry-run implementation:** `src/platform/Documentary/Migration/DocumentaryMigrationDryRun.ts`  
**Merged planning evidence:** PR #792 / merge `12b5ec1886984fb6815ba111108f7f353496de7d`  
**WP-DOC-14 branch:** `agent/documentary-migration-execution-dry-run-20260915`

## Purpose

D8 provides a bounded, deterministic and read-only migration-planning capability for Documentary-owned documentation. It identifies migration/redirect candidates without performing repository mutations and without acquiring authority over foreign project content.

WP-DOC-14 adds a separate **execution-readiness dry run**. The dry run does not execute, authorize, schedule or imply a migration. Its strongest possible result is `OWNER_REVIEW_REQUIRED`; incomplete or conflicting evidence returns `BLOCKED`.

Planning and dry-run evidence remain inputs for later Human/Owner-reviewed work. Neither result is authorization to move, delete, rewrite, register, redirect, deprecate, archive or otherwise mutate a document.

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

## WP-DOC-14 dry-run contract

`DocumentaryMigrationDryRun` consumes one existing planner candidate plus explicit caller-supplied execution evidence. It never performs repository discovery, file I/O, registry writes, lifecycle transitions, redirects, event publication, deployment or production mutation.

A planner result must already be `migration-candidate` or `redirect-candidate`. `retain`, `owner-review` and `blocked` dispositions cannot be promoted by the dry run.

The execution-evidence envelope is fail-closed and includes:

- stable `migrationId` and `documentId`;
- source fingerprint plus independently expected source fingerprint;
- source and target Primary Owner evidence;
- target protected-class, compatibility, collision and duplicate checks;
- explicit source and target state;
- affected components and affected data;
- deterministic migration sequence and prerequisites;
- impact and risk analysis;
- equivalence evidence;
- validation steps and test evidence;
- rollback steps, prerequisites, risks, tests and rollback version;
- migration version;
- at least one ADR reference.

The dry run returns exactly one of:

- `OWNER_REVIEW_REQUIRED` — all bounded evidence is present and internally compatible; this is **not** migration approval;
- `BLOCKED` — at least one required boundary/evidence condition fails.

Every dry-run result declares:

- `executionAuthorized=false`;
- `mutationPerformed=false`;
- `registryMutationPerformed=false`;
- `lifecycleMutationPerformed=false`;
- `filesystemMutationPerformed=false`.

## Stable identity and canonical target

WP-DOC-14 reuses the existing Documentary identity model rather than introducing a second registry or identifier plane. Stable identity is represented by the existing `documentId` and source fingerprint evidence. A dry run is blocked when the document identity is absent, the SHA-256 fingerprint is malformed, or observed and expected fingerprints differ.

The canonical target must already be known to the planner, remain Documentary-owned, not be classified by the caller as protected, be explicitly compatibility-safe, and be free of target collision or duplicate-artifact evidence.

The dry run does not write or update `docs/governance/document-registry.json`. Registry and lifecycle state remain unchanged during this work package.

## Primary Owner boundary

The source candidate must explicitly resolve to `CAPITAL-AI-DOC`, and the target execution evidence must independently resolve to `CAPITAL-AI-DOC`. Missing or foreign ownership blocks the dry run.

CAPITAL-AI-DOC does not use WP-DOC-14 to relocate or rewrite foreign project/runtime content. Foreign ownership remains resolved through:

- `docs/projects/README.md`;
- `docs/projects/PROJECT_VALUE_CHAIN.md`;
- the target owner's current Roadmap.

No withdrawn post-PVC handoff-policy overlay is recreated.

## Protected classes

The existing planner remains the first protection boundary for authority, Security/Compliance, evidence, referenced and archive material. WP-DOC-14 adds an explicit target-side protected-class gate and cannot broaden a planner disposition.

Any protected source/target ambiguity therefore remains `BLOCKED` or planner-level `retain`/`owner-review`; the dry run cannot reinterpret it as execution-ready.

## Rollback and abort boundary

ESS-0001-CONTRACTS Chapter 14 requires a rollback contract before migration execution. WP-DOC-14 therefore requires non-empty rollback:

- steps;
- prerequisites;
- risks;
- tests;
- version.

Missing rollback evidence blocks the dry run. Because WP-DOC-14 performs no migration, its own abort behavior is simply fail-closed result construction with no side effects.

A later physical migration must still define and validate an executable rollback implementation under then-current authority before any mutation can occur.

## Deterministic post-condition verification contract

Every dry-run result carries the same required post-condition identifiers for a later separately authorized execution:

- `document-id-preserved`;
- `source-fingerprint-unchanged`;
- `canonical-target-compatible`;
- `source-owner-preserved`;
- `target-owner-preserved`;
- `protected-classes-unchanged`;
- `registry-unchanged`;
- `lifecycle-unchanged`;
- `filesystem-unchanged`.

These identifiers are verification requirements, not claims that a future physical migration has occurred or passed. WP-DOC-14 itself leaves all referenced state unchanged.

## Duplicate prevention

The dry run requires explicit negative duplicate evidence and blocks when a target collision or duplicate artifact is reported. It does not create a parallel implementation, registry, scanner or migration executor.

## Validation

Planning regression coverage remains `tests/unit/documentaryMigrationPlanner.test.ts`.

WP-DOC-14 focused coverage is `tests/unit/documentaryMigrationDryRun.test.ts` and covers:

- a complete evidence envelope resulting only in `OWNER_REVIEW_REQUIRED`;
- stable-identity/fingerprint drift;
- foreign target ownership;
- protected target class;
- target incompatibility/collision and duplicate evidence;
- missing impact/risk/equivalence evidence;
- incomplete rollback evidence;
- missing validation/test/version/ADR evidence;
- prevention of planner-disposition broadening;
- deterministic result equality for identical input;
- all mutation and execution-authorization flags remaining `false`.

Repository-wide Vitest, TypeScript, Documentation Hygiene and hosted CI are not represented as PASS unless actually executed on the exact branch head.

## Registry, lifecycle and authority boundary

The planner and dry run consume document identity/path/evidence but do not mutate `docs/governance/document-registry.json`, lifecycle state, component/document/platform version authorities, provenance, Knowledge, EventMesh, Release or Governance authorities.

WP-DOC-14 creates no new `AUTH-*`, `CTRL-*`, ADR, ESS or `DOC-*` identity and does not modify an external provider, connector, secret, IAM surface, billing state or production system.

## Exit boundary

The Human-merged D8 planning slice remains complete on current `main`. WP-DOC-14 is complete only as a bounded branch-level **execution-readiness contract and dry-run design** when its exact branch payload is validated and correlated.

Physical/semantic Migration Execution remains a separate future mutation. Before any such operation it still requires then-current-main correlation, applicable authority, explicit Human/Owner authorization, executable rollback, deterministic post-condition verification and the normal PR/Human-merge boundary. No bulk migration is implied by WP-DOC-14.
