# Quality

## Enterprise Component

Status: Partial Implementation

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

`src/platform/Quality` is the execution and aggregation boundary defined by ESS-0005. It executes quality measurements; it does not define domain rules, severities, authorities or release permissions.

The P0-P2 repository-quality baseline introduces a read-only `RepositoryQualityCoordinator` that aggregates normalized evidence supplied by adapters. The coordinator depends only on the neutral Governance evidence contract and does not directly import Release, Documentary, VersionManager or Vocabulary implementations.

## Implemented Baseline — P0-P2

- P0: shared `repository-quality-observation/1.0.0` evidence contract in `src/platform/Governance/Contracts/RepositoryQualityEvidence.ts`;
- P1: `RepositoryQuality/RepositoryQualityCoordinator.ts` with deterministic domain ordering, aggregation and fail-closed `NOT_AVAILABLE` evidence;
- P2: composition-layer adapters for existing platform-version, documentation-hygiene, repository-convention and vocabulary validators;
- CLI composition root: `npm run repository:quality:check`;
- no source mutation, no auto-fix, no merge/release/deploy authorization.

The broader ESS-0005 target (full validator registry, all eight quality gates, score calculator, technical-debt register and coverage collector) remains incremental and must not be inferred as implemented from this baseline.

## Boundary

```text
Governance evidence contract
        |
        v
RepositoryQualityCoordinator (Quality)
        ^
        |
composition adapters
   |      |       |       |
Release  Docs  Repository Vocabulary
```

Adapters translate existing validator output only. They may not introduce new rules or override the owning domain's authority.

## ESS Reference

- ESS-0001
- ESS-0001-CONTRACTS
- ESS-0005 — Quality Center
- ESS-0012 — Documentation Governance
- ESS-0017 — Vocabulary Governance

## ADR References

- ADR-0016 — ESS Component Specifications
- ADR-0030 — Release Version Gate
- ADR-0096 — Governance Control Plane / single authority boundary

## Dependencies

- `src/platform/Governance` — shared non-authorizing evidence contract.

Domain validators are supplied through composition adapters outside the Quality component and therefore do not become direct Quality dependencies.

## Events

None in P0-P2. Repository-quality observation is synchronous/read-only evidence and does not synthesize EventMesh events.
