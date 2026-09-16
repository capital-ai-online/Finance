# CAPITAL-AI-GOV — Autonomous Development Policy Migration Evidence

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Baseline at migration start:** `main@7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Branch:** `agent/governance-sec-authority-exception-20260916`  
**Pull Request:** `#1022`

## Owner decision

The original DevelopmentChain is dissolved as current development authority and replaced by the previously defined autonomous/self-healing policy model. Exactly eight YAML policies form the new and sole repository development-policy set after Human/CODEOWNER merge.

## Before

Current main still exposes `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` and multiple DevelopmentChain lifecycle, branch, phase, runbook, contract and roadmap artifacts. `/AGENTS.md` contains a monolithic Mandatory Development Lifecycle. The current Top-Layer material is a non-authorizing combined projection rather than the requested exclusive eight-policy execution model.

## After

`/AGENTS.md` becomes a compact trust-root/bootstrap document rather than a development lifecycle. It points to exactly eight YAML policies:

1. `GOV-TOP-LAYER-APPLICATION-01`
2. `GOV-TOP-LAYER-EXECUTION-01`
3. `GOV-TOP-LAYER-QUALITY-GATES-01`
4. `GOV-TOP-LAYER-AUTHORITY-HARDENING-01`
5. `GOV-SEC-AUTHORITY-EXCEPTION-01`
6. `GOV-QM-AUTHORITY-EXCEPTION-01`
7. `GOV-FINTECH-AUTHORITY-EXCEPTION-01`
8. `GOV-COMP-SUPPLYCHAIN-AUTHORITY-EXCEPTION-01`

The execution policy contains the project-local autonomous continuation loop and bounded self-healing logic. The Authority-Hardening policy globally retires DevelopmentChain procedure and prevents stale references from reactivating it.

## Explicit project directions

- General project folders: `USER_VISIBLE_TOP_LAYER_FIRST`.
- `CAPITAL-AI-SEC`: `SECURITY_FOUNDATION_FIRST`.
- `CAPITAL-AI-QM`: `INDEPENDENT_ASSURANCE_FIRST`.
- `CAPITAL-AI-FINTECH`: `DOMAIN_SCORING_VALUE_CHAIN_FIRST`.
- `CAPITAL-AI-COMP`: `COMPLIANCE_REQUIREMENT_AND_EVIDENCE_FIRST`.

These directions do not transfer productive PVC ownership or create parallel domain authorities.

## DevelopmentChain retirement set removed from current tree

- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md`
- `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_DOCUMENTATION_FREEZE_POLICY.md`
- `docs/projects/operations/DEVELOPMENT_CHAIN.md`
- `docs/runbooks/DEVELOPMENT_CHAIN_PHASE_EXECUTION.md`
- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `.ai/contracts/development-chain-mutation-handoff.schema.json`
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`
- `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md`
- `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md`

Git history remains the audit source for these retired artifacts.

## Non-delegable boundaries preserved

- current `main` is the authoritative baseline;
- no direct `main` mutation;
- scoped branch and Pull Request boundary;
- Human/CODEOWNER-only merge;
- no self-merge or auto-merge enablement;
- protected external mutations retain their applicable Human/Owner authority gates;
- security, compliance, domain, supply-chain and ownership boundaries remain fail-closed;
- `NOT RUN` never equals `PASS`.

## Validation plan

Because PR #1022 already exists, the migration is emitted as one additional atomic commit so repository CI is triggered once for this change set. Post-commit readback must confirm all eight YAML files exist, the combined Top-Layer projection is removed, the listed DevelopmentChain current-tree artifacts are removed, `/AGENTS.md` lists exactly eight development policies and the branch remains correlated to then-current `main`.
