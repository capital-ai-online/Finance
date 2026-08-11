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

> **Superseded in part — see [Addendum 2026-08-11](#addendum-2026-08-11).** The secret moves from repository scope to an environment secret of the protected `production` environment. The `ref=${github.sha}` requirement is unchanged and remains normative.

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

## Addendum 2026-08-11

Introduced together with the protected GitHub `production` environment (P1 of `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md`). This addendum amends the Decision and Verification sections above; everything not named here is unchanged.

### A1 — Job-level gating implements an existing requirement

The Decision already states that the deploy job MUST NOT run for `pull_request` events. Until now the job carried **no job-level condition**: it executed on every pull request and only the deploy *step* was guarded by an `if:`. The job now carries

```yaml
if: ${{ github.event_name == 'push' && github.ref == 'refs/heads/main' }}
```

so the job itself no longer runs on pull requests. This closes a gap between the written decision and its implementation rather than changing the decision. The step-level guard is deliberately retained as defence in depth.

Consequence: the check `Deployment verifiziert / Render-Produktion` no longer appears on pull-request runs. This is permissible because the check is not a required status check — `.github/policies/main-production-protection.expected.json` names only `build-and-test` — and because ADR-0037 §3.5 restricts only *required* checks from being reduced to `skipped` by optional workflow conditions.

### A2 — The deploy hook becomes an environment secret

The Decision's wording "stored only as GitHub Actions repository secret" is superseded for the storage location. `RENDER_DEPLOY_HOOK_URL` becomes an **environment secret of the protected `production` environment**, whose deployment branch policy permits `main` only.

Rationale: as a repository secret the hook was readable from any workflow context in the repository. Bound to an environment, it is readable only from a job that declares `environment: production`, and that job can only run from `main`. This strengthens the control the ADR set out to establish.

The Verification criterion "repository secret `RENDER_DEPLOY_HOOK_URL` exists" is replaced by: **an environment secret `RENDER_DEPLOY_HOOK_URL` exists in the `production` environment, and no repository secret of that name remains.**

The migration sequence is binding and is documented in `docs/runbooks/PRODUCTION_ENVIRONMENT_SETUP.md`. Environment secrets take precedence over repository secrets of the same name, and a missing environment secret falls back to the repository secret, so the migration is free of downtime **only** in the documented order. Deleting the repository secret is the step that actually establishes the protection.

### A3 — A premise in the Context is obsolete

The Context states that `main` is unprotected, that required status-check enforcement is disabled, and that "no upgrade is planned at this time". All three are obsolete as of 2026-08-11: the paid plan is active, the ruleset `main-production-protection` (ID `20609723`) is in force with `build-and-test` as a strict required check, deletion and non-fast-forward protection, and no bypass actors.

The Limitations section, which derives from that premise, is therefore stale. It is left in place as a historical record rather than rewritten.

### A4 — Unresolved contradiction with ADR-0037, recorded not decided

ADR-0037 §9 lists `autoDeployTrigger=checksPass` as a protected invariant, `render.yaml` declares that value, and the build guard **PCG-001** in `scripts/security/verifyProductionConfigInvariants.ts` enforces the literal string. This ADR requires Render Auto-Deploy **Off**, and `docs/evidence/m0/RENDER_DEPLOYMENT_EVIDENCE.md` records the live service state as "Auto Deploy: no / Auto Deploy Trigger: off".

The blueprint file therefore contradicts the deployed reality, and a build gate enforces the contradiction.

This addendum **does not resolve it**. Changing `render.yaml` would fail the build and would touch a control that ADR-0037 §9 marks protected. The resolution requires an explicit owner decision — either amending ADR-0037 §9 and PCG-001 to match ADR-0047, or reinstating Render `checksPass` and superseding this ADR. Until then the practical deploy path is unaffected, because only the workflow deploy hook triggers deployments.

Additionally stale and to be revised separately: `docs/runbooks/RENDER_CI_DEPLOY_GATE.md` and `docs/runbooks/RENDER_AUTODEPLOY_CREDENTIAL_TEST_2026-08-09.md` still describe the removed `capital-ai/ci-gate` commit status.
