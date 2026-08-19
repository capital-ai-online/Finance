# Deployment Reconciliation Evidence — PR #434, #435, #436, #438

Status: READY FOR VALIDATED REDEPLOY
Date: 2026-08-19
Repository: `SvenKulessa/Finance`
Target branch: `main`

## Purpose

This evidence package reconciles the repository state after four Human-merged pull requests were incorporated into `main` without a corresponding Render deployment being created for their merge commits.

The four pull requests are already present in the current `main` history. Their implementation commits are therefore **not** cherry-picked, replayed, or re-applied. This avoids duplicate migrations, duplicate external side effects, and semantic conflicts. The only change in this reconciliation branch is this deployment-evidence document, creating a fresh reviewable PR and, after a separate Human merge, a new validated `main` push through the existing CI → supply-chain-attestation → Render deploy-hook path.

## Consolidated landed scope

| PR | Scope | Merge commit | Main inclusion |
| --- | --- | --- | --- |
| #436 | PDF branding / renderer accessibility finalization | `f5d39288d3b854d5a84001ed0f4046f29e5cc840` | ancestor of current `main` |
| #434 | Privacy retention / DSAR / Stripe least-event hardening | `0c391b292746ca31b4a8e29d1ebf9dd16ba153b9` | ancestor of current `main` |
| #435 | SC-2 global multi-asset single-dispatcher exit | `78d1ba83cd4ddcff098eaf75cdd5e4c3fc320a0e` | ancestor of current `main` |
| #438 | PDF P1/P2 post-merge traceability closure | `8cf8ba6a0be86c022e7fc71667271f97b686b2fd` | current `main` at branch creation |

Current reconciliation baseline at branch creation:

- `main`: `8cf8ba6a0be86c022e7fc71667271f97b686b2fd`
- Render last confirmed deployed commit before reconciliation: `b22327b17a23455347b19ab4ec12ed784045c0dc` (PR #437)
- Repository production drift therefore includes the landed changes from #436, #434, #435 and #438.

## Deployment root-cause correlation

The Render `Finance` service has repository auto-deploy and pull-request previews disabled. Production deployment is intentionally controlled by GitHub Actions. The canonical `ci.yml` main-push path performs repository validation and supply-chain attestation before invoking `RENDER_DEPLOY_HOOK_URL`.

The missing deployments were not Render build failures: no Render deploy objects were created for the four merge commits. The deployment request was never reached for those commits. Rapid successive merges plus the shared `main` workflow concurrency group with `cancel-in-progress: true` can supersede an in-flight main validation before the deploy-hook stage.

This reconciliation does **not** weaken that security boundary and does not enable Render auto-deploy.

## Safety constraints

- No Supabase migration is replayed.
- No Stripe mutation is replayed.
- No Render configuration is changed by this PR.
- No scoring implementation is duplicated.
- No PDF implementation is duplicated.
- No workflow file is modified.
- Existing M10 Owner-Passkey rules for expensive PR CI remain unchanged.
- Human merge remains a separate authorization gate.

## Validation plan

Before merge:

1. Keep this branch synchronized with current `main`.
2. Re-check open PRs for direct file overlap.
3. Run only the repository-required Class-D validation after PR creation and required M10 authorization; no paid full build/test run is initiated pre-PR.
4. Confirm the final PR head remains `behind=0` against `main`.

After separate Human merge:

1. Observe the `main` CI run for the reconciliation merge commit.
2. Require `build-and-test` and supply-chain attestation to complete according to the canonical workflow.
3. Confirm a new Render deploy object is created via `deploy_hook` for the reconciliation merge commit.
4. Confirm `/healthz` and deployment-identity evidence resolve to that exact commit.

## Before / after matrix

| Control | Before reconciliation | Target after reconciliation merge |
| --- | --- | --- |
| Repository state | #434/#435/#436/#438 already landed | unchanged implementation state |
| Render production commit | `b22327b17a23...` | reconciliation merge commit |
| Replayed migrations / provider mutations | none | none |
| Deployment authority | GitHub validated main → Render deploy hook | unchanged |
| Render auto-deploy | disabled | disabled |
| Human merge gate | required | required |
| Production drift | present | eliminated after verified deploy |

## Exit criteria

This reconciliation is complete only when the final reconciliation merge commit is confirmed live in Render and deployment identity matches the exact `main` commit. Until then the document represents deployment-recovery intent and repository correlation evidence, not proof of successful production deployment.
