# CAPITAL-AI Operations

**Project ID:** `CAPITAL-AI-OPS`  
**Project folder:** `operations`  
**Role:** Primary Project Value Chain Owner  
**Primary stages:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`  
**Status:** ACTIVE — PROJECT EXECUTION SURFACE / NON-AUTHORIZING  
**Baseline:** `main@6dea22e5b8c4f2b0b9c9fbfb73615738acf57a54`  
**Trust root:** `/AGENTS.md`

## Purpose

`docs/projects/operations/` is the canonical organizational execution surface for CAPITAL-AI-OPS. It owns planning, coordination and evidence for the OPS-owned Project Value Chain stages without relocating or duplicating valid runtime components.

This project surface implements the target organization defined by `docs/projects/PROJECT_EXECUTION_MODEL.md` and consumes the Governance handoff in `docs/projects/governance/P2_DEVELOPMENT_CHAIN_HANDOFF.md`.

Per `docs/projects/ROADMAP_REGISTRY.md`, `docs/projects/operations/ROADMAP.md` is the sole organizational project execution/status roadmap for CAPITAL-AI-OPS. Detailed DevelopmentChain, Security, Systemadmin and technical roadmaps remain bounded detail/evidence sources and do not become competing OPS project-status authorities.

## Current-main reconciliation — 2026-09-01

- PR #632 materialized the canonical OPS project surface and Security handoff projection; its historical writer is already `released/non-exclusive`.
- PR #642 merged the OPS-owned Alpha Vantage repository secret/deployment-control-plane consolidation. Its stale post-merge writer metadata is terminalized by the current reconciliation package; this does not assert or perform a Production secret/deploy mutation.
- PR #648 merged the fail-closed one-hour branch-cleanup hardening and is current `PVC-02` Controlled Implementation evidence for repository branch lifecycle.
- `GOV-CHAT-040` / `PR-OPS-ULS-HARNESS` is an accepted inbound Governance handoff to `PVC-02` with secondary `PVC-08` runtime/provider evidence. Its separate productive implementation is now represented by open PR #683 on eight non-overlapping Lifecycle paths; this reconciliation does not absorb or modify that writer scope.
- PR #684 merged Governance-only ADR-0104 session/merge-boundary hardening into current `main`; it changes no OPS project path and is consumed as a Governance baseline only.
- Downstream Frontend, Security and Compliance lifecycle work remains outside OPS ownership. OPS returns stable test/runtime evidence; the respective Primary Owners retain implementation, verification and assessment authority.

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
| `ROADMAP.md` | sole organizational OPS execution/status projection |
| `DEVELOPMENT_CHAIN.md` | DC lifecycle integration and execution ownership |
| `PVC_OWNERSHIP.md` | exact PVC ownership and boundaries |
| `WORK_PACKAGES.md` | bounded OPS backlog |
| `CROSS_PROJECT_DEPENDENCIES.md` | inbound/outbound project handoffs |
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

Any discovered remediation outside OPS-owned productive scope is not implemented here. It is routed with the repository handoff contract and remains `REFERRED_NOT_EXECUTED` until the actual Primary Owner acts.
