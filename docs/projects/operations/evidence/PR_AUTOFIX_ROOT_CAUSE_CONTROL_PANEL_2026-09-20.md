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

The PR Convergence Controller already delegates exact `CURRENT_STATE_PROJECTION_BASELINE_MISSING/STALE` failures to the dedicated baseline specialist. This change keeps that single-writer boundary and adds one exact registered repair class for stale Self-Healing next-slice test literals.

The registered test repair is deliberately semantic and bounded:

- it recognizes only the exact `selfHealingSupersession.test.ts` failure shape;
- it may change only `tests/unit/selfHealingSupersession.test.ts`;
- it never substitutes a new concrete SH slice number;
- it converts the brittle expectation into a canonical work-graph invariant;
- repeated same-signature repair is blocked by the existing PR Autofix generation/signature logic;
- authoritative CI must re-run on the new exact head.

## Control Panel fix algorithm

The canonical `self-healing-contract/1.0.0` now projects two repository finding classes:

- `REPOSITORY_CURRENT_STATE_PROJECTION_DRIFT`;
- `REPOSITORY_WORK_GRAPH_EXPECTATION_DRIFT`.

Both prefer `RECONCILE_REPOSITORY_PROJECTION`, an SH-1 idempotent, single-attempt action requiring the already-authorized `repository.pr.autofix` capability and exact-head CI/Governance readback. The Control Panel renders this registry as read-only algorithm information; it gains no repository-write, merge, Security, provider or Production authority.
