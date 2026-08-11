# ADR-0047 — GitHub Actions as authoritative Render production deploy gate

Status: Proposed
Date: 2026-08-09

## Retrospective correction

This ADR was originally merged by PR #144 under the identifier `ADR-0046`. That identifier was already assigned to Vocabulary Governance by PR #143. To restore deterministic ADR numbering, the deployment-gate decision is reassigned to `ADR-0047`. The architectural decision itself is unchanged.

## Context

The Render `Finance` service previously used `After CI Checks Pass` (`checksPass`) as its production auto-deploy trigger. Controlled tests showed that GitHub CI could complete successfully while Render created no deploy or created it only after substantial delay.

A controlled A/B test switched Render to `On Commit`. Under this configuration Render successfully consumed PR-merge commits from `main` and created `trigger: new_commit` deploys, including PR #141 merge commit `ae35d4e57dbf06eadf5776c0e9d6353978f03f38`, deployed as `dep-d9sbnugu01pc73e2mjq0` to `live`.

The A/B evidence isolates the unreliable path to Render's `checksPass` / GitHub Check Suite correlation rather than GitHub repository access, merge commits, Git credentials, or Render's normal commit event handling.

A repository inspection also found that `main` is not protected and required status-check enforcement is disabled. The current GitHub plan does not provide the required private-repository branch/ruleset enforcement without an upgrade, and no upgrade is planned at this time.

Therefore `Render: On Commit` cannot be the permanent production policy because it can deploy a `main` commit before GitHub CI has validated that commit.

## Decision

GitHub Actions becomes the authoritative production deployment gate without relying on paid branch protection or Render `checksPass`.

Render Auto-Deploy SHALL be set to **Off**. GitHub Actions SHALL deploy only after the `build-and-test` job succeeds for a `push` to `main`.

Target flow:

`PR / main update → GitHub CI → build-and-test success → deploy-production → Render Deploy Hook → exact verified commit → production`

The deploy job MUST NOT run for `pull_request` events. It runs only for `push` events on `refs/heads/main` and depends on `build-and-test`.

The Render Deploy Hook URL is stored only as GitHub Actions repository secret `RENDER_DEPLOY_HOOK_URL`. The workflow appends `ref=${github.sha}` so Render deploys the exact commit that passed CI instead of an unverified later commit.

## Required operational configuration

Before this ADR is considered implemented:

1. In Render `Finance → Settings → Auto-Deploy`, set Auto-Deploy to **Off**.
2. Copy the service's secret Deploy Hook URL from Render `Finance → Settings`.
3. In GitHub `Finance → Settings → Secrets and variables → Actions`, create repository secret `RENDER_DEPLOY_HOOK_URL` containing that URL.
4. Keep PR #144 in Draft state until steps 1–3 are complete.
5. Merge the workflow change only after steps 1–3 are complete.
6. Validate one documentation-only test merge end to end.

## Security properties

- A failing `build-and-test` prevents the deploy job from running.
- The Render deploy secret is not stored in repository content or logs.
- The deployment request targets the exact `github.sha` that passed CI.
- Render no longer independently auto-deploys new commits.
- The workflow does not require `statuses: write` or a custom compatibility status.

## Limitations

Because `main` is not protected on the current GitHub plan, GitHub cannot prevent a user with repository write permission from pushing directly to `main`. However, such a commit still must pass the push-triggered `build-and-test` job before the GitHub Actions deploy job can invoke Render.

This architecture therefore protects the production deployment boundary even when repository merge-policy enforcement is unavailable. It does not replace the governance value of branch protection if the GitHub plan changes in the future.

## Consequences

Positive consequences:

- Production no longer depends on Render's unreliable `checksPass` correlation.
- No GitHub plan upgrade is required.
- Failed CI cannot invoke the Render deployment hook.
- The exact validated commit is selected for deployment.
- The legacy `capital-ai/ci-gate` status and `statuses: write` permission are unnecessary.

Trade-offs:

- Render Auto-Deploy must remain Off.
- The GitHub repository secret becomes production-critical and must be rotated if exposed.
- GitHub Actions availability becomes part of the production deployment control plane.
- Branch protection remains desirable if a future GitHub plan enables it.

## Verification

The architecture is considered implemented only when all of the following are true:

- Render `Finance` reports Auto-Deploy Off;
- repository secret `RENDER_DEPLOY_HOOK_URL` exists;
- a pull-request CI run does not trigger a Render deploy;
- a deliberately failing `main` CI run does not trigger a Render deploy;
- a passing `main` CI run invokes `Deploy verified commit to Render`;
- Render deploys the same Git SHA that passed CI;
- the deployment reaches `live`;
- no Render `checksPass` or `On Commit` auto-deploy is required.

## Evidence

See `docs/runbooks/RENDER_AUTODEPLOY_AB_TEST_2026-08-09.md` for the diagnostic record and exact deploy identifiers.
