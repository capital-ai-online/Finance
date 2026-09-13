# CAPITAL-AI-QM — Roadmap 2026-09-13

**Project:** `CAPITAL-AI-QM`  
**Folder:** `docs/projects/quality-management/`  
**Owner:** `CAPITAL-AI-QM` (cross-cutting)  
**Status:** `ACTIVE — CANONICAL DATED ROADMAP`  
**Baseline:** `main@9634053b222725db69d557f61d44d77b9eb8cb04` (PR #900 merged)  
**Superseded baseline:** `archive/CAPITAL_AI_QM_ROADMAP_SUPERSEDED_2026-09-13.md`

## Consolidation rule
All non-terminal QM work from the superseded baseline remains carried forward. This dated roadmap is an execution projection and does not promote proposed technical authority by itself.

## Active work packages

### QM-CARRY-01 — Existing non-terminal QM backlog
Carry forward every non-terminal quality-gate, evidence, validation, test-inventory and branch/PR dependency.

### QM-PR900-01 — Deterministic PR-class matrix
Complete the PR-class decision matrix from current authority and map each class to the smallest sufficient check capsules and deployment eligibility.

**Exit:** documentation-only changes do not trigger inappropriate runtime deployment; higher-risk classes retain all required evidence.

### QM-PR900-02 — Exact-snapshot gate inventory
Complete same-SHA evidence coverage. Required Chapter-12/Quality gates must report explicit PASS/FAIL/NOT_AVAILABLE; never convert NOT-RUN into PASS.

### QM-PR900-03 — Enterprise Actions efficiency
Assess cache/artifact retention, storage volume and Enterprise controls against cost, reproducibility and security requirements.

### QM-PR900-04 — Cross-project readiness evidence
Expose reproducible quality states for the milestone scorecard without becoming a second owner/status authority.

## Dependencies
GOV PR classification/authority, OPS CI/release, SEC/COMP assurance, project-owned exact-head tests.

## Project exit gate
One active QM roadmap; every PR class selects risk-proportionate checks deterministically and milestone evidence is exact-snapshot/non-synthetic.