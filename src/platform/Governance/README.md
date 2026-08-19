# CAPITAL-AI Governance

**Component:** `src/platform/Governance`  
**Authority ID:** `AUTH-GOV-CONTROL-PLANE`  
**Version:** `1.1.0`  
**Status:** foundation

This is the cross-cutting repository Governance component. It owns reusable governance identities and contracts, not business-domain policy content.

## Responsibilities

- stable authority/control/evidence identity types;
- lifecycle and enforcement-level contracts;
- reusable policy-as-code interfaces;
- current-versus-historical authority resolution contracts;
- structural validation integration;
- evidence trust-class definitions;
- single repository instruction-surface invariant;
- shared ADR namespace correlation contracts.

## Explicit non-responsibilities

- Documentation formatting/content generation belongs to `src/platform/Documentary`.
- Documentary hygiene implementation belongs to `src/platform/Documentary/Governance` within its domain boundary.
- Vocabulary/terminology belongs to `src/platform/Vocabulary`.
- Domain decisions remain in their ADR/ESS/domain components.
- Authentication/authorization enforcement remains in IAM/security components.
- This component cannot authorize its own merge, capability elevation or production mutation.
- It does not create provider-specific repository instruction mirrors.

## Dependency direction

Governance exposes stable contracts to Documentary, Traceability, Release, Supervisor and other consumers. Documentary Governance consumes those contracts and must not become the repository-wide authority implementation.

Machine-readable authority remains in:

- `/AGENTS.md`
- `docs/governance/authority-registry.json`
- `docs/governance/control-catalog.json`
- `docs/adr/registry.json`

The executable structural check is `scripts/governance/validateGovernanceControlPlane.mjs`.
