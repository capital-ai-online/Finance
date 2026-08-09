# Render Auto-Deploy A/B Test — 2026-08-09

## Objective

Determine whether the intermittent deployment failure is specific to Render's `After CI Checks Pass` (`checksPass`) trigger or affects GitHub→Render repository events generally.

## Production service under test

- Render service: `Finance`
- Repository: `SvenKulessa/Finance`
- Branch: `main`
- Runtime: Docker
- Normal production policy: `After CI Checks Pass`

## Evidence before test

- PR #136 merge commit `584d8d4f67af1ab0c8f063e71bcd3db530771bff` completed GitHub CI successfully and published `capital-ai/ci-gate: success`.
- PR #138 merge commit `a586e314de5ca0defc2686c2573e02833f84feae` also completed GitHub CI successfully and published `capital-ai/ci-gate: success`, but no corresponding Render deploy was observed at the time of validation.
- Render later produced an automatic `trigger: new_commit` deploy for commit `584d8d4f67af1ab0c8f063e71bcd3db530771bff`, indicating that GitHub repository events are reaching Render at least intermittently.

## A/B design

### A — checksPass baseline

Normal production configuration:

`GitHub merge → main CI → capital-ai/ci-gate success → Render checksPass → deploy`

Observed behavior has been delayed/intermittent.

### B — On Commit diagnostic

Temporarily set the Render `Finance` service Auto-Deploy policy to **On Commit**.

Then merge this documentation-only PR into `main`.

Expected sequence:

`GitHub merge → push to main → Render trigger:new_commit`

GitHub CI should continue to run independently, but Render must not wait for `capital-ai/ci-gate` during this diagnostic phase.

## Success criteria

The B-test passes if Render creates a deploy for this PR's exact merge commit with:

- `trigger: new_commit`
- final `status: live`

within the normal Render event-processing window.

If B passes while A remains unreliable, the fault domain is Render's `checksPass` / GitHub Check Suite correlation rather than repository access or push-event delivery.

If B also fails, investigate Render Git Deployment Credentials, GitHub App installation/repository access, and webhook/event delivery.

## Safety constraints

- Documentation-only repository change.
- No application/runtime/database/IAM/billing changes.
- No manual Render deploy during the test, because that would invalidate the observation.
- After evidence is captured, restore the Render Auto-Deploy policy to **After CI Checks Pass** unless a separate architecture decision explicitly replaces it.

## Required evidence after merge

Record:

1. exact GitHub merge commit SHA;
2. GitHub CI run result;
3. `capital-ai/ci-gate` result;
4. Render deploy ID;
5. Render deploy trigger (`new_commit` expected);
6. Render final status;
7. timestamps for merge, CI completion, Render deploy creation, and Render live state;
8. conclusion: `checksPass-specific`, `general Git integration`, or `inconclusive`.
