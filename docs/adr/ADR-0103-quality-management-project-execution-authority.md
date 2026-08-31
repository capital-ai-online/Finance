# ADR-0103 — Quality Management Project as Single Execution Point

**Authority ID:** `AUTH-ADR-QM-PROJECT-SINGLE-EXECUTION-2026-08-31`  
**Version:** `1.0.0`  
**Date:** `2026-08-31`  
**Lifecycle:** `proposed`  
**Owner:** CAPITAL-AI Owner  
**Effective:** only after Human Merge / acceptance  
**Governance boundary:** ADR-0096

## Context

Quality-related execution is distributed across domain roadmaps. Parallel status tracking risks duplicated tests, inconsistent evidence, stale baselines and competing Quality work packages. ESS-0005 already defines the canonical read-only Quality Center technical boundary.

The runtime implementation also already contains an 18-stage `FintechValueChainQualityProjection`; creating a new QM value-chain, validator registry, EventBus, CI topology, Auth controller, Router or Release controller would create duplicate architecture.

## Decision

After this ADR is accepted, `docs/projects/quality-management/ROADMAP.md` is the **single operational execution/status point for Quality Management work** transferred from other roadmaps.

Source roadmaps continue to own:
- domain context;
- dependencies;
- original findings;
- domain implementation and mutation authority.

They MUST NOT continue operational status tracking for a quality-only subtask after a `HANDED_OFF_TO_QM` marker is established.

`docs/projects/quality-management/TAKEOVER_INDEX.md` is the single source-to-QM mapping table.

## Boundary

This ADR grants QM no Governance, Security, Compliance, IAM, Release, Frontend Product, Financial Runtime, scoring, ranking or production mutation authority.

QM may execute existing validators/tests, aggregate evidence, measure runtime/performance, detect regressions/debt/drift and issue non-authorizing quality findings/readiness snapshots.

QM MUST NOT:
- redefine Security/IAM/Compliance/Governance policy;
- change Quality thresholds outside their existing authority;
- redefine CI required checks or topology;
- authorize merge/deploy/release;
- introduce a parallel EventBus, Validator Registry, Auth controller, Router/Public Shell, scoring/ranking path or value-chain model.

## Existing authorities retained

This ADR **does not supersede**:
- ADR-0096 Governance Control Plane;
- ADR-0016 ESS component-specification history;
- ADR-0073 CI consolidation/build/test authority;
- ADR-0047 authoritative GitHub pre-merge gate;
- ESS-0001-CONTRACTS Chapter 12;
- ESS-0005 Quality Center technical component authority;
- ESS-0012 Documentation Governance;
- Security/IAM/Compliance/Release/Frontend/Financial domain authorities.

ESS-0005 is amended in place to reference this execution project and to align its documented value-chain projection with the existing 18-stage implementation. No competing ESS is created.

## Value-chain relationship

QM projects quality evidence read-only across the existing stages `VC-01` through `VC-18`. The projection is observability/evidence correlation only and does not authorize mutations at any stage.

## Takeover contract

For a transferred subtask the source uses:

> QUALITY-MANAGEMENT TAKEOVER
>
> Execution State: HANDED_OFF_TO_QM  
> Canonical Work Item: `docs/projects/quality-management/ROADMAP.md#<QM-ID>`
>
> Execution ownership for this quality-management subtask has been transferred to CAPITAL-AI-QM.  
> This source roadmap retains domain context and dependency information only.  
> Operational status MUST NOT be maintained in parallel here.

Mixed items transfer only their Quality execution portion.

## Evidence semantics

`PASS` requires complete, real, correctly commit-bound positive evidence. `FAIL` is real negative evidence. Missing, skipped, incomplete, stale or wrong-commit evidence is `NOT_AVAILABLE`. Test/file existence is not execution evidence.

## Consequences

### Positive
- one QM execution roadmap;
- one operational QM status source;
- cross-domain traceability without domain-authority transfer;
- reuse of existing tests/validators/gates;
- explicit evidence and drift handling.

### Trade-offs
- source roadmaps require granular takeover markers;
- mixed domain/QM items require separation;
- historical documents remain for traceability instead of destructive cleanup.

## Supersession impact package

This ADR introduces a new project execution authority; it does not supersede an existing ADR authority. Historical and domain documents are retained. Any future supersession discovered during QM review MUST be separately registered under ADR-0096 with explicit affected authority IDs, migration impact and non-authorizing legacy handling.

## Definition of Done

1. QM project directory exists.
2. ESS-0005 references it without changing Quality Center mutation boundaries.
3. ADR-0103 is registered.
4. Master roadmap contains the QM portfolio entry.
5. Active roadmaps are reviewed for duplicate quality execution.
6. Transferred quality subtasks use a takeover marker.
7. No work item has two operational QM status authorities.
8. The documented value-chain projection matches the existing 18-stage runtime implementation.
9. No parallel runtime architecture is introduced.