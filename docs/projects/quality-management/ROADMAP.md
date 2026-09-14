# CAPITAL-AI-QM — Canonical Roadmap

**Project:** `CAPITAL-AI-QM`  
**Folder:** `docs/projects/quality-management/`  
**Owner:** `CAPITAL-AI-QM` (cross-cutting; no productive PVC)  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@5dfdfbd4bad088777c48434e65fd7a7ec9921e36`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated sidecar roadmaps, pointer-only `ROADMAP.md` files and PR #900 staging artifacts are removed after this fold. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

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

## Carried-forward baseline (pre-2026-09-13)

QM may identify, specify, prioritize and verify remediation. It MUST NOT implement foreign-domain remediation.

| ID | State |
|---|---|
| QM-01 Quality Criteria | IN_PROGRESS |
| QM-02 Quality Gates | READY |
| QM-03 Quality Measurement | READY |
| QM-04 Findings | READY |
| QM-05 Regression | READY |
| QM-06 Technical Debt | READY |
| QM-07 Evidence | READY |
| QM-08 Continuous Improvement | READY |

Finding lifecycle: DISCOVERED → TRIAGED → CONFIRMED → REFERRED → REMEDIATING → EVIDENCE_READY → VERIFIED → CLOSED.

## Dependencies
GOV PR classification/authority, OPS CI/release, SEC/COMP assurance, project-owned exact-head tests.

## Project exit gate
One active QM roadmap; every PR class selects risk-proportionate checks deterministically and milestone evidence is exact-snapshot/non-synthetic.
