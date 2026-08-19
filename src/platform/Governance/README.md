# CAPITAL-AI Governance

**Component:** `src/platform/Governance`  
**Authority ID:** `AUTH-GOV-CONTROL-PLANE`  
**Version:** `1.0.0`  
**Status:** foundation

This is the cross-cutting repository governance component. It owns reusable governance identities and contracts, not business-domain policy content.

## Responsibilities

- stable authority/control/evidence identity types;
- lifecycle and enforcement-level contracts;
- reusable policy-as-code interfaces;
- resolution contracts for current vs. historical authority;
- structural validation integration for repository governance;
- evidence trust-class definitions.

## Explicit non-responsibilities

- Documentation formatting/content generation belongs to `src/platform/Documentary`.
- Vocabulary/terminology belongs to `src/platform/Vocabulary`.
- Domain decisions remain in their ADR/ESS/domain components.
- Authentication/authorization enforcement remains in the corresponding IAM/security components.
- This component cannot authorize its own merge, capability elevation or production mutation.

## Dependency direction

Governance may expose stable contracts to Documentary, Traceability, Release, Supervisor and future adapters. Documentary Governance must not become the repository-wide authority implementation.

Machine-readable authority remains in:

- `/AGENTS.md`
- `docs/governance/authority-registry.json`
- `docs/governance/control-catalog.json`
- `docs/adr/registry.json`

The repository-level executable structural check is `scripts/governance/validateGovernanceControlPlane.mjs`.