# PR Autofix Root-Cause → Control-Panel Projection — 2026-09-20

**Project:** `CAPITAL-AI-OPS`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@242e1847800af27ad80d4b4a693a28b9754eb25d`  
**Status:** IMPLEMENTED_BRANCH / VALIDATION_PENDING

## Observed active-PR build/test failures

| PR | Observed build/test root cause | Bounded remediation |
|---|---|---|
| #1165 | `CURRENT_STATE_PROJECTION_BASELINE_STALE` in `docs/projects/security/ROADMAP.md` caused `governanceControlPlane.test.ts` to fail although the application/test corpus was otherwise healthy. | Refresh only the recognized current-state baseline field to the exact PR base/current-main generation; the existing Current-State Baseline Autofix remains the single writer. |
| #1171 | `selfHealingSupersession.test.ts` encoded a mutable coordination fact: literal `Next functional slice: SH-02.6`, while the canonical work graph had already advanced SH-02.6 to `IMPLEMENTED_ON_MAIN` and declared SH-02.7 next. | Replace the concrete slice literal with an invariant: exactly one declared next slice, matching work-graph row, and that row must not already be `IMPLEMENTED_ON_MAIN`. |
| #1170 | Build/test was already PASS on the observed head. | No build/test mutation. Governance/body drift is a separate metadata class owned by the PR metadata/Decision Evidence specialists. |

## Universalization

The PR Convergence Controller delegates exact `CURRENT_STATE_PROJECTION_BASELINE_MISSING/STALE` failures to the dedicated baseline specialist and canonical v1.7 Decision/Evidence drift to the already subscribed PR Decision Evidence Reconciler. This preserves one writer per PR-body surface. The change also adds one exact registered repair class for stale Self-Healing next-slice test literals and treats the 45,000-minute Actions state as a protected blocker rather than a repair candidate.

The registered test repair is deliberately semantic and bounded:

- it recognizes only the exact `selfHealingSupersession.test.ts` failure shape;
- it may change only `tests/unit/selfHealingSupersession.test.ts`;
- it never substitutes a new concrete SH slice number;
- it converts the brittle expectation into a canonical work-graph invariant;
- the repairer is eligible only when its individually registered failure signature and all declared exact log-evidence tokens are present;
- repeated same-signature repair is blocked by the existing PR Autofix generation/signature logic;
- authoritative CI must re-run on the new exact head;
- unchanged Governance failures are never generically re-run: only an observed production-baseline write or deterministic metadata repair may trigger the exact-head/base Governance re-run.

## Control Panel fix algorithm

The canonical `self-healing-contract/1.0.0` now projects four repository/governance findings relevant to this convergence path:

- `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT`;
- `REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT`;
- `REPOSITORY_PR_DECISION_EVIDENCE_DRIFT`;
- `PROTECTED_GITHUB_ACTIONS_COST_BLOCKER`.

The first two prefer `RECONCILE_REPOSITORY_PROJECTION`, an SH-1 idempotent, single-attempt action requiring the already-authorized `repository.pr.autofix` capability and exact-head CI/Governance readback.

`REPOSITORY_PR_DECISION_EVIDENCE_DRIFT` prefers the separate `RECONCILE_PR_DECISION_EVIDENCE` action. That action delegates only to the existing PR Decision Evidence Reconciler, is single-attempt and idempotent, and does not create another PR-body writer or merge authority.

`PROTECTED_GITHUB_ACTIONS_COST_BLOCKER` permits only `OBSERVE_ONLY`. Reaching the 45,000-minute threshold therefore remains a protected fail-closed condition; the Self-Healing contract cannot clear, weaken or autonomously repair it.

The Control Panel renders these policies as read-only algorithm information. It gains no repository-write, merge, Security, billing/provider or Production authority.
