# Render Auto-Deploy A/B Test — 2026-08-09

## Objective

Determine whether the intermittent deployment failure is specific to Render's `After CI Checks Pass` (`checksPass`) trigger or affects GitHub→Render repository events generally.

## Production service under test

- Render service: `Finance`
- Repository: `SvenKulessa/Finance`
- Branch: `main`
- Runtime: Docker
- Baseline policy: `After CI Checks Pass`
- Diagnostic policy: `On Commit`

## Evidence before test

- PR #136 merge commit `584d8d4f67af1ab0c8f063e71bcd3db530771bff` completed GitHub CI successfully and published `capital-ai/ci-gate: success`; Render did not create the expected deploy in the normal observation window.
- PR #138 merge commit `a586e314de5ca0defc2686c2573e02833f84feae` completed GitHub CI successfully and published `capital-ai/ci-gate: success`; Render did not immediately create the expected `checksPass` deploy.
- After the Render policy was switched to `On Commit`, Render created deploy `dep-d9sbffpt0dsc73bl4qqg` for PR #138's merge commit with `trigger: new_commit`; final status was `live`.

## B-test confirmation

PR #141 was merged while Render remained on `On Commit`.

- Merge commit: `ae35d4e57dbf06eadf5776c0e9d6353978f03f38`
- Merge timestamp: `2026-08-09T17:38:02Z`
- Render deploy ID: `dep-d9sbnugu01pc73e2mjq0`
- Render deploy created: `2026-08-09T17:42:19Z`
- Render deploy finished: `2026-08-09T17:43:27Z`
- Render trigger: `new_commit`
- Final status: `live`
- Observed merge-to-deploy-creation latency: approximately 4 minutes 17 seconds

## Conclusion

Result: **checksPass-specific fault domain confirmed**.

The following path is proven functional:

`GitHub PR merge → main commit → Render On Commit → trigger:new_commit → live`

Therefore the PR merge mechanism itself is not the cause. GitHub repository access, Git deployment credentials, Render repository binding, and recognition of merge commits are functional. The unreliable component is Render's `After CI Checks Pass` / GitHub Check Suite correlation path.

## GitHub plan constraint

GitHub reports `main` as `protected: false` with required status-check enforcement off. The current account/repository plan does not provide the required private-repository ruleset enforcement without an upgrade, and no upgrade is planned at this time.

This makes permanent `Render: On Commit` unsuitable as the production gate because Render can begin deployment before the push-triggered CI has validated that commit.

## Selected free-plan production architecture

ADR-0047 replaces both Render `checksPass` and permanent `On Commit` with an explicit GitHub Actions deployment gate:

`main update → GitHub build-and-test → success → deploy-production → Render Deploy Hook → exact verified SHA`

Required operational state:

- Render Auto-Deploy: **Off**;
- GitHub repository secret: `RENDER_DEPLOY_HOOK_URL`;
- deploy job runs only for `push` to `main`;
- deploy job depends on successful `build-and-test`;
- deploy hook receives the exact `github.sha` through its `ref` parameter;
- failed CI therefore cannot invoke the production deploy.

## Transition controls

PR #144 was merged on 2026-08-09 after the operational transition. The deployment decision was initially recorded under the colliding identifier `ADR-0046`; this was corrected retrospectively to `ADR-0047` without changing the deployment architecture.

Validate the resulting production path and confirm:

1. pull-request CI does not deploy;
2. successful push CI invokes `Deploy verified commit to Render`;
3. Render deploys the same commit SHA;
4. the deploy reaches `live`;
5. no Render `new_commit` auto-deploy is generated independently.
