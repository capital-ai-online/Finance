# CAPITAL-AI Operations

**Project ID:** `CAPITAL-AI-OPS`  
**Project folder:** `operations`  
**Role:** Primary Project Value Chain Owner  
**Primary stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`  
**Status:** ACTIVE — PROJECT EXECUTION SURFACE / NON-AUTHORIZING  
**Baseline:** `main@75c926f12ae514036aa508ea8faf1a82b1a91059`  
**Trust root:** `/AGENTS.md`

## Purpose

`docs/projects/operations/` is the canonical organizational execution surface for CAPITAL-AI-OPS. It owns planning, coordination and evidence for the OPS-owned Project Value Chain stages without relocating or duplicating valid runtime components.

Folder-to-PVC ownership is defined only by `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`.

## Authority boundary

CAPITAL-AI-OPS owns its primary PVC execution, not repository-wide Governance authority. Under `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`, OPS may execute bounded foreign-project work while preserving the Target Project/PVC/Primary Owner and all assurance/protected-action boundaries.

- `/AGENTS.md` remains the repository trust root.
- Governance owns the DevelopmentChain policy and protected decision controls.
- `package.json#version` remains the sole platform-version authority.
- `src/platform/VersionManager/**` remains read-only compatibility.
- `src/platform/Release/**` remains the canonical Release implementation.
- Supervisor, EventMesh and Traceability create no protected decision authority.
- PR creation approval and Human/CODEOWNER merge remain separate gates.
- Production/provider mutation requires separate current authorization.

## Canonical project documents

| Document | Role |
|---|---|
| `ROADMAP.md` | canonical OPS execution projection |
| `DEVELOPMENT_CHAIN.md` | DC lifecycle integration and execution ownership |
| `PVC_OWNERSHIP.md` | exact PVC ownership and boundaries |
| `WORK_PACKAGES.md` | bounded OPS backlog |
| `CROSS_PROJECT_DEPENDENCIES.md` | inbound/outbound project dependencies |
| `SECURITY_HANDOFFS.md` | CAPITAL-AI-SEC requirements and return contract |
| `MIGRATION_MATRIX.md` | previous OPS projection → canonical project surface mapping |
| `runbooks/` | references to existing operational procedures |
| `evidence/` | project-local correlation/evidence records |
| `work-packages/` | bounded implementation/evidence packages |

## Security handoff integration

CAPITAL-AI-SEC routes current OPS-relevant findings to the mapped OPS stages: S1-R2-03 (PVC-06), R2-04 (PVC-04 + PVC-08 evidence), R2-05/R2-06 (PVC-02), and R2-07/R2-09/R2-10 (PVC-08). Security owns independent verification; OPS does not claim Security `VERIFIED/CLOSED`.

## Current execution focus

Current Roadmap correlation records:

- qs `6.16.0` remediation from PR #828 as `IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL`;
- fatal-process repository contract as `REPOSITORY_CONTRACT_VERIFIED` after Security PR #832, with post-deploy evidence still open;
- Node convergence as non-executable until effective Governance/ADR authority resolves the 24.18.0/24.20.0 conflict;
- `OPS-08-SEC-07` Recovery/RPO/RTO as highest executable local OPS Security/Data-Integrity work because RPO evaluator PR #802 is closed unmerged and its implementation is absent from current main.

See `ROADMAP.md`, `WORK_PACKAGES.md` and `evidence/OPS_POST_828_PRIORITY_RECORRELATION_2026-09-07.md` for the exact snapshot.

## Foreign work rule

OPS may implement bounded foreign-project work under current effective authority only after resolving Target Project, Target PVC/Primary Owner, target Roadmap, applicable ADR/ESS/contracts and current writer/overlap state. Missing/conflicting target authority is fail-closed.
