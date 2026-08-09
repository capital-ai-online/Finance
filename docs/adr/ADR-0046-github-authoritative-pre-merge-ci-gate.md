# ADR-0046 — GitHub as authoritative pre-merge CI gate for Render production deploys

Status: Proposed
Date: 2026-08-09

## Context

The Render `Finance` service previously used `After CI Checks Pass` (`checksPass`) as its production auto-deploy trigger. Multiple controlled tests showed that GitHub CI and the repository-level `capital-ai/ci-gate` status could complete successfully while Render created no deploy or created it only after substantial delay.

A controlled A/B test switched Render temporarily to `On Commit`. Under this configuration Render successfully consumed PR-merge commits from `main` and created `trigger: new_commit` deploys, including PR #141 merge commit `ae35d4e57dbf06eadf5776c0e9d6353978f03f38`, deployed as `dep-d9sbnugu01pc73e2mjq0` to `live`.

The A/B evidence isolates the unreliable path to Render's `checksPass` / GitHub Check Suite correlation rather than GitHub repository access, merge commits, Git credentials, or Render's normal commit event handling.

A separate repository inspection found that `main` is currently not protected and has required status-check enforcement disabled. Therefore switching Render permanently to `On Commit` without moving the safety gate to GitHub would weaken production governance.

## Decision

GitHub becomes the authoritative pre-merge production deployment gate. Render consumes only already-approved commits from protected `main` using `On Commit`.

Target flow:

`PR → GitHub required CI → merge allowed → main commit → Render On Commit → trigger:new_commit → production`

The required GitHub check is `CI / build-and-test`, which executes dependency audit, production configuration invariants, TypeScript validation, unit tests, production build, and deployment-readiness validation.

The `main` branch MUST be protected by GitHub branch protection or an equivalent repository ruleset with at least:

1. pull request required before merge;
2. required status check `CI / build-and-test`;
3. direct pushes to `main` blocked except explicitly governed break-glass actors or workflows;
4. branch update requirement enabled where compatible with the repository's merge strategy;
5. administrative bypasses treated as auditable break-glass actions rather than normal workflow.

Render SHALL use `On Commit` only after this GitHub protection is active and verified.

## Consequences

Positive consequences:

- Production safety no longer depends on Render's unreliable `checksPass` correlation.
- CI policy is enforced at the repository boundary before a production commit exists.
- PR merge commits are valid deployment artifacts and are handled natively by Render.
- The deployment model has one authoritative approval boundary instead of duplicated GitHub and Render gates.

Trade-offs:

- Render begins deployment shortly after the protected commit reaches `main`; it no longer independently validates CI state.
- GitHub branch protection becomes a production-critical control and must be governed accordingly.
- Temporary administrative bypasses can directly affect production and require audit evidence.

## Legacy gate retirement

The custom `capital-ai/ci-gate` commit status was introduced only to improve Render `checksPass` visibility. Once GitHub protection requiring `CI / build-and-test` is active and verified, this compatibility status and its `statuses: write` permission should be removed from `.github/workflows/ci.yml`.

Until branch protection is confirmed, removal of that compatibility status may be prepared in a PR but MUST NOT be treated as completion of the production hardening.

## Verification

The architecture is considered implemented only when all of the following are true:

- GitHub reports `main` as protected or covered by an equivalent active ruleset;
- `CI / build-and-test` is a required merge check;
- a deliberately failing PR cannot be merged through the normal workflow;
- a passing PR can be merged;
- the resulting merge commit is automatically deployed by Render with `trigger: new_commit`;
- the deploy reaches `live`;
- no manual Render deployment is needed.

## Evidence

See `docs/runbooks/RENDER_AUTODEPLOY_AB_TEST_2026-08-09.md` for the diagnostic record and exact deploy identifiers.