# CAPITAL-AI Operations

**Project ID:** `CAPITAL-AI-OPS`  
**Project folder:** `operations`  
**Role:** Primary Project Value Chain Owner  
**Primary stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`  
**Status:** ACTIVE — PROJECT EXECUTION SURFACE / NON-AUTHORIZING  
**Baseline:** `main@b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Trust root:** `/AGENTS.md`

## Purpose

`docs/projects/operations/` is the canonical organizational execution surface for CAPITAL-AI-OPS. It owns planning, coordination and evidence for the OPS-owned Project Value Chain stages without relocating or duplicating valid runtime components.

Folder-to-PVC ownership is defined only by `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`.

## Authority boundary

CAPITAL-AI-OPS owns execution, not repository-wide Governance authority.

- `/AGENTS.md` remains the repository trust root.
- Governance owns `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` and the DevelopmentChain policy.
- `package.json#version` remains the sole platform-version authority.
- `src/platform/VersionManager/**` remains read-only compatibility.
- `src/platform/Release/**` remains the canonical Release implementation and contains the controlled Release Version Gate.
- Supervisor observes, evaluates and escalates; it does not make protected decisions.
- EventMesh transports/validates/routes events; it creates no authority.
- Traceability links evidence/relationships; it is non-deciding and non-authorizing.
- Human/Owner PR creation approval and Human/CODEOWNER merge remain separate gates.
- Production mutation requires separate current authorization.

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
| `runbooks/` | references to existing operational procedures; no duplicate runbook authority |
| `evidence/` | project-local correlation/evidence records |

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

These are organizational boundaries. Existing runtime components stay in their canonical `src/platform/**` locations unless a separate architecture package proves relocation is necessary.

## Security handoff integration

CAPITAL-AI-SEC PR #631 routes the following current findings to OPS:

- `S1-R2-03` → `PVC-06` Version Management;
- `S1-R2-04` → `PVC-04` Supervisor, with `PVC-08` runtime recovery evidence;
- `S1-R2-05` → `PVC-02` Controlled Implementation;
- `S1-R2-06` → `PVC-02` parent entitlement inventory/coordination;
- `S1-R2-07` → `PVC-08` Production Operations;
- `S1-R2-09` → `PVC-08` Production Operations, waiting for promotion evidence;
- `S1-R2-10` → `PVC-08` Production Operations, waiting for post-deploy evidence.

Security owns the findings, threat/control definitions, negative-test expectations and independent Security verification. OPS may report `IMPLEMENTED` or `EVIDENCE_READY`; only CAPITAL-AI-SEC may report Security `VERIFIED/CLOSED`.

## Foreign work rule

Any discovered remediation outside OPS-owned productive scope is not implemented here. Ownership is resolved from the folder-to-PVC mapping only.
