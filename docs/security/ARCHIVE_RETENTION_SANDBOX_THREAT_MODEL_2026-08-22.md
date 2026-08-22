# CAPITAL-AI Archive Retention & ChatGPT Sandbox Threat Model

**Status:** Reviewed implementation evidence / effective with Human Merge  
**Date:** 2026-08-22  
**Scope:** Documentary Archive Retention planning + repository-local ChatGPT Sandbox pre-PR execution  
**Authorities:** `ADR-0096`, `ADR-0097`, `DEVELOPMENT_CHAIN_EXECUTION_POLICY`, `ESS-0019` where AI execution is involved

## Purpose

This threat model covers the two trust boundaries introduced by the current work package without creating a new Security, IAM, Documentary, CI or repository authority:

1. deterministic archive-retention/deletion-eligibility planning; and
2. local/ChatGPT sandbox execution of existing repository checks before Pull Request creation.

The controls remain subordinate to the existing Governance Control Plane, Documentary Maintenance Control Loop, Agent IAM and DevelopmentChain. Neither boundary authorizes Merge, Release, Deployment, production mutation or external platform mutation.

## Assets to protect

- canonical repository authorities, ADRs, ESS documents and registries;
- historical Evidence, Traceability and audit records;
- Security/Compliance and release evidence that must not be silently deleted;
- integrity of the checked-out feature branch and exact `origin/main` ancestry;
- repository source, tests, package scripts and validation results;
- credentials/secrets that may exist in the host environment but must never be copied into sandbox output;
- separation between local validation evidence and GitHub-hosted CI/Merge authority.

## Trust boundaries

### Archive Retention boundary

`ArchiveRetentionAgent` is a deterministic planner. It may classify an archive path as `retain`, `owner-review` or `delete-eligible`. It has no filesystem-delete, Git-delete, merge or production capability.

A `delete-eligible` result is only evidence for a later, separately authorized Documentary maintenance patch. Physical deletion therefore remains behind the existing branch, Agent-IAM, Human-review and PR controls.

### ChatGPT Sandbox boundary

The sandbox runner operates only inside an already available repository checkout. It inspects branch/diff state and invokes existing local npm/repository validation commands. It does not install dependencies, push Git refs, create/merge PRs, deploy, mutate Supabase/Stripe/Render or obtain new credentials.

GitHub-hosted CI remains an independent post-PR verification layer; local sandbox PASS is not merge authorization.

## Threats and controls

| Threat | Control |
|---|---|
| Destructive deletion of normative or historical evidence | Archive planner has no delete capability; protected authorities, registered/referenced documents, Evidence, Traceability, Security/Compliance and release records are retained or Human-review-only |
| Path traversal / symlink / lookalike archive path | Retention evaluation is repository-path bounded and deletion eligibility is limited to explicitly generated/transient archive classes; physical mutation remains a separate guarded apply operation |
| Model or retrieved text requests deletion of protected material | Retention classification is deterministic and non-AI-authorizing; untrusted content cannot grant mutation authority |
| Stale repository baseline produces misleading validation | Sandbox requires a non-`main` feature branch and exact current `origin/main` merge-base before the pre-PR profile is treated as valid |
| Sandbox accidentally becomes a second CI authority | Runner is explicitly pre-PR/advisory; hosted GitHub checks and Human/Owner Merge remain mandatory and separate |
| Hidden dependency/network installation causes cost or supply-chain drift | Default sandbox performs no `npm ci`, package installation or implicit network bootstrap; missing dependencies fail closed |
| Sandbox pushes code or performs external mutation | No push/PR/deploy/Supabase/Stripe/Render mutation commands are part of the profile; external mutation remains separately approved |
| Secret leakage through logs | Sandbox profile must not print environment values, credentials or secret files; checks receive repository state, not reusable credentials as output |
| Branch confusion or validation on `main` | `main` is explicitly rejected by the sandbox policy; validation is feature-branch-only |
| Broad `git add`/implicit mutation hides extra files | Sandbox is read-only with respect to Git staging/commit; repository mutation remains outside the runner |
| Local PASS masks unexecuted expensive checks | Default profile distinguishes local low-cost checks from explicit `--full`; PR body/hosted CI must state which checks actually ran |
| Archive plan replay after repository state changes | Physical deletion is not carried by the plan itself; a later maintenance patch must re-evaluate current path/registry/branch evidence |
| Duplicate Security or Documentary logic | Threat model references existing ADR-0096/0097, Agent IAM and DevelopmentChain controls; no new capability registry, IAM plane, workflow or deletion engine is introduced |

## Negative cases

The implementation is expected to deny or fail closed on at least:

- sandbox execution on `main`;
- branch whose merge-base is not current `origin/main`;
- missing local dependency/tooling state when a selected npm check requires it;
- implicit package installation/network bootstrap;
- any attempt to treat sandbox PASS as Merge/Release/Deployment authorization;
- archive candidate outside explicit generated/transient archive classes becoming automatically delete-eligible;
- registered/referenced/protected Security, Compliance, Evidence, ADR or ESS material becoming automatically delete-eligible;
- retention planning claiming a physical mutation (`mutationPerformed` must remain false).

## Security invariants

```text
ArchiveRetentionPlan != DeleteAuthorization
SandboxPass          != HostedCIPass
HostedCIPass         != HumanMergeAuthorization
RepositoryChange     != ProductionMutationApproval
```

These distinctions are fail-closed and must remain explicit in code, documentation and PR evidence.

## Residual risk

A human or separately privileged Git client can bypass these helpers and delete files, install packages, push commits or trigger external systems directly. This threat model does not attempt to replace GitHub permissions, host isolation, Human review or production platform authorization. It reduces accidental/agent-driven privilege expansion within the governed path only.

## Rollback

No external platform mutation is introduced by this threat model. Before merge, the feature branch/PR may be closed or deleted. After merge, rollback is a Human-authorized revert on a fresh branch from then-current `main`, followed by the applicable repository checks. Historical Evidence must not be rewritten as part of rollback.
