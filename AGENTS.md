# CAPITAL-AI Agent Trust Root

**Authority ID:** `AUTH-GOV-AGENT-TRUST-ROOT`  
**Control Plane Version:** `3.0.0`  
**Status:** OWNER-DIRECTED — effective after Human/CODEOWNER merge  
**Effective date:** 2026-09-16  
**Repository:** `capital-ai-online/Finance`

## 1. Single Point of Trust

`/AGENTS.md` is the single repository-wide trust root for every AI model, coding agent, MCP host and automation client working on CAPITAL-AI.

This file is intentionally **not** a development lifecycle, phase model or DevelopmentChain. It only bootstraps authority, resolves the sole development-policy suite and preserves non-delegable Human/Owner boundaries.

Provider-specific repository instruction mirrors are prohibited. If an execution host cannot resolve this trust root and the eight YAML policies below from `CURRENT_MAIN`, protected work stops fail-closed.

## 2. Sole Development Policy Suite

After Human/CODEOWNER merge of the introducing Pull Request, the **only repository development guidelines** are exactly these eight YAML policies:

1. `docs/governance/development-policies/GOV-TOP-LAYER-APPLICATION-01.yaml`
2. `docs/governance/development-policies/GOV-TOP-LAYER-EXECUTION-01.yaml`
3. `docs/governance/development-policies/GOV-TOP-LAYER-QUALITY-GATES-01.yaml`
4. `docs/governance/development-policies/GOV-TOP-LAYER-AUTHORITY-HARDENING-01.yaml`
5. `docs/governance/development-policies/GOV-SEC-AUTHORITY-EXCEPTION-01.yaml`
6. `docs/governance/development-policies/GOV-QM-AUTHORITY-EXCEPTION-01.yaml`
7. `docs/governance/development-policies/GOV-FINTECH-AUTHORITY-EXCEPTION-01.yaml`
8. `docs/governance/development-policies/GOV-COMP-SUPPLYCHAIN-AUTHORITY-EXCEPTION-01.yaml`

No ninth development-policy document, lifecycle, phase contract, routing overlay, DevelopmentChain, agent-specific mirror or equivalent parallel development authority may be created without a later explicit Human/Owner decision that changes this exact set.

ADRs, ESS, domain contracts, security controls, legal/compliance obligations, project Roadmaps and evidence remain authoritative inside their delegated subject matter, but they are **inputs and constraints**, not additional repository development guidelines.

## 3. Global DevelopmentChain Retirement

The former DevelopmentChain is dissolved as current repository development authority.

`AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` and every DevelopmentChain lifecycle, phase, branch-lifecycle, mutation-handoff, documentation-freeze, responsibility-matrix, roadmap, runbook, evidence-template or equivalent procedural artifact are `RETIRED / HISTORICAL / NON_AUTHORIZING` after Human Merge of this change.

This supersession is global for repository development procedure. A stale reference, registry row, old roadmap, code comment, historical evidence or archived document cannot reactivate DevelopmentChain authority. Git history remains the audit source for retired material.

The eight YAML policies supersede DevelopmentChain procedure while preserving applicable domain authorities, architecture decisions, security/compliance constraints, supply-chain contracts, Human/CODEOWNER merge authority and protected external-mutation controls.

## 4. Authority Resolution

Authority precedence is:

1. applicable law, regulation, supervisory or binding contractual obligation;
2. explicit Human/Owner decision and effective Accepted ADR within its scope;
3. this trust root plus the eight YAML development policies, and applicable active domain/security/compliance authorities within their delegated scope;
4. project Roadmaps, contracts, runbooks and evidence implementing higher authority;
5. proposed/draft/not-enabled material;
6. historical/evidence/archive material.

For development procedure, section 2 is exclusive. If another artifact attempts to define repository development sequencing, branch policy, PR lifecycle, self-healing execution, project routing or development prioritization outside the eight YAML files, that procedural portion is ignored and reported as governance drift.

## 5. Canonical Project and Domain Inputs

Project and PVC resolution is canonical only from:

- `docs/projects/README.md`
- `docs/projects/PROJECT_VALUE_CHAIN.md`

Each project consumes its own current `README.md`, `ROADMAP.md`, applicable ADR/ESS and domain contracts. Technical financial/scoring work additionally preserves `SC-MD-SPT-0001` and applicable FINTECH authorities. Cross-cutting projects never gain a productive PVC merely by validating, constraining, presenting or distributing another project's work.

## 6. Non-delegable Human and Repository Boundaries

The YAML suite may automate and self-heal repository work only inside these immutable boundaries:

- direct writes to `main` are prohibited;
- repository changes use a scoped branch;
- every merge into `main` originates from a Pull Request;
- `MERGE` is Human/CODEOWNER-only;
- agents do not self-merge or enable auto-merge;
- protected external mutations require the applicable explicit Human/Owner authorization;
- no agent may expand its own authority, ownership, permissions or approval scope;
- credentials, secrets, raw tokens and private keys are never written to repository evidence;
- `NOT RUN`, `UNKNOWN`, `BLOCKED` and `FAIL` are never converted into `PASS` by inference;
- current `main` is the only authoritative repository baseline; open PRs and branches are correlation inputs only.

## 7. Fail-closed Bootstrap

Before protected repository work, the executor MUST resolve from current `main`:

- current main SHA;
- the canonical project, project folder, Primary Owner and productive PVC relationship;
- applicability of the general Top-Layer policies versus one of the four explicit exceptions;
- project Roadmap or explicit Owner scope;
- applicable ADR/ESS/domain/security/compliance/supply-chain constraints;
- relevant open PR and active-writer overlap where observable.

If any of these are materially ambiguous, contradictory or unavailable, protected mutation stops until the eight-policy suite can resolve or route the conflict.

## 8. Self-healing Boundary

Self-healing means bounded detection, correction and revalidation of repository drift that is already authorized by the eight YAML policies. It does not mean self-approval.

Automatic repair may normalize stale references, branch drift, generated evidence, owner-correct handoff metadata, deterministic formatting and other reversible repository inconsistencies when policy conditions are satisfied. It MUST stop on unresolved authority conflict, owner transfer, security-control weakening, compliance/legal ambiguity, destructive production mutation, secret exposure, live billing/money/entitlement mutation, DNS/TLS/domain ownership or any other protected action requiring Human authority.

## 9. Historical DevelopmentChain References

Historical documents may retain the term `DevelopmentChain` only to explain past repository state. Such references are non-authorizing even when an older artifact still says `ACTIVE`. The effective current state is this trust root plus the exact eight YAML policies.

## 10. Conflict Rule

If a supporting artifact conflicts with this trust root or the applicable YAML policy, execution stops fail-closed unless the conflict is a repair class explicitly allowed by `GOV-TOP-LAYER-AUTHORITY-HARDENING-01`.

The introducing Pull Request cannot bootstrap its own authority. Until Human/CODEOWNER merge, the current-main rules that existed before this change continue to govern creation, review and merge of that Pull Request.
