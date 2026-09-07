# GOV/OPS Foreign Project Execution Policy

**Authority ID:** `AUTH-GOV-OPS-FOREIGN-PROJECT-EXECUTION`  
**Control ID:** `CTRL-GOV-OPS-FOREIGN-EXEC-001`  
**Version:** `1.0.0`  
**Status:** `OWNER-DIRECTED — effective after Human Merge`  
**Date:** `2026-09-07`  
**Decision owner:** Human Owner  
**Parent trust root:** `/AGENTS.md`  
**Scope:** repository implementation routing for `CAPITAL-AI-GOV` and `CAPITAL-AI-OPS`; project ownership and protected-authority boundaries remain unchanged

## Purpose

Authorize `CAPITAL-AI-GOV` and `CAPITAL-AI-OPS` to implement bounded work packages that canonically belong to another CAPITAL-AI project, without turning executor identity into Primary Ownership, domain authority, assurance authority, merge authority or protected-mutation authority.

This policy is a scoped execution-routing authority under the current Trust Root and the Governance Control Plane. It does not create a second Project Value Chain, routing hierarchy, orchestrator, Governance plane or runtime authority.

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

Foreign execution does not change project ownership metadata.

The branch project-folder slug and Pull Request `PROJECT-ID` remain derived from the **Target Project / Primary Owner** under the current Trust Root. Evidence records GOV or OPS as the executing project/client where relevant.

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

## Partial supersession

**Type:** `partial`.

This policy supersedes only current repository/project projection statements whose effect is to categorically prohibit `CAPITAL-AI-GOV` or `CAPITAL-AI-OPS` from implementing a bounded foreign-project work package.

### Targeted current surfaces

- `docs/projects/governance/README.md` — foreign-PVC execution prohibition;
- `docs/projects/operations/README.md` — foreign-work non-implementation rule;
- `docs/projects/PROJECT_VALUE_CHAIN.md` — statements that prohibit Governance from editing foreign project surfaces solely because they are foreign-owned;
- equivalent current Roadmap projection language when synchronized against this policy.

### Explicit exclusions

Primary Ownership, PVC mapping, domain authority, Security/Compliance assurance, branch/PR Target Project identity, Human merge, protected external mutations, provider permissions and all higher obligations remain unchanged.

Historical evidence is retained as historical context and is not rewritten.

## Security and governance impact

The change expands who may perform repository implementation, but not who owns or authorizes the target domain. The primary risk is executor/owner conflation. Mandatory dual identity, target-contract correlation, preserved assurance gates and fail-closed overlap checks constrain that risk.

## Rollback

Rollback uses a fresh Governance branch from then-current `main`, restores the prior routing restriction on the affected current surfaces, synchronizes this policy's lifecycle/registry projection as required, and requires Human Merge. Historical foreign-execution evidence remains immutable.

## Definition of Done

- this policy and its stable Authority/Control IDs are present on the exact branch state;
- Governance and Operations current project projections no longer categorically prohibit foreign implementation;
- Project Value Chain wording distinguishes execution delegation from ownership transfer;
- governance registry/control projection is synchronized before merge-readiness where required by the current validator;
- applicable governance checks pass on the exact PR head;
- Human/CODEOWNER merge remains mandatory.
