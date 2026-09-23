# OPS-MERGE-CADENCE-01 — Dual-Mode 5-Merge Deploy / 10-Merge Version Runtime

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02, PVC-06, PVC-07, PVC-08  
**Trust root:** /AGENTS.md@CURRENT_MAIN  
**Baseline:** main@86fb86c69df1b65a69c006b4b08eee262c7db40c  
**Source:** fresh Human/Owner direction 2026-09-23 plus dependency on GOV PR #1336  
**State:** IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED  
**Priority:** P1

## Objective

Prepare the existing production/release/self-healing chain so the Human merge of Governance PR #1336 can activate one repository-wide fixed merge cadence without an unsafe transition window.

The implementation is deliberately dual-mode:

- while the effective Versioning Rule Contract is pre-1.1, existing per-main-merge deployment semantics remain intact;
- once Contract v1.1 is effective on CURRENT_MAIN, the same existing controllers switch to fixed 5/10 merge-ordinal semantics;
- no second deploy workflow, branch-sync writer, version registry or Self-Healing controller is introduced.

## Scope

1. Add one shared read-only merge-cadence resolver for Git first-parent PR-merge history.
2. Keep build/test/provenance execution on every latest CURRENT_MAIN merge.
3. Gate the existing Render deployment job so cadence mode deploys only at fixed ordinals 5/10/15/... and always targets fresh latest CURRENT_MAIN.
4. Converge Post-Merge Production Correlation so healthy expected lag is DEPLOYMENT_QUEUED while due/failed/unhealthy/diverged state remains PRODUCTION_DRIFT.
5. Gate existing Exact-SHA Recovery so queued lag below a due boundary cannot cause redeploy.
6. Reuse the registered PR Autofix writer for the ordinal-10 PATCH mutation; the trusted repairer delegates the mutation to the existing Release Version Gate and exact governed mirrors.
7. Expose one cached, read-only /api/roadmap/cadence projection so the already deployed application can observe later GitHub CURRENT_MAIN merges without requiring a Render deployment after every merge.
8. Leave public Dashboard presentation changes to CAPITAL-AI-FE after this OPS endpoint is Human-merged.

## Fixed cadence

- Governance activation merge #1336 is ordinal 0 after it is Human-merged.
- Only later same-repository Pull Requests actually merged into main increment the ordinal.
- Deployment boundaries are fixed positive multiples of 5.
- Version boundaries are fixed positive multiples of 10.
- Delayed deployment and explicit higher release transitions do not shift future boundaries.
- At ordinal 9 mod 10, the next merge candidate must carry the strict next PATCH before Human merge.
- Direct-main mutation remains denied.

## Self-Healing homogeneity

DEPLOYMENT_QUEUED is expected state, not drift. It cannot activate Exact-SHA Runtime Recovery or another protected action. A due deployment that fails, an unhealthy Production identity, repository/branch mismatch or divergent SHA remains actual drift and may use the already bounded recovery capability.

SH-02.12 remains HELD. This work package adds no generic Issue-driven repair and no new Self-Healing action class.

## Dependencies

- Human-merged PR #1337 / current main 86fb86c69df1b65a69c006b4b08eee262c7db40c.
- Governance PR #1336 defines the future authority but must remain unmerged until this dual-mode implementation and the FE consumer are ready.
- Existing Release Version Gate, PR Autofix Controller, CI provenance chain and Exact-SHA Recovery remain the only productive implementation paths.

## Exit evidence

- CI still uses exactly two hosted runners and builds/tests every latest main merge.
- Before #1336 activation, deploy behavior is unchanged.
- After Contract v1.1 activation, ordinals 1-4 do not start the Render deployment job; ordinal 5 does.
- Post-merge queued state succeeds without a production-drift issue and still unlocks current-main PR/Self-Healing continuation.
- Exact-SHA Recovery is ineligible for healthy queued lag.
- Ordinal 9 causes the next PR to fail with exact registered MERGE_CADENCE_PATCH_V1 evidence until the trusted autofix writer applies the strict next PATCH through the existing Release Version Gate.
- /api/roadmap/cadence reports live GitHub CURRENT_MAIN separately from Production and exposes x/5, remaining merges, x/10 and next PATCH.
- Human/CODEOWNER merge remains final authority.

## Out of scope

- No Render-native Auto Deploy enablement.
- No direct Production mutation outside the existing CI deploy job.
- No FE visual redesign in this OPS slice.
- No new credentials, GitHub App permissions or paid provider capability.
- No activation of SH-02.12 or held SH-2/SH-3 actions.
