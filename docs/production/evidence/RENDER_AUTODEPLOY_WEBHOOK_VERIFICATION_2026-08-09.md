# Render Auto-Deploy (checksPass) Verification — 2026-08-09

**Related:** ADR-0037, `docs/runbooks/RENDER_PRODUCTION_EVIDENCE_HANDOFF.md`

## Incident

The merge of PR #134 (`570e4c5`) into `main` did not trigger an automatic Render deploy despite
`render.yaml`/the live service both declaring `autoDeployTrigger: checksPass` and GitHub CI
reporting `success` for that commit. The last automatic (`trigger: new_commit`) deploy before the
incident was for the PR #131 merge on 2026-08-08 09:39 UTC — i.e. the webhook path had been
working roughly 24h earlier and stopped delivering afterwards, rather than never having worked.

Production was unblocked by manually redeploying commit `570e4c5` via the Render API
(`dep-d9s9e7on74is7388ea60`, live 2026-08-09 15:06 UTC, `trigger: api`).

## Remediation

Repository owner re-authorized the Render GitHub App's repository access for `SvenKulessa/Finance`
(GitHub → Settings → Installations → Render → Configure). This is a dashboard-only action; no API
surface for GitHub App installation scope was available to automate or verify it directly.

## Verification method

This document is itself the verification payload: a trivial, non-functional PR merged to `main`
after the GitHub App reconnect, used only to observe whether the resulting merge commit produces a
Render deploy with `trigger: new_commit` (automatic) instead of requiring a manual `trigger: api`
redeploy. No application code changes.

Expected evidence after merge (recorded manually, not by this file):

```text
mergeCommitSha:
renderDeployId:
renderDeployTrigger: new_commit | api
renderDeployStatus: live | build_failed | ...
autoDeployConfirmed: yes | no
```
