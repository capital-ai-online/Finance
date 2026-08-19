---
skill:
  id: SKILL-GOV-0001
  name: Documentation Governance Validator
  version: 1.1.0
  status: Enterprise Approved
  owner: Documentary Engine
  category: Documentation Governance
  priority: High

capital_ai:
  platform: CAPITAL-AI Core
  repository: Finance
  lifecycle: AI Native Development Lifecycle

classification:
  type: Operational Skill
  role: Provider-neutral execution guidance for documentation-governance checks
  specification: ESS-0012
  contractAuthority: ESS-0012-CONTRACTS
  globalTrustRoot: AGENTS.md
  globalGovernanceComponent: src/platform/Governance
  note: >
    This skill is not an ESS, ADR, global policy or authorization source. It only explains
    how to apply documentation-domain validation. AGENTS.md and the Governance Control Plane
    resolve repository-wide authority and protected-action boundaries.

authority:
  controls:
    - Documentation validation execution
    - Documentation finding generation
    - Documentation report input generation
  cannot_modify:
    - Enterprise Specifications
    - Architecture Decision Records
    - Enterprise Contracts
    - Governance authority registries
    - Governance control catalog
    - Documentation source content during the same unreviewed validation step
    - Knowledge Graph
    - Digital Twin
    - Repository or production authorization state

crossReference:
  dependsOn:
    - AGENTS.md
    - ESS-0012
    - ESS-0012-CONTRACTS
    - src/platform/Governance
  relatedComponents:
    - src/platform/Documentary/Governance
  relatedSkills:
    - .ai/skills/ESS-0012-Documentation-Governance.md
    - .ai/skills/ESS-0012-Contracts.md

created: 2026-07-31
updated: 2026-08-19
---

# Documentation Governance Validator

## Purpose

`SKILL-GOV-0001` is the operational adapter for the **documentation-domain** validator defined by ESS-0012 and ESS-0012-CONTRACTS.

It does not define repository-wide governance and is not a second Agent Trust Root. Every model, coding agent, MCP host and automation client resolves `/AGENTS.md` first. Repository-wide stable authority/control identity is resolved by `src/platform/Governance` and the canonical registries.

## Core rule

> The documentation validator detects and reports documentary findings. It does not authorize, approve or mutate protected state.

Validation output is evidence. It does not authorize PR creation, Human Merge, production deployment, IAM changes, billing changes or external provider mutation.

## Scope

The skill may apply ESS-0012 documentation rules to:

- canonical document placement;
- document registry structure and target existence;
- required metadata, version, language and lifecycle;
- documentary references to ADR/ESS/contracts;
- documentation completeness and structural consistency;
- documentation-related traceability findings;
- generated documentation/report hygiene.

Global authority conflicts, stable `AUTH-*`/`CTRL-*` identity, Human Merge and protected mutation decisions are outside this skill and belong to the Governance Control Plane.

## Execution sequence

```text
1. Resolve /AGENTS.md and effective global controls.
2. Load ESS-0012 and ESS-0012-CONTRACTS for documentation-domain rules.
3. Determine the changed documentation scope.
4. Execute applicable documentary checks.
5. Record findings with stable rule ID, severity and evidence.
6. Report non-verifiable checks explicitly rather than inventing PASS evidence.
7. Re-run affected checks after a correction before closure.
```

The skill must not create new validation rules ad hoc. New global governance controls belong in the Control Catalog; new documentary rules require the effective ESS/contract change process.

## Trigger model

Run documentation validation when required by the effective control/check classification, especially after:

- documentation creation or material metadata changes;
- ADR/ESS changes affecting documentary references;
- document registry changes;
- release/version changes that project into documentation;
- repository hygiene changes;
- explicit pre-release documentation checks.

A generic value-chain handoff does not independently become a new authorization gate merely because this skill exists.

## Finding evidence

A finding must contain reproducible evidence such as a file/path reference, registry entry, stable authority/control reference, traceability link or version value. If evidence cannot be obtained, report `NOT_AVAILABLE` / non-verifiable state instead of fabricating a finding or PASS.

## Boundary with the Governance Control Plane

```text
/AGENTS.md
   |
   v
src/platform/Governance
   |  stable authority/control resolution
   |
   +--> src/platform/Documentary/Governance
          |
          +--> SKILL-GOV-0001 operational documentation checks
```

The documentation layer consumes global identity/authority. It never supersedes it.

## Provider neutrality

This operational skill does not maintain a separate list of current AI providers. All active/retired model or agent profiles are resolved from the current Agent Trust Root and effective capability-plane controls. Provider/model identity never changes documentary rule severity or grants authority.

## Implementation state

The canonical global structural validator is `scripts/governance/validateGovernanceControlPlane.mjs` and is separate from this documentation-domain skill.

PR #439 contains reusable `DocumentationHygieneValidator` implementation work. It remains parked while the Governance Control Plane is established. After Governance merge, that implementation should be synchronized and adapted to this documentation-only boundary rather than recreated.

## Version history

| Version | Date | Status | Change |
|---|---|---|---|
| 1.0.0 | 2026-07-31 | Enterprise Approved | Initial operational skill |
| 1.1.0 | 2026-08-19 | Enterprise Approved | Subordinated to `/AGENTS.md`; removed stale provider-specific/global handoff policy; narrowed to documentation-domain validation |
