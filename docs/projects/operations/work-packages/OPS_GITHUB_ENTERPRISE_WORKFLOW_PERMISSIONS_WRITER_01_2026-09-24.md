# OPS-GITHUB-ENTERPRISE-WORKFLOW-PERMISSIONS-WRITER-01

**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-02; supporting PVC-08/PVC-18  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Owner direction:** 2026-09-24 — create a bounded writer using the already-provisioned Enterprise classic PAT to disable GitHub Actions PR-review approval at Enterprise scope  
**Baseline:** `main@7c8f572e7112c96ee31264ec8a7775b971678a4d`  
**Branch:** `operations/github-enterprise-workflow-permissions-writer-20260924`  
**Status:** IMPLEMENTATION_ON_BRANCH / PROTECTED_PROVIDER_MUTATION_NOT_EXECUTED  
**Merge authority:** HUMAN_MERGE_REQUIRED

## Purpose

Add one narrowly bounded provider capability for the already-observed Enterprise workflow-permissions policy.

Observed provider state from successful Run `#35999363977`:

- `default_workflow_permissions=read`;
- `can_approve_pull_request_reviews=true`;
- Enterprise settings readback is fully observable;
- the 14-day classic PAT with `admin:enterprise` is accepted.

Desired state:

- preserve `default_workflow_permissions=read`;
- set `can_approve_pull_request_reviews=false`.

This is a governance hardening mutation only. It does not broaden Actions access or create a generic GitHub administration plane.

## Fixed provider capability

Only this provider path may be used:

`PUT /enterprises/{enterprise}/actions/permissions/workflow`

with exactly:

```json
{
  "default_workflow_permissions": "read",
  "can_approve_pull_request_reviews": false
}
```

No input may change the endpoint or desired values.

## Execution contract

1. Workflow is `workflow_dispatch` only.
2. Workflow runs only on `refs/heads/main`.
3. Actor must be `SvenKulessa`.
4. Dispatch input must exactly equal `SET_PR_APPROVAL_FALSE`.
5. Writer performs a provider GET before any mutation.
6. If `default_workflow_permissions != read`, execution fails before PUT.
7. If approval is already false, execution returns an idempotent NOOP.
8. If approval is true, exactly one bounded PUT is issued.
9. Writer performs a second GET and requires exact `read/false` readback.
10. No token or provider response body is emitted on failures.

## Credential boundary

The workflow reuses the existing Organization Actions secret
`CAPITAL_AI_GITHUB_ENTERPRISE_READ_PAT`.

The secret currently contains the already-validated classic PAT with `admin:enterprise`.
Inside the workflow it is injected under the process-local name
`CAPITAL_AI_GITHUB_ENTERPRISE_ADMIN_PAT` to make write intent explicit.

The secret:

- is never printed;
- is never persisted to repository files or artifacts;
- is not forwarded to child workflows;
- cannot be supplied through dispatch input;
- is only consumed by the fixed writer.

No additional PAT or credential is created by this package.

## Explicit non-scope

This package MUST NOT change:

- Enterprise Actions enablement / selected organizations;
- selected Actions/reusable-workflow policy;
- full-SHA pinning;
- Organization or Repository workflow permissions;
- Repository/Organization rulesets;
- IAM, SSO, PAT policy or PAT lifetime;
- GitHub Code Security / Secret Protection;
- Billing, budgets or cost centers;
- deployment environments;
- branch protection or merge authority.

It MUST NOT add a generic REST proxy, free-form URL, method, JSON body, arbitrary setting name or arbitrary provider command.

## Validation

Required branch evidence:

- writer unit tests cover NOOP, exact PUT, fail-closed precondition, readback mismatch and token non-disclosure;
- workflow security checks validate pinned Actions and minimal `contents: read`;
- exact branch head contains current main;
- no changed-file overlap or semantic writer conflict exists with open PRs;
- standard CI/Governance/Security checks are terminal-success.

Provider mutation is **not** executed from the PR branch.

## Exit evidence

Repository exit:

- bounded writer merged by Human/CODEOWNER;
- workflow exists on current `main`;
- no mutation occurred from PR execution.

Provider exit, after merge and explicit dispatch:

- pre-read = `read/true` or already-hardened `read/false`;
- mutation either NOOP or exactly one PUT;
- post-read = `read/false`;
- subsequent `Private GitHub Billing Read` shows
  `enterprise.actions.workflow_permissions.get = PASS`,
  `defaultWorkflowPermissions=read`,
  `canApprovePullRequestReviews=false`.

Organization/Repository inheritance is then re-read separately; no lower-scope mutation is implied by this package.
