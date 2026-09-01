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

### [CROSS_PROJECT_HANDOFF -> CAPITAL-AI-OPS | VC-02] — User Lifecycle

- **project_namespace:** `PVC`
- **project_stage:** `PVC-02`
- **secondary_project_stage:** `PVC-08`
- **source_project:** `CAPITAL-AI-GOV`
- **source_task:** `GOV-CHAT-040` / `PR-OPS-ULS-HARNESS`
- **task:** implement the OPS-owned User-Lifecycle/provider harness and stable server-side authentication/billing test contract after the merged Governance decisions.
- **owner_scope:** Playwright/provider harness; Supabase Local Stack/Mailpit; Stripe Sandbox/Test Clocks; webhook/outbox/subscription projection tests; server-side auth and billing boundaries.
- **status:** `ACCEPTED_INTO_OPS_PLANNING / IMPLEMENTATION_IN_OPEN_PR_683 / NOT_IMPLEMENTED_BY_RECONCILIATION`.
- **active_writer:** PR #683 / `agent/operations-user-lifecycle-simulation-20260901`; eight separate Lifecycle implementation/test/evidence paths; no changed-file overlap with this reconciliation candidate.
- **required_return:** stable executable OPS test contract plus provider/runtime evidence for claims actually exercised; no Production mutation is implied.
- **authority:** Governance decisions remain Governance-owned; Frontend projection, Security verification and Compliance assessment remain with their respective owners.

The current Governance dependency map places Frontend after the stable OPS contract, and Security/Compliance after returned OPS/FE evidence. OPS therefore records those downstream dependencies but does not execute their foreign work. An open PR is candidate evidence only and does not satisfy the required return until merged and re-correlated.

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
- **status:** dependency. Current main includes merged PR #684 Governance hardening; OPS consumes that baseline but does not own its Authority.

## Conditional outbound — User Lifecycle

After `OPS-02-GOV-040` returns a stable OPS contract/evidence:

- Frontend lifecycle/pricing/entitlement projection remains `CAPITAL-AI-FE` work.
- Independent User-Lifecycle Security verification remains `CAPITAL-AI-SEC` work.
- Consumer/compliance assessment remains `CAPITAL-AI-COMP` work and does not become legal advice merely because technical evidence exists.
- Final owner-return correlation/closeout remains `CAPITAL-AI-GOV / PVC-05` work.

These are dependencies only. This OPS project does not mark them complete or implement them locally.

## Conditional outbound — R2-06 child remediation

If the protected-capability inventory identifies foreign productive code:

- Agent Client code → `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-CLIENT | VC-01]`, `project_stage: PVC-01`.
- Data code → target appropriate `CAPITAL-AI-DATA / PVC-09..11`.
- FinTech code → target appropriate `CAPITAL-AI-FINTECH / PVC-12..17`.

OPS records the dependency and does not absorb the implementation merely because the parent Security finding is routed through PVC-02.

## R2-11 boundary

`S1-R2-11` is currently `CAPITAL-AI-DATA / PVC-10` primary work. OPS must not implement it unless a separate handoff identifies concrete OPS-owned PR/trace tooling code. Until then it remains an external dependency only.
