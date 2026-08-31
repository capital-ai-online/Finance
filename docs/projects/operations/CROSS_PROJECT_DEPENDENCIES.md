# CAPITAL-AI-OPS Cross-Project Dependencies

**Project:** `CAPITAL-AI-OPS`  
**Contract:** `docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md`

## Inbound — Governance

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02` spanning OPS-owned PVC-04/06/07/08/18 lifecycle integration
- **source_project:** `CAPITAL-AI-GOV`
- **task:** materialize `docs/projects/operations/` and integrate the existing DevelopmentChain as project execution lifecycle.
- **status:** accepted into OPS project planning; implementation evidence is this project surface.
- **authority:** DevelopmentChain policy remains Governance-owned.

## Inbound — Security

CAPITAL-AI-SEC PR #631 provides direct findings for OPS at PVC-02/04/06/08. Detailed records: `SECURITY_HANDOFFS.md`.

Security does not transfer Security verification authority. Returned evidence uses `[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]`.

## Outbound — Documentary

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-DOC | VC-03]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-03`
- **target_project:** `CAPITAL-AI-DOC`
- **task:** Documentary/evidence lifecycle where DOC ownership is required.
- **status:** dependency; OPS does not implement DOC-owned semantics.

## Outbound — Governance / Platform Director

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]

- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **target_project:** `CAPITAL-AI-GOV`
- **task:** protected Platform Director/Governance decision and policy reconciliation.
- **status:** dependency.

## Conditional outbound — R2-06 child remediation

If the protected-capability inventory identifies foreign productive code:

- Agent Client code → `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]`, `project_stage: PVC-01`.
- Data code → target appropriate `CAPITAL-AI-DATA / PVC-09..11`.
- FinTech code → target appropriate `CAPITAL-AI-FINTECH / PVC-12..17`.

OPS records the dependency and does not absorb the implementation merely because the parent Security finding is routed through PVC-02.

## R2-11 boundary

`S1-R2-11` is currently `CAPITAL-AI-DATA / PVC-10` primary work. OPS must not implement it unless a separate handoff identifies concrete OPS-owned PR/trace tooling code. Until then it remains an external dependency only.
