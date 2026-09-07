# OPS Post-#828 Priority Re-correlation — 2026-09-07

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Projected OPS-owned PVCs:** `PVC-02`, `PVC-04`, `PVC-06`, `PVC-07`, `PVC-08`, `PVC-18`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Correlation baseline:** `main@75c926f12ae514036aa508ea8faf1a82b1a91059`  
**Evidence role:** current-state correlation / non-authorizing  
**Status:** `EVIDENCE_READY / PR_COORDINATION_BLOCKED`

## 1. Current baseline

Current `/AGENTS.md` remains Control Plane v2.8.1. Current project mapping assigns PVC-02/04/06/07/08/18 to CAPITAL-AI-OPS and the canonical project folder `docs/projects/operations/`.

Security PR #832 merged during this work and advanced main from `09ab297c1fd954c37fa2cb8b2fba718cb58402cb` to `75c926f12ae514036aa508ea8faf1a82b1a91059`. It changed only Security documentation/evidence surfaces and no OPS target file. Its semantic result for `S1-R2-04` is consumed: repository contracts are independently `REPOSITORY_CONTRACT_VERIFIED`, while exact post-deploy supervisor/restart/readiness evidence remains open.

Final open-PR correlation subsequently found PR #833 `[CAPITAL-AI-OPS] [ChatGPT] Retired Authorization aus Runtime und Roadmaps entfernen`. PR #833 changes `docs/projects/operations/ROADMAP.md`, which is also changed by this work item. Its retired-auth cleanup is semantically disjoint from this branch's qs/RPO/Node-priority synchronization, but the shared Roadmap file is a real changed-file coordination overlap. This branch therefore stops before PR creation until #833 reaches a terminal state and the branch is resynchronized/re-correlated against then-current main.

Other correlated OPS branches: `agent/operations-roadmap-integrity-sync-20260907` is stale/diverged and has no PR; the Zizmor evaluation branch had no delta at its correlation snapshot.

## 2. PR #828 / qs 6.16.0

PR #828 `[CAPITAL-AI-OPS] [ChatGPT] qs 6.16.0 DoS-Remediation` is merged.

- merge SHA: `fb3fff1f3959d1c6f87d20228036366848600487`;
- final PR head: `cb44840771aea4f44b8a810bb0e87e613953a735`;
- final hosted CI: `success`;
- final Governance: `success`;
- final Container Security: `success`.

Current main retains:

- `package.json` → `overrides.qs = 6.16.0`;
- `package-lock.json` → `node_modules/qs` version `6.16.0` with synchronized artifact/integrity identity;
- `tests/unit/qsDosRegression.test.ts`.

Render deploy history confirms the #828 merge SHA was successfully deployed. The current live later main contains the same remediation.

**Disposition:** `IMPLEMENTED_ON_MAIN / DEPLOYED / TERMINAL`. No open qs remediation remains.

## 3. Node authority

Current `.nvmrc` is `24.18.0`. ADR-0053 remains `Accepted` and explicitly selects Node `24.18.0` for Production, CI and local development. The 24.20.0 Node write-boundary supersession remains `PROPOSED / IMPLEMENTATION IN BRANCH` and is not effective until its Human-gated lifecycle completes.

**Disposition:** `OPS-06-SEC-03 = P1/HIGH / BLOCKED_BY_AUTHORITY_CONFLICT / NON-EXECUTABLE`.

## 4. Recovery / RPO

PR #776 is merged and supplies the current Recovery Evidence Harness.

PR #802 proposed a deterministic RPO evaluator, but current state is:

- PR #802 `closed`;
- `merged=false`;
- former branch `agent/operations-recovery-rpo-evidence-20260907` absent;
- `scripts/operations/recoveryRpoEvidence.mjs` absent from current main.

Therefore historical `IMPLEMENTED_BRANCH` wording is invalid as a current-state claim. Historical #802 diff/evidence may be reused only as implementation input. A new implementation requires a fresh branch from then-current main and new exact-head validation.

Operational gates remain distinct and unproven by this documentation pass: successful scheduled backup series/measured RPO, isolated restore integrity/database-RTO, full-service RTO, and independent CAPITAL-AI-SEC verification.

## 5. DR-03

ADR-0060 v1.1.0 is accepted/active and ESS-0019 v1.2.0 accepted; the former Governance dependency is terminal. DR-03 remains priority-blocked because the trust-root order puts executable Security/Data-Integrity work before architecture/integration.

## 6. Resulting executable priority

1. **`OPS-08-SEC-07` is the highest actually executable local OPS Security/Data-Integrity work.** Re-intake only the deterministic RPO evaluator semantics from historical closed-unmerged PR #802 onto a fresh current-main branch, preserve PR #776 architecture, and obtain exact-head hosted validation.
2. **`OPS-06-SEC-03` remains higher-severity P1/HIGH but is not executable** until effective Governance/ADR authority resolves the Node baseline.
3. Entitlement/Stripe implementation-ready returns do not outrank local executable remediation; DR-03 remains later architecture/integration work.

This priority result is technically established, but starting the next Roadmap work item must wait until the current Roadmap writer #833 is terminal and the queue is re-read as required by the trust root.

## 7. Validation truth

Read-only checks/correlation executed:

- current main + current trust root: **PASS**;
- project/PVC/owner mapping: **PASS**;
- Security PR #832 changed-file overlap: **PASS — none with OPS target files**;
- PR #833 open-PR/changed-file correlation: **BLOCKING COORDINATION FINDING — shared `docs/projects/operations/ROADMAP.md`**;
- PR #833 semantic overlap with qs/RPO/Node priority: **NO MATERIAL SEMANTIC CONFLICT IDENTIFIED**, but changed-file writer remains unresolved;
- PR #828 merge/final-head identity: **PASS**;
- PR #828 final hosted CI/Governance/Container Security: **PASS**;
- current-main qs manifest/lock/test presence: **PASS**;
- Render deployment identity: **PASS**;
- Accepted ADR-0053 + `.nvmrc` 24.18.0: **PASS**;
- proposed 24.20.0 supersession lifecycle: **PASS**;
- PR #802 closed-unmerged status: **PASS**;
- former RPO branch absence: **PASS**;
- RPO evaluator absence from current main: **PASS**.

Not run / not claimed for this documentation-only work:

- `npm ci`;
- TypeScript/lint;
- unit tests;
- production build;
- dependency audit;
- Docker/image validation;
- hosted checks for this not-yet-created PR;
- scheduled Recovery Evidence execution;
- restore drill;
- CAPITAL-AI-SEC independent verification beyond the R2-04 repository-contract evidence merged in #832.

## 8. Boundary

This evidence authorizes no PR creation, merge, Release transition, Node supersession, provider/Production mutation or Security closure. Because PR #833 is an unresolved active writer on the same canonical OPS Roadmap file, this branch remains `PR_COORDINATION_BLOCKED` until #833 is merged/closed and current main/open PRs/overlap are re-correlated.
