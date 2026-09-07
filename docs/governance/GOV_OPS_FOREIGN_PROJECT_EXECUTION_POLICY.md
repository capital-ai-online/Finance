# GOV/OPS Foreign Project Execution Policy

**Authority ID:** `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`  
**Control ID:** `CTRL-GOV-OPS-FOREIGN-EXEC-001`  
**Version:** `1.0.0`  
**Status:** `OWNER-DIRECTED — effective after Human Merge`  
**Date:** `2026-09-07`  
**Decision owner:** Human Owner  
**Parent trust root:** `/AGENTS.md`  
**Scope:** bounded repository implementation delegation for `CAPITAL-AI-GOV` and `CAPITAL-AI-OPS`; project routing, ownership and protected-authority boundaries remain unchanged

## Purpose

Authorize `CAPITAL-AI-GOV` and `CAPITAL-AI-OPS` to implement bounded work packages that canonically belong to another CAPITAL-AI project, without turning executor identity into Primary Ownership, domain authority, assurance authority, merge authority or protected-mutation authority.

This policy is **not** a Project Value Chain routing overlay and does not replace the canonical project-folder/PVC mapping. `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` continue to resolve the Target Project, Target PVC and Primary Owner. This policy only changes who may perform the bounded repository implementation after that canonical target has been resolved.

## Decision

`CAPITAL-AI-GOV` and `CAPITAL-AI-OPS` MAY implement bounded work packages whose canonical Target Project / Primary Owner is another CAPITAL-AI project.

For every such work item, evidence and correlation MUST distinguish:

- **Executing Project:** `CAPITAL-AI-GOV` or `CAPITAL-AI-OPS`;
- **Target Project:** canonical project resolved from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`;
- **Target Primary PVC / Primary Owner:** unchanged by the execution delegation.

The Target Project remains authoritative for its Roadmap scope, applicable ADR/ESS/contracts and domain-specific acceptance criteria.

## Required precheck

Before implementation, resolve from then-current `main`:

1. Executing Project and project folder;
2. Target Project and target project folder;
3. Target Primary PVC and Primary Owner;
4. target Roadmap work item or explicit Human Owner scope;
5. applicable ADR/ESS/contracts;
6. open Pull Requests and relevant active writers/claims;
7. changed-file, semantic, namespace and authority overlap.

Unresolved target identity, ownership, scope, applicable authority or conflicting writer remains fail-closed.

## Repository identity

Foreign execution does not change project ownership metadata or project routing.

The branch project-folder slug and Pull Request `PROJECT-ID` remain derived from the **Target Project / Primary Owner** under the current Trust Root. Evidence records GOV or OPS as the executing project where relevant.

A single branch/PR MUST NOT bundle unrelated work packages from multiple Target Projects solely because the same GOV/OPS executor performs them.

## Permitted implementation

Within the correlated target scope, GOV/OPS may:

- modify target-project documentation;
- modify application/runtime code required by the target work package;
- add or update tests and configuration;
- add implementation/evidence records;
- perform bounded remediation owned by the Target Project;
- update the Target Project Roadmap when implementation and its exit gate are actually complete.

GOV/OPS MUST follow the target project's applicable ADR/ESS/contracts and MUST NOT substitute parallel Governance/Operations semantics for them.

## Preserved boundaries

This policy does **not** transfer or replace:

- Target Project Primary Ownership or PVC assignment;
- canonical project-folder/PVC routing;
- applicable ADR/ESS/domain authority;
- Security or Compliance independent verification authority;
- Human/Owner PR-creation gates except where another effective authority explicitly delegates that exact surface;
- Human/CODEOWNER-only merge;
- production, IAM, secret, billing, money, entitlement, destructive-data, DNS/TLS or other protected external-mutation controls;
- one-work-item/one-branch discipline;
- current-main/open-writer correlation;
- truthful validation/evidence requirements;
- law, regulation or binding contractual obligations.

No agent may use this policy to self-elevate beyond the bounded work package or to claim Target Project acceptance/verification authority that belongs to another owner.

## Projection supersession

This policy does **not** supersede `/AGENTS.md`, the Project Value Chain mapping, an ADR, an ESS or another stable `AUTH-*` authority. No cross-authority supersession edge is created.

It supersedes only lower-tier/non-authorizing project projection wording whose sole effect is to categorically prohibit `CAPITAL-AI-GOV` or `CAPITAL-AI-OPS` from performing a bounded foreign-project implementation after the canonical Target Project has already been resolved.

### Targeted current projections

- `docs/projects/governance/README.md` — foreign-PVC execution prohibition;
- `docs/projects/operations/README.md` — foreign-work non-implementation rule;
- `docs/projects/PROJECT_VALUE_CHAIN.md` — transitional wording that prohibited Governance from editing a foreign project surface solely because it was foreign-owned;
- equivalent current Roadmap projection language only when those Roadmaps are next synchronized against then-current authority.

### Explicit exclusions

Primary Ownership, PVC mapping, canonical routing, domain authority, Security/Compliance assurance, branch/PR Target Project identity, Human merge, protected external mutations, provider permissions and all higher obligations remain unchanged.

Historical evidence is retained as historical context and is not rewritten.

## Security and governance impact

The change expands who may perform repository implementation, but not who owns or authorizes the target domain. The primary risk is executor/owner conflation. Mandatory dual identity, target-contract correlation, preserved assurance gates and fail-closed overlap checks constrain that risk.

## Rollback

Rollback uses a fresh Governance branch from then-current `main`, restores the prior foreign-execution restriction on the affected current projections, synchronizes this policy's lifecycle/registry projection as required, and requires Human Merge. Historical foreign-execution evidence remains immutable.

## Definition of Done

- this policy and its stable Authority/Control IDs are present on the exact branch state;
- Governance and Operations current project projections no longer categorically prohibit foreign implementation;
- Project Value Chain wording distinguishes execution delegation from ownership transfer and routing;
- governance registry/control projection is synchronized before merge-readiness;
- applicable governance checks pass on the exact branch/PR head where an execution host is available;
- Human/CODEOWNER merge remains mandatory.
