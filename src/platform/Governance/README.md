# CAPITAL-AI Governance

**Component:** `src/platform/Governance`  
**Authority ID:** `AUTH-GOV-CONTROL-PLANE`  
**Version:** `1.2.0`  
**Status:** foundation

This is the cross-cutting repository Governance component. It owns reusable governance identities and contracts, not business-domain policy content and not validator execution.

## Responsibilities

- stable authority/control/evidence identity types;
- lifecycle and enforcement-level contracts;
- reusable policy-as-code interfaces;
- current-versus-historical authority resolution contracts;
- structural validation integration;
- evidence trust-class definitions;
- single repository instruction-surface invariant;
- shared ADR namespace correlation contracts;
- provider-neutral, non-authorizing repository-quality evidence contracts.

## Repository Quality Evidence Contract

`Contracts/RepositoryQualityEvidence.ts` defines `repository-quality-observation/1.1.0`, the common evidence envelope used by the Quality Center to normalize read-only observations across platform version, documentation hygiene, QM documentation consistency, repository conventions, vocabulary governance and compliance evidence.

The contract does **not** execute validators and does not define domain rules, thresholds or authorities. Execution and aggregation belong to the Quality Center under ESS-0005. Domain validators remain authoritative only for their own validation semantics; Security/Compliance semantics remain under ESS-0006 and ADR-0012.

Every repository-quality observation carries an explicit non-authorizing statement: technical evidence cannot authorize merge, release, deployment, production mutation, policy changes or privilege elevation.

## Explicit non-responsibilities

- Documentation formatting/content generation belongs to `src/platform/Documentary`.
- Documentary hygiene implementation belongs to `src/platform/Documentary/Governance` within its domain boundary.
- Vocabulary/terminology belongs to `src/platform/Vocabulary`.
- Security/Compliance scanner semantics belong to `src/platform/Security` and `src/platform/Compliance`.
- Quality validator execution and result aggregation belong to `src/platform/Quality`.
- Domain decisions remain in their ADR/ESS/domain components.
- Authentication/authorization enforcement remains in IAM/security components.
- This component cannot authorize its own merge, capability elevation or production mutation.
- It does not create provider-specific repository instruction mirrors.

## Dependency direction

Governance exposes stable contracts to Documentary, Traceability, Release, Quality, Supervisor and other consumers. Quality consumes the repository-quality evidence contract but must not redefine Governance, Compliance, Release, Documentation or Vocabulary rules.

Machine-readable authority remains in:

- `/AGENTS.md`
- `docs/governance/authority-registry.json`
- `docs/governance/control-catalog.json`
- `docs/adr/registry.json`

The executable structural check is `scripts/governance/validateGovernanceControlPlane.mjs`.
