# OPS OSS Code Review Stack - 2026-09-20

**Project:** CAPITAL-AI-OPS  
**Scope:** Controlled Implementation / pull-request review  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@c074a891d9a3f308ac04ca2c4e4bca84b6c25964`  
**Status:** implementation evidence - non-authorizing

## Purpose

Replace reliance on revoked or proprietary automatic reviewers with a bounded open-source review stack that can run automatically without per-run Owner approval while remaining separate from build, test, deploy and protected external mutation.

## Selected stack

| Component | Role | License / provenance | Pinned integration |
|---|---|---|---|
| `hustcer/deepseek-review` | semantic AI PR review | MIT; upstream GitHub repository | `91b1e97ed366543eda139fa3278f4e72a5a7994b` |
| Semgrep Community Edition | deterministic SAST / secure coding review | open-source Semgrep engine; Community Edition | Python package `semgrep==1.177.0` |
| `reviewdog/reviewdog` | diff-scoped PR review publication | MIT; upstream GitHub repository | setup action `c410ce3b8686d2d90f4dc06e3f95d811ffff12b3`, binary `v0.21.0` |
| `actions/checkout` | exact-head checkout for deterministic scanner | GitHub Action already accepted in repository control surface | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` |
| `actions/upload-artifact` | short-lived SARIF evidence | repository-approved pinned action | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |

## Security boundaries

- Trigger is `pull_request`, never `pull_request_target`.
- Reviews run only for same-repository, non-draft pull requests.
- Top-level permissions are empty; each job receives only its minimum permissions.
- No job has `contents: write`, `actions: write`, `checks: write`, `id-token: write`, deployment, package or secret mutation authority.
- DeepSeek receives the ephemeral `GITHUB_TOKEN` only for GitHub Models inference and PR review publication. No reusable DeepSeek/OpenAI-compatible API key is introduced.
- The DeepSeek reviewer does not checkout or execute candidate code.
- The Semgrep checkout binds to the exact PR head and sets `persist-credentials: false`.
- Semgrep runs before the reviewdog token is exposed to a shell step.
- Review prompts explicitly treat repository text/diffs/comments as untrusted data to reduce prompt-injection risk.
- Secret-like and generated file patterns are excluded from the AI-review payload.
- Semgrep evidence is retained for seven days; it contains findings, not reusable credentials.
- Review output is advisory evidence. It grants no merge, build, test, deployment or production authority.

## Data boundary

The semantic reviewer sends the bounded pull-request diff to GitHub Models using the DeepSeek-R1 model endpoint. This is an external inference boundary and is therefore intentionally limited to same-repository PR diffs, excluded secret-like paths and a bounded maximum diff length.

The deterministic Semgrep path executes on the GitHub-hosted runner and publishes only diff-relevant findings through reviewdog.

## Existing reviewer state

No active CodeRabbit workflow/configuration was found on current main. The remaining `CodeRabbit` text occurrence is test-fixture/history content and does not represent an active integration.

The existing `selective-copilot-code-review.yml` remains manual-only and is not part of the automatic OSS exception.

## Validation contract

Static repository tests must verify that the workflow:

1. never uses `pull_request_target`;
2. never grants repository-content write authority;
3. pins all external GitHub Actions by full commit SHA;
4. does not invoke `npm ci`, unit tests, builds or deploys;
5. guards fork PRs and draft PRs;
6. uses exact-head checkout without persisted credentials;
7. keeps DeepSeek, Semgrep and reviewdog versions explicit;
8. keeps provider workflow changes on the conservative validation path.

Hosted build/test validation is deliberately not started by this implementation branch. It remains subject to the separate Owner-controlled CI boundary.
