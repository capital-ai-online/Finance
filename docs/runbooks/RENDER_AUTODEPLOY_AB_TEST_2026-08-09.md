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

The following paths are proven functional:

`GitHub PR merge → main commit → Render On Commit → trigger:new_commit → live`

Therefore the PR merge mechanism itself is not the cause. GitHub repository access, Git deployment credentials, Render repository binding, and recognition of merge commits are all functional. The unreliable component is Render's `After CI Checks Pass` / GitHub Check Suite correlation path.

## Production decision

Render may use `On Commit` only if GitHub itself becomes the authoritative pre-merge deployment gate. `main` must be protected and merges must be blocked until the required CI check succeeds.

Required GitHub policy:

- protect branch `main`;
- require a pull request before merging;
- require status check `CI / build-and-test` to pass before merging;
- require branches to be up to date before merging, where operationally acceptable;
- block direct pushes to `main` except explicitly governed break-glass paths;
- do not use Render `checksPass` as an authoritative safety control while this defect remains unresolved.

## Current governance gap

At the time of this evidence capture, GitHub reports `main` as `protected: false` with required status-check enforcement off. Therefore `On Commit` must not be considered fully production-hardened until branch protection/rulesets are enabled.

## Follow-up

ADR-0046 defines the target deployment-gate ownership model. Once GitHub branch protection is active and verified, the legacy `capital-ai/ci-gate` compatibility status can be retired because Render no longer consumes it.