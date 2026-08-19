---
skill:
  id: ESS-0004
  name: Enterprise Version Manager
  version: 1.0.0
  status: Suspended
  owner: Platform Director
  category: Enterprise Architecture
  priority: Historical

classification:
  type: Suspended Component Specification
  role: Historical Version Manager specification
  contractAuthority: ADR-0096 / Release Control Plane
  note: >
    The former mutable Version Manager architecture is suspended and
    non-authorizing. The full original document remains preserved in Git history
    at blob 3515cf0f948a119921a4a7964a0ad3e69c238ba8.

suspension:
  date: 2026-08-19
  authority: AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19
  replacement:
    - package.json#version
    - src/platform/Release/Services/platformVersionControlPlane.ts
    - src/platform/Release/Services/releaseVersionGate.ts
  prohibitedLegacySemantics:
    - uploads/version_manager.json as current version authority
    - autonomous version bump endpoint
    - executeEnterpriseEventChain version mutation
    - automatic ADR/compliance/document generation from version changes
    - AGENTS.md as a product-version mirror
---

# ESS-0004 — Enterprise Version Manager — SUSPENDED

**Status:** `SUSPENDED`  
**Original Version:** `1.0.0`  
**Suspension Authority:** `ADR-0096 / AUTH-ADR-GOVERNANCE-CONTROL-PLANE-2026-08-19`  
**Original Git Blob:** `3515cf0f948a119921a4a7964a0ad3e69c238ba8`

## Suspension reason

The historical specification states that **“Der Version Manager bestimmt die Version”** and defines its own Version Registry, synchronizer, rollback planner, version events and a productive legacy implementation. The implemented legacy runtime additionally persisted `uploads/version_manager.json`, exposed a bump endpoint and coupled version changes to automatic document/ADR generation.

Those semantics conflict with the current repository architecture:

- `package.json#version` is the sole platform-version authority;
- the Release component owns the controlled version-transition gate under ADR-0030;
- `src/platform/Release/Services/platformVersionControlPlane.ts` exposes a read-only projection;
- README is a deterministic projection, not an authority;
- `AGENTS.md` contains an independent Governance Control Plane version and is not a product-version mirror;
- Documentary Governance validates documentation but does not mutate it as a side effect of version changes.

Therefore ESS-0004 is removed from the active `.ai/skills` namespace and retained only as historical evidence.

## Historical contract summary

The original ESS described these concepts:

- `VersionCalculator` for Major/Minor/Patch recommendations;
- a `VersionRegistry` storing repository/component/knowledge/architecture/documentation/twin versions;
- `VersionSynchronizer` for conflict detection;
- `RollbackPlanner`;
- `ChangelogGenerator`;
- version-related enterprise events and a Value Chain position above Documentary;
- integration with Documentary, Traceability, Supervisor, Platform Director and Release Center.

The original document itself already prohibited self-correction of contradictory states and delegated document generation to Documentary, but its statement that the Version Manager determines the version and its legacy runtime model are incompatible with the current single-authority design.

## Replacement architecture

```text
package.json#version                     <- sole platform-version authority
        |
        +--> Release Version Gate        <- explicit controlled mutation
        |
        +--> PlatformVersionControlPlane <- read-only runtime/API projection
        |
        +--> README projection           <- deterministic documentation projection

AGENTS.md Control Plane Version          <- separate governance metadata
```

`src/platform/VersionManager` may remain only as a thin compatibility namespace/HTTP adapter while legacy callers are migrated. It cannot own persistence, bump logic, document generation or a second authority.

## Reactivation

ESS-0004 must not be reactivated in place. A future version-management component would require a new explicit architecture decision compatible with ADR-0096 and the then-current Release Control Plane.
