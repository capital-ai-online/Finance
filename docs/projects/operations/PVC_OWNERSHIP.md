# CAPITAL-AI-OPS PVC Ownership

**Namespace:** `PVC-*`  
**Project:** `CAPITAL-AI-OPS`  
**Role:** organizational ownership projection / non-authorizing

## Primary ownership

| PVC | Stage | Owner | OPS subdomain |
|---|---|---|---|
| `PVC-02` | Controlled Implementation | `CAPITAL-AI-OPS` | `controlled-implementation` |
| `PVC-04` | Supervisor | `CAPITAL-AI-OPS` | `supervisor` |
| `PVC-06` | Version Management | `CAPITAL-AI-OPS` | `version-management` |
| `PVC-07` | Release Management | `CAPITAL-AI-OPS` | `release-management` |
| `PVC-08` | Production Operations | `CAPITAL-AI-OPS` | `production-operations` |
| `PVC-18` | EventMesh / Traceability | `CAPITAL-AI-OPS` | `eventmesh` + `traceability` |

## Foreign stages

- `PVC-01` → CAPITAL-AI-CLIENT
- `PVC-03` → CAPITAL-AI-DOC
- `PVC-05` → CAPITAL-AI-GOV
- `PVC-09..PVC-11` → CAPITAL-AI-DATA
- `PVC-12..PVC-17` → CAPITAL-AI-FINTECH

Security, Quality, Compliance, Frontend, SEO and Social are cross-cutting/consumer projects and gain no productive PVC ownership solely by validating or presenting work.

## Namespace compatibility

Repository handoff markers retain `VC-<NN>` for compatibility. Every current handoff must additionally state:

- `project_namespace: PVC`
- `project_stage: PVC-<NN>`

The marker must not be confused with technical `VC-*` stages under `SC-MD-SPT-0001`.

## Operational boundaries

- PVC-02 owns execution coordination, not all domain code.
- PVC-04 Supervisor cannot make protected decisions.
- PVC-06 owns organizational version operations but not a second version source.
- PVC-07 Release remains distinct from Production deployment.
- PVC-08 owns runtime operations/evidence within current protected-action gates.
- PVC-18 transports and links evidence/events but does not authorize decisions, release or deployment.
