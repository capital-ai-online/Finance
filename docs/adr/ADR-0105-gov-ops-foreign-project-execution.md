# ADR-0105 — GOV/OPS Foreign Project Execution Authority

**Authority ID:** `AUTH-ADR-GOV-OPS-FOREIGN-PROJECT-EXECUTION-2026-09-07`  
**Display ID:** `ADR-0105`  
**Version:** `1.0.0`  
**Status:** `OWNER-DIRECTED / ACCEPTED AFTER HUMAN MERGE`  
**Date:** `2026-09-07`  
**Decision owner:** Human Owner  
**Parent trust root:** `/AGENTS.md`  
**Scope:** repository implementation routing for `CAPITAL-AI-GOV` and `CAPITAL-AI-OPS`; project ownership and protected-authority boundaries remain unchanged

## Context

The canonical Project Value Chain assigns every productive PVC stage to one Primary Project Owner. Current project projections historically treat foreign-project implementation as owner-routed work. The Human Owner now authorizes `CAPITAL-AI-GOV` and `CAPITAL-AI-OPS` to execute bounded work packages that belong to another canonical project, without converting executor identity into Primary Ownership or domain authority.

This decision removes an execution-routing restriction only. It does not create a second Project Value Chain, second Governance plane, second runtime authority, or blanket protected-mutation delegation.

## Decision

`CAPITAL-AI-GOV` and `CAPITAL-AI-OPS` MAY implement bounded work packages whose canonical Primary Owner is another CAPITAL-AI project.

For every such work item, two identities remain explicit:

- **Executing Project:** `CAPITAL-AI-GOV` or `CAPITAL-AI-OPS`;
- **Target Project / Primary Owner:** the canonical project resolved from `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`.

The Target Project remains authoritative for its PVC ownership, Roadmap scope, applicable ADR/ESS contracts and domain-specific acceptance criteria. Execution by GOV/OPS does not transfer those authorities.

## Execution contract

Before implementation, the executor MUST resolve from then-current `main`:

1. Executing Project and project folder;
2. Target Project and target project folder;
3. Target Primary PVC and Primary Owner;
4. target Roadmap work item or explicit Human Owner scope;
5. applicable ADR/ESS/contracts;
6. open Pull Requests, active writers, changed-file overlap, semantic overlap, namespace/authority conflicts.

Unresolved Target Project, Primary Owner, scope, applicable authority, or conflicting writer remains fail-closed.

### Repository identity

A foreign work package remains **owned and classified by the Target Project** for branch and Pull Request identity. The branch project-folder slug and PR `PROJECT-ID` therefore use the Target Project's canonical mapping, while evidence records `CAPITAL-AI-GOV` or `CAPITAL-AI-OPS` as the executor.

This preserves current branch/PR ownership semantics and avoids manufacturing ownership through execution-client identity.

### Permitted implementation

Within the correlated target scope, GOV/OPS may modify target-project documentation, code, tests, configuration and evidence required to complete the bounded work package. They may also update the target Roadmap when the implementation and exit gate are actually complete.

### Preserved boundaries

This decision does **not** transfer or replace:

- Target Project Primary Ownership or PVC assignment;
- applicable ADR/ESS/domain authority;
- Security or Compliance independent verification authority;
- Human/Owner PR-creation gates except where another effective authority explicitly delegates them;
- Human/CODEOWNER-only merge;
- production, IAM, secret, billing, money, entitlement, destructive-data, DNS/TLS or other protected external-mutation controls;
- one-work-item/one-branch discipline;
- current-main/open-writer correlation;
- truthful validation/evidence requirements;
- law, regulation or binding contractual obligations.

GOV/OPS MUST NOT create a parallel architecture or substitute their own Governance/Operations semantics for the target project's accepted contracts.

## Supersession scope

**Type:** `partial`.

This decision supersedes only repository/project projection statements whose effect is to categorically prohibit GOV or OPS from implementing a foreign project's bounded work package.

**Targets:**

- `docs/projects/governance/README.md` foreign-PVC execution prohibition;
- `docs/projects/operations/README.md` foreign-work non-implementation rule;
- `docs/projects/PROJECT_VALUE_CHAIN.md` transitional statements that prohibit Governance from editing foreign project surfaces solely because they are foreign-owned;
- equivalent current Roadmap projection language when those files are next synchronized.

**Exclusions:** all ownership, authority, merge, Security/Compliance assurance and protected-mutation boundaries listed above.

No historical evidence is rewritten. Earlier owner-routing statements remain historical context for their prior baselines.

## Security and governance impact

This increases implementation routing flexibility and therefore requires explicit executor/target separation in evidence. Least privilege is preserved by keeping the work package bounded to the target Roadmap/contracts and by retaining independent protected-action and assurance gates. The main risk is accidental authority conflation; the mandatory dual identity and preserved-boundary rules are the mitigation.

## Operational impact

GOV and OPS can directly resolve stalled cross-project remediation or implementation work instead of stopping solely at an ownership handoff. Target projects no longer need to perform the repository edits themselves when GOV/OPS has been tasked to execute them.

This does not authorize bundling unrelated target projects into one branch or PR. Each bounded target-project work item remains separately correlated and project-classified.

## Rollback

Rollback uses a fresh Governance branch from then-current `main`, restores the prior foreign-work routing restriction, updates affected project projections and registries, and requires Human Merge. Historical execution evidence remains immutable.

## Definition of Done

1. this ADR is merged by the Human/CODEOWNER;
2. Governance and Operations project projections no longer categorically prohibit foreign implementation;
3. Project Value Chain text distinguishes execution delegation from ownership transfer;
4. governance registries/control projections are synchronized before merge-readiness;
5. applicable governance validators pass on the exact PR head;
6. Human/CODEOWNER merge remains mandatory.
