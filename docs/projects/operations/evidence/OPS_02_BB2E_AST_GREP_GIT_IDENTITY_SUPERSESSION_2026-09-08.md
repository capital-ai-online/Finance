# OPS-02 — BB-2E ast-grep Git-Identity Evidence Supersession

**Date:** 2026-09-08  
**Status:** `PROPOSED EVIDENCE SUPERSESSION — EFFECTIVE AFTER HUMAN MERGE`  
**Current Project:** `CAPITAL-AI-OPS`  
**Current Project Folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Target project:** `CAPITAL-AI-FE`  
**Target branch:** `agent/frontend-dashboard-drawer-strangler-20260907`  
**Target FE head at correlation:** `6a30788e51ddc4ff8630b123a7d171af6e8cc9da`  
**Correlation baseline:** `main@f77e3b1219ca02407ee23a2456d1db554d107d1d`

## Classification

This document is a **project-local evidence correction**, not a Governance Authority supersession.

- Stable old authority ID: `N/A — source artifact is evidence, not normative authority`.
- Stable replacement authority ID: `N/A — this artifact is evidence, not normative authority`.
- Authority tier: evidence / report / historical documentation only.
- No `AUTH-*`, `CTRL-*`, ADR, ESS, PVC ownership, merge authority or protected-mutation authority is created or changed.
- The current `/AGENTS.md` and `docs/governance/GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md` remain controlling.

## Supersession relation

**Supersedes:** `docs/projects/operations/evidence/OPS_02_BB2E_AST_GREP_DISPATCH_2026-09-08.md`  
**Type:** `partial evidence supersession`  
**Activation condition:** Human merge of the PR containing the workflow Git-identity fix and this evidence package.  
**Exact targets:**

1. the prior conclusion that the BB-2E workflow was execution-ready for its local Git merge operations;
2. the implicit assumption that the Actions runner would provide a usable Git committer identity before `git merge`;
3. the privileged-job Bot identity configuration that occurred too late to protect the earlier read-only merge.

**Explicit exclusions:**

- Node.js `24.18.0` selection and the unresolved separate Node 24.20.0 authority conflict;
- the ast-grep source-patch runner, pinned `@ast-grep/cli@0.45.3`, `expectedMatches: 10` and `expectedPostMatches: 0` contract;
- the `patch-and-validate` / `apply-and-push` privilege split;
- `persist-credentials: false`, immutable action pins, exact-head binding and validated-blob binding;
- `CAPITAL-AI-FE` ownership of BB-2E and `src/components/Dashboard.tsx`;
- Human/Owner PR-creation approval and Human/CODEOWNER merge authority;
- any Production deployment, Release, Security verification or other protected mutation.

## Triggering evidence

The first real workflow execution reached a Git operation that required an identity and failed before ast-grep execution with:

```text
Committer identity unknown
fatal: empty ident name (...) not allowed
Error: Process completed with exit code 128.
```

The failure occurred because `git merge --no-commit --no-ff` in the read-only validation job ran before any local `user.name` / `user.email` configuration. The original workflow configured `github-actions[bot]` only later in the privileged job, after the earlier merge had already failed.

## Replacement behavior

The bounded replacement changes `.github/workflows/ops-ast-grep-source-patch.yml` so that **both jobs** configure the FE checkout immediately after checkout and before any merge operation:

```bash
git -C work config user.name 'SvenKulessa'
git -C work config user.email 'sven.kulessa@gmx.net'
```

The configuration is deliberately repository-local (`git -C work config`), not global. It therefore does not modify runner-wide Git state and does not create a new credential, token, permission or trust boundary.

The workflow regression test additionally requires:

- exactly two local `user.name 'SvenKulessa'` configurations;
- exactly two local `user.email 'sven.kulessa@gmx.net'` configurations;
- absence of `github-actions[bot]` identity in the BB-2E workflow.

## Semantic diff / impact package

| Dimension | Previous evidence | Replacement evidence |
|---|---|---|
| Merge identity readiness | Assumed runner/job state was sufficient | Explicit repository-local identity is required before every merge |
| Read-only job | Merge could fail before ast-grep because identity was unset | Identity configured immediately after FE checkout |
| Privileged job | Bot identity configured inside the later apply step | Same requested `SvenKulessa` identity configured before merge |
| Global runner state | Not explicitly constrained by identity handling | No `--global`; workflow changes only `work/.git/config` |
| Credentials / permissions | Existing least-privilege split | Unchanged |
| FE ownership | FE remains target owner | Unchanged |
| Node / ast-grep contract | Node 24.18.0 and 10→0 contract | Unchanged |

## Security impact

- **Privilege:** no expansion; `contents: read` and `contents: write` job boundaries are unchanged.
- **Credentials:** no new secret or token; Git author/committer metadata is not authentication material.
- **Scope:** identity is configured only in the checked-out `work` repository.
- **Fail-closed behavior:** exact main/head checks, source-patch cardinality, validated blob, remote-head recheck and push binding remain unchanged.
- **External mutation:** no Production or external-platform mutation is introduced.

## Regulatory / compliance impact

`N/A` for new external obligations. The change is repository workflow reliability/evidence correction and preserves the existing least-privilege and Human authority boundaries.

## Evidence impact

The original dispatch evidence is retained for historical traceability and labeled `SUPERSEDED — PARTIAL EVIDENCE ONLY`. Its architecture/security description remains useful historical evidence, but its execution-readiness/Git-identity conclusion must no longer be treated as current.

This replacement does **not** claim that the corrected workflow has passed runtime gates. Until a post-merge rerun succeeds, the following remain `NOT RUN` / open for the corrected exact workflow state:

- actual corrected `workflow_dispatch`;
- ast-grep dry-run `10` matches;
- ast-grep apply `10 → 0`;
- Legacy Drawer / `menuOpen` zero-result verification;
- focused BB-2E Vitest;
- TypeScript/Lint;
- Frontend Architecture check;
- Production Build;
- `git diff --check`;
- validated FE branch push.

## Rollback

If the replacement causes an unexpected regression, rollback is a normal repository revert of the workflow/test/evidence commits on a fresh then-current-main branch. No external resource rollback is required because this package changes repository files only.

## Owner decision boundary

This supersession package is not effective merely because it exists on a branch. Human/Owner PR-creation approval is required before PR creation; hosted checks are required for the exact PR head; Human/CODEOWNER merge remains the activation boundary for the corrected workflow/evidence state.
