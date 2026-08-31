# CAPITAL-AI-OPS Project Surface Migration Matrix

**Current target:** `docs/projects/operations/`  
**Source candidate:** historical unmerged branch `docs/capital-ai-ops-consolidation-20260831`  
**Reason:** current main established `docs/projects/` as canonical project organization after the earlier OPS candidate was created.

## Decision

The earlier candidate is reused as design/input evidence but is not merged as a parallel `docs/operations/` project surface. Current-main project contracts require the OPS project to materialize at `docs/projects/operations/`.

## Mapping

| Previous candidate surface | Canonical target |
|---|---|
| `docs/operations/README.md` | `docs/projects/operations/README.md` |
| `docs/operations/CAPITAL_AI_OPERATIONS_ROADMAP.md` | `docs/projects/operations/ROADMAP.md` |
| operations value-chain ownership content | `PVC_OWNERSHIP.md` with explicit `PVC-*` namespace |
| cross-roadmap/project dependency content | `CROSS_PROJECT_DEPENDENCIES.md` |
| V2.1 work packages | `WORK_PACKAGES.md` + `work-packages/README.md` |
| prior evidence baseline | `evidence/` |
| controlled implementation subdomain | `controlled-implementation/` |
| Supervisor subdomain | `supervisor/` |
| Version Management subdomain | `version-management/` |
| Release Management subdomain | `release-management/` |
| Production Operations subdomain | `production-operations/` |
| EventMesh subdomain | `eventmesh/` |
| Traceability subdomain | `traceability/` |
| prior runbook inventory | `runbooks/README.md` referencing canonical existing runbooks |

## Semantic corrections from current main

1. Organizational stages are `PVC-*`; unqualified `VC-*` is retained only inside compatibility handoff markers.
2. `docs/projects/operations/ROADMAP.md` is the target canonical OPS roadmap referenced by CAPITAL-AI-SEC.
3. Security findings are requirements/handoffs; CAPITAL-AI-SEC keeps independent verification.
4. S1-R2-11 is DATA/PVC-10 primary work, not an OPS-owned finding by default.
5. Branch naming now uses `agent/operations-<task>-YYYYMMDD` for new OPS branches.
6. Existing valid runtime components are not physically moved into a monolithic Operations code tree.

## Preservation

No merged historical DevelopmentChain, S1, Supervisor, Release, EventMesh or Traceability evidence is deleted. The previous candidate branch remains Git history/input and does not become a second current project path.
