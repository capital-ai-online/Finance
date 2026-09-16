# CAPITAL-AI-GOV — Autonomous Development Policy Migration Evidence

**Date:** 2026-09-16  
**Project:** `CAPITAL-AI-GOV`  
**Project folder:** `docs/projects/governance/`  
**Primary Project Value Chain ownership:** `PVC-05 — Platform Director`  
**Baseline:** `main@7c177a86fae05efc95bafee5967a9e4b3cb0ff3c`  
**Branch:** `agent/governance-sec-authority-exception-20260916`  
**Pull Request:** `#1022`

## Owner decision

The original DevelopmentChain is dissolved as current development authority and replaced by the autonomous/self-healing policy model. Exactly eight YAML policies form the new and sole repository development-policy set after Human/CODEOWNER merge.

## After-state

`/AGENTS.md` is a compact trust-root/bootstrap document rather than a development lifecycle. It resolves exactly:

1. `GOV-TOP-LAYER-APPLICATION-01`
2. `GOV-TOP-LAYER-EXECUTION-01`
3. `GOV-TOP-LAYER-QUALITY-GATES-01`
4. `GOV-TOP-LAYER-AUTHORITY-HARDENING-01`
5. `GOV-SEC-AUTHORITY-EXCEPTION-01`
6. `GOV-QM-AUTHORITY-EXCEPTION-01`
7. `GOV-FINTECH-AUTHORITY-EXCEPTION-01`
8. `GOV-COMP-SUPPLYCHAIN-AUTHORITY-EXCEPTION-01`

The execution policy contains project-local autonomous continuation and bounded self-healing. Authority-Hardening globally retires DevelopmentChain procedure and prevents stale references from reactivating it.

## Project directions

- General project folders: `USER_VISIBLE_TOP_LAYER_FIRST`.
- `CAPITAL-AI-SEC`: `SECURITY_FOUNDATION_FIRST`.
- `CAPITAL-AI-QM`: `INDEPENDENT_ASSURANCE_FIRST`.
- `CAPITAL-AI-FINTECH`: `DOMAIN_SCORING_VALUE_CHAIN_FIRST`.
- `CAPITAL-AI-COMP`: `COMPLIANCE_REQUIREMENT_AND_EVIDENCE_FIRST`.

These directions do not transfer productive PVC ownership or create parallel domain authorities.

## DevelopmentChain retirement

The former procedural bodies are removed from the current tree for branch lifecycle, responsibility matrix, documentation freeze, OPS DevelopmentChain projection, phase execution runbook, mutation-handoff contract/schema, DevelopmentChain roadmap, traceability matrix and phase evidence template.

`docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` remains only as a minimal `RETIRED / HISTORICAL / NON_AUTHORIZING` compatibility tombstone so the stable historical authority ID and old audit/registry references resolve without a broken path. It contains no executable development procedure and is explicitly not a ninth development guideline. Git history retains the former full text.

## Non-delegable boundaries preserved

- current `main` is the authoritative repository baseline;
- no direct `main` mutation;
- scoped branch and Pull Request boundary;
- Human/CODEOWNER-only merge;
- no self-merge or auto-merge enablement;
- protected external mutations retain applicable Human/Owner authority gates;
- security, compliance, domain, supply-chain and ownership boundaries remain fail-closed;
- `NOT RUN` never equals `PASS`.

## Self-healing evidence

The first post-migration Governance check identified one deterministic project-metadata regression: the shortened `docs/projects/governance/README.md` no longer contained the canonical PVC ownership declaration expected by the trusted-main `validateProjectValueChain.mjs` validator. The branch repair restores `Primary Project Value Chain ownership: PVC-05 — Platform Director` without changing project/PVC ownership.

The normal PR CI and Container Security runs for migration head `4a9924061492bb611610ec612a8bda7c0cd3911f` passed; the Governance run failed only on that README ownership projection before later steps executed. This repair is therefore classified as an authorized reversible metadata/self-healing correction, not a change of development authority.
