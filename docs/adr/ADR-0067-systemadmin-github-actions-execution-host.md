# ADR-0067 — Systemadmin GitHub Actions Execution Host Binding

- Status: PROPOSED / SA3B IMPLEMENTATION
- Date: 2026-08-12
- Owner: SvenKulessa
- Scope: CAPITAL-AI Systemadmin Roadmap Executor
- Authority: ESS-0021, ADR-0065, ADR-0059, SA1–SA3A
- Baseline: `main@8de5a538ae9d2f0afc7b2e505ddda427ceb77780` (PR #218 merge)

## Context

SA3A established an append-only authorization/outcome adapter but deliberately did not claim that repository TypeScript can intercept the external ChatGPT GitHub connector before a side effect. SA3B must bind an actual execution host so that repository mutation cannot occur on the autonomous Systemadmin path before durable M5 authorization evidence exists.

The current connected GitHub surface can create issues from ChatGPT, but it does not expose a trusted middleware hook around every connector write and does not expose `workflow_dispatch` as an invokable tool in the current execution surface. Therefore a direct connector write cannot be considered SA3-enforced autonomous mutation.

## Decision

Use a dedicated GitHub Actions workflow as the first enforceable Systemadmin execution host.

Ingress is a strictly structured Owner-created GitHub issue. The issue is only a request envelope; it is not repository mutation authority.

Canonical chain:

`ChatGPT/GitHub connector → Owner execution-request issue → trusted workflow from main → GitHub OIDC → CAPITAL-AI audit broker → SA1/SA2/SA3 authorization → durable M5 auditReference → exact GitHub side effect → append-only outcome evidence`

The workflow may perform repository side effects only after the broker returned an ALLOW decision and durable audit reference for the exact capability and target.

## Why GitHub Actions

1. It is an actual mutation host inside the repository trust boundary.
2. `GITHUB_TOKEN` permissions can be declared per workflow and are not exposed to the model.
3. The workflow can be pinned to trusted code on `main` and can reject untrusted issue payloads before mutation.
4. GitHub Actions OIDC provides short-lived workload identity without adding a reusable GitHub-to-CAPITAL-AI shared secret.
5. The existing ChatGPT GitHub connector can create the structured ingress issue, so the current chat surface can reach the host without requiring a new custom ChatGPT MCP write connector.

## OIDC trust contract

The CAPITAL-AI broker accepts only a valid GitHub Actions OIDC token whose verified claims bind at minimum:

- issuer `https://token.actions.githubusercontent.com`;
- audience `capital-ai-systemadmin-execution`;
- repository `SvenKulessa/Finance`;
- actor `SvenKulessa`;
- event `issues`;
- ref `refs/heads/main`;
- exact workflow reference `.github/workflows/systemadmin-roadmap-executor.yml@refs/heads/main`;
- non-empty workflow/run identifiers;
- valid `exp` / `nbf` / `iat` window.

JWT signature verification uses GitHub's published OIDC JWKS. Unknown algorithms, keys, issuers, audiences or claims are fail-closed.

## Initial SA3B capability scope

The execution host can technically bind the existing repository capabilities:

- `BRANCH`
- `COMMIT`
- `PR`

`CI_REQUEST` remains governed by the existing Human/Owner PR gate and is not autonomously dispatched by SA3B.

The first real work-package mode is intentionally limited to **documentation-only** repository changes. It may write only UTF-8 text under paths allowed by the active REM and additionally rejects workflow/security/control-plane trust-root files.

A separate `BRANCH_PROBE` mode exists only for SA3B post-merge host verification under the one-time probe REM.

## Hard deny boundary

The host must never execute:

- `MERGE`;
- `DEPLOY_REQUEST`;
- `PRODUCTION_MUTATION`;
- direct production/platform mutation;
- repository-protection weakening;
- Owner IAM/MFA/break-glass changes;
- secret disclosure/credential rotation;
- workflow changes supplied by an execution request;
- package/dependency changes supplied by an execution request;
- SA1/SA2/SA3 trust-root or audit-control-plane changes;
- arbitrary shell commands from issue content.

## Request trust model

The issue payload may name only a mandate ID, roadmap item, current base SHA, branch name, documentation file writes and draft PR metadata.

The workflow loads the actual mandate from trusted `main`; it never accepts an executable mandate object from the issue. The broker re-runs the existing SA1/SA2/SA3 authorization path using that trusted mandate.

Issue body content is untrusted data. It is never interpolated directly into shell commands.

## Mutation ordering

For every side effect:

1. resolve current `main` and current host state;
2. construct exact authorization request;
3. obtain GitHub OIDC token;
4. call CAPITAL-AI broker;
5. require `ALLOW` + valid M5 `auditReference` + audit-bound permit;
6. perform exactly the authorized GitHub action;
7. persist terminal `SUCCESS` or `ERROR` outcome;
8. stop fail-closed on any broker/evidence failure.

No side effect is allowed before step 5.

## Probe REM

SA3B may include one narrowly scoped Owner-approved probe mandate whose only purpose is to prove a real permit-before-branch side effect after this PR is merged and deployed. It may not create content commits, PRs, CI requests, deployments or production mutations.

The probe does not count as the SA4 roadmap pilot because it carries no product work package and exists only to verify the execution-host security control.

## SA3B exit gate

SA3B becomes `COMPLETE / VERIFIED PASS` only after:

1. runtime/workflow/unit/negative tests pass on the final reviewed PR head;
2. Human merge occurs;
3. branch is deleted;
4. Render/main deployment exposes the broker without new unsafe secrets;
5. a real `BRANCH_PROBE` request from the Owner reaches the GitHub Actions host;
6. broker OIDC validation and M5 authorization evidence succeed before branch creation;
7. a missing/invalid permit path is proven to create no branch;
8. outcome evidence correlates the authorized branch result;
9. the probe branch is deleted after evidence capture.

Only then may SA4 create the first bounded non-production Roadmap work-package REM.

## Rollback

Repository rollback is `git revert` of the SA3B PR. If the broker is deployed, disabling/removing the workflow and reverting the route removes the autonomous host. No Supabase schema, Stripe, billing, DNS or external platform mutation is introduced by this ADR.
