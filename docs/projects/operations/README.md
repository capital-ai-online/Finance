# CAPITAL-AI Operations

**Project ID:** `CAPITAL-AI-OPS`  
**Project folder:** `operations`  
**Role:** Primary Project Value Chain Owner  
**Primary stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`  
**Status:** ACTIVE — PROJECT EXECUTION SURFACE / NON-AUTHORIZING  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`

## Purpose

`docs/projects/operations/` is the canonical organizational execution surface for CAPITAL-AI-OPS. It owns planning, coordination and evidence for the OPS-owned Project Value Chain stages without relocating or duplicating valid runtime components.

Folder-to-PVC ownership is defined only by `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`. Development procedure is defined only by `/AGENTS.md@CURRENT_MAIN`; project documents remain non-authorizing planning/evidence projections.

## Authority boundary

CAPITAL-AI-OPS owns implementation for its mapped Primary PVC scope. It has no generic foreign-project implementation authority. When OPS detects work whose implementation/Authority belongs to another project, it emits the owner-correct handover required by `/AGENTS.md@CURRENT_MAIN`.

- `package.json#version` remains the sole platform-version authority where applicable contracts say so.
- `src/platform/VersionManager/**` remains read-only compatibility unless a later authoritative contract changes it.
- `src/platform/Release/**` remains the canonical Release implementation boundary.
- Supervisor observes/evaluates/escalates; it does not manufacture protected decision authority.
- EventMesh is a read-only runtime projection for development state/evidence/handover and creates no approval/merge authority.
- Traceability links evidence/relationships; it is non-deciding and non-authorizing.
- Protected production mutation requires its own applicable authorization.

## Canonical project documents

| Document | Role |
|---|---|
| `ROADMAP.md` | canonical OPS work graph / roadmap projection |
| `PVC_OWNERSHIP.md` | exact PVC ownership and boundaries |
| `WORK_PACKAGES.md` | bounded OPS work packages |
| `CROSS_PROJECT_DEPENDENCIES.md` | inbound/outbound dependencies |
| `SECURITY_HANDOFFS.md` | Security requirements and owner-correct returns |
| `MIGRATION_MATRIX.md` | previous OPS projection → canonical project surface mapping |
| `runbooks/` | operational procedures within delegated subject scope; no development-policy authority |
| `evidence/` | project-local correlation/evidence records |

The former `DEVELOPMENT_CHAIN.md` execution projection is retired/removed by the governance migration and is not a canonical OPS development document.

## Bounded subdomains

- `controlled-implementation/`
- `supervisor/`
- `version-management/`
- `release-management/`
- `production-operations/`
- `eventmesh/`
- `traceability/`
- `evidence/`
- `work-packages/`

These are organizational/runtime boundaries. They do not create additional development governance.

## Security handoff integration

Security owns Security requirements, findings, negative-test expectations and independent Security verification. OPS implements OPS-owned remediation returned through an owner-correct handover. `IMPLEMENTED`/`EVIDENCE_READY` do not become Security `VERIFIED/CLOSED` without the required independent verification evidence.

## Cross-project rule

OPS may discover and correlate foreign work but MUST NOT silently implement foreign-owner scope merely because it has repository access or an older delegation document exists. The owner-correct handover carries Source/Target Project and Owner, correlation ID, completed/remaining scope, dependencies, evidence, exit gate and continuation condition. Missing/conflicting target authority remains fail-closed.
