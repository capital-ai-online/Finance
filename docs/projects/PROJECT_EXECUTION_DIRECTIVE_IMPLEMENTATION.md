# Project Execution Directive — Implementation Contract

**Status:** `NON-AUTHORIZING IMPLEMENTATION DOCUMENTATION`  
**Authority:** `/AGENTS.md@CURRENT_MAIN`  
**Project:** `CAPITAL-AI-GOV`  
**Primary PVC:** `PVC-05`  
**Runtime role:** read-only validation and machine-consumable projection integrity

## Purpose

This document describes how the three universal Project Execution Directive YAML projections are implemented in code and GitHub Actions. It does not create development authority, task authority, ownership, approval, merge authority or a second lifecycle.

Execution semantics remain exclusively in `/AGENTS.md@CURRENT_MAIN`, especially Section 4. The YAML files are machine-readable projections of that authority.

## Three-part projection

1. `PROJECT_EXECUTION_DIRECTIVE_01_AUTHORITY.yaml`
   - binds the projection to `/AGENTS.md@CURRENT_MAIN`;
   - resolves all canonical project folders from `docs/projects/README.md@CURRENT_MAIN`;
   - resolves Primary PVC ownership from `PROJECT_VALUE_CHAIN.md@CURRENT_MAIN`;
   - binds the implementation validator, workflow and this documentation.

2. `PROJECT_EXECUTION_DIRECTIVE_02_POST_MERGE.yaml`
   - projects the post-merge sequence;
   - requires fresh CURRENT_MAIN readback and merged-outcome evidence;
   - permits direct continuation only for a canonical, owner-correct, dependency-ready, blocker-free next item;
   - preserves Human/CODEOWNER and ownership boundaries.

3. `PROJECT_EXECUTION_DIRECTIVE_03_IDLE_PVC.yaml`
   - projects the bounded idle review;
   - requires exactly three relevant PVC units;
   - requires evidence, risk, dependency and handover fields;
   - requires deduplication before a new work package is derived;
   - forbids artificial mutation when the result is `NO_ACTIONABLE_FINDING`.

## Code implementation

`scripts/governance/validateProjectExecutionDirective.mjs` is the canonical implementation validator for these projections.

It validates:

- all three YAML files parse under the deliberately bounded projection grammar;
- projection IDs, part numbering and `NON_AUTHORIZING_PROJECTION` state;
- exact trust-root and Section-4 references;
- post-merge sequence and evidence contract;
- exactly-three-PVC idle-review cardinality;
- deduplication and no-artificial-mutation guardrails;
- project/PVC mapping through the existing `validateProjectValueChain.mjs` validator;
- absence of project-local directive copies;
- implementation bindings to validator, workflow and documentation;
- read-only GitHub workflow permissions;
- required Section-4 semantics in `AGENTS.md`.

The validator does not discover defects, invent work, create branches, update Roadmaps, create work packages, open Pull Requests or merge changes.

## Workflow implementation

`.github/workflows/project-execution-directive.yml` executes the validator for relevant Pull Requests, relevant pushes to `main`, and explicit workflow dispatches.

The workflow:

- uses read-only `contents: read` permission;
- checks out without persistent credentials;
- installs no project dependencies;
- executes the validator and its Node test contract;
- emits only GitHub step-summary evidence;
- performs no repository mutation.

The workflow is an enforcement/evidence surface, not an execution authority.

## Operational state model

After a Human Owner merge, the authoritative behavior remains:

`CURRENT_MAIN → merged-outcome verification → evidence/work-package reconciliation → next canonical item`.

If an eligible next item exists, the originating execution context continues directly according to `AGENTS.md`.

If no active canonical item remains, Section 4 requires a bounded three-PVC review. A follow-up work package is derived only from fresh evidence-backed actionable findings after deduplication. Foreign-owner findings become owner-correct handovers. If there is no actionable finding, the state is `NO_ACTIONABLE_FINDING` and no artificial mutation is created.

## Why the validator does not auto-create work

A generic GitHub validator cannot safely determine semantic relevance, evidence quality, foreign ownership or whether a finding is already resolved merely from the three projection files. Automatically creating work from configuration alone would risk fabricated defects, duplicate work and ownership transfer.

Therefore the implementation intentionally separates:

- **authority:** `AGENTS.md`;
- **machine projection:** the three YAML files;
- **validation:** the Node validator and GitHub workflow;
- **execution:** the current owner-correct chat/agent/work-package context with fresh CURRENT_MAIN correlation.

## Local verification

Run:

```bash
node scripts/governance/validateProjectExecutionDirective.mjs
node --test scripts/governance/validateProjectExecutionDirective.test.mjs
```

A successful validation reports the number of directive parts, canonical project folders, PVC stages, idle-review cardinality and read-only implementation mode.

Any missing or contradictory authority, ownership mapping, YAML contract, workflow permission or project-local duplicate fails closed.
