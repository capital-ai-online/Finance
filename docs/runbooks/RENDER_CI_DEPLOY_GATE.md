# Render CI Deployment Gate

## Purpose

The production Render service `Finance` deploys `main` with `autoDeployTrigger: checksPass`. GitHub Actions therefore validates the exact `main` commit after merge before Render may deploy it.

## Gate

`.github/workflows/ci.yml` runs on both pull requests and pushes to `main`.

After `build-and-test` completes, the final `Render deployment gate` job publishes a classic GitHub commit status with context:

`capital-ai/ci-gate`

The status is:

- `success` only when `build-and-test` completed successfully;
- `failure` for every other result, and the final job exits non-zero.

This provides Render's `checksPass` integration with an explicit commit status in addition to GitHub Actions check runs. No Render API key or deploy hook is stored in the repository.

## Expected production sequence

1. Pull request CI passes.
2. Human-authorized merge updates `main`.
3. GitHub Actions runs CI again for the exact merge commit.
4. `capital-ai/ci-gate` becomes `success` only after all CI checks pass.
5. Render observes the successful commit checks/status and starts the automatic production deploy.
6. The Render deploy history should show `trigger: new_commit` for the same merge commit.

## Failure behavior

If CI fails, `capital-ai/ci-gate` is published as `failure` and Render must not deploy the commit while `autoDeployTrigger` remains `checksPass`.

## Verification after merge

Confirm all of the following for the merge commit:

- GitHub Actions `CI` run conclusion is `success`.
- Commit status `capital-ai/ci-gate` is `success`.
- Render creates a deployment for the same commit with `trigger: new_commit`.
- The deployment reaches `live`.

If the first two conditions are true but Render still creates no deploy, treat the incident as a Render GitHub-App/webhook integration fault rather than a repository CI-trigger fault. Do not weaken the gate to `On Commit` as a workaround without an explicit architecture decision.
