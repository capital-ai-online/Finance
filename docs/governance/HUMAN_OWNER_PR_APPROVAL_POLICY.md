# HUMAN / OWNER Pull Request Approval Policy

Status: REQUIRED
Effective from: 2026-08-11
Repository Owner: `SvenKulessa`

## Purpose

Every pull request targeting `main` MUST remain human-visible and MUST receive an explicit Owner approval for the exact pull-request head commit before it may be merged.

AI agents, coding assistants and connector clients may prepare branches, commits, pull requests, reviews, evidence and CI results. They MUST NOT self-approve or autonomously merge a pull request.

## Human-visible change requirement

Before approval, the Owner MUST be able to inspect the GitHub pull-request diff (`Files changed`) and the CI/Governance results for the exact head commit.

The approval is commit-bound. It does not approve a branch name, a PR number, or a previous revision.

## Approval artifact

The Owner records approval as a pull-request comment with this exact form:

`/owner-approve <HEAD_SHA>`

Example:

`/owner-approve 0123456789abcdef0123456789abcdef01234567`

The approving comment MUST:

- be authored by repository Owner `SvenKulessa`;
- reference the exact current PR head SHA;
- exist before merge;
- become invalid automatically when a new commit changes the PR head SHA.

## Required merge gate

The required GitHub check `build-and-test` MUST verify the Owner approval artifact as its final pull-request step.

Therefore:

- successful tests alone are insufficient for merge;
- successful AI review alone is insufficient for merge;
- an approval for an older SHA is insufficient;
- a new push requires a new human review and a new `/owner-approve <HEAD_SHA>` comment;
- `main` push validation is not subject to this PR approval step because approval must already have occurred before merge.

## AI-agent capability restriction

Until a future independently approved merge-controller architecture replaces this rule:

- AI agents MAY: READ, ANALYZE, PLAN, BRANCH, COMMIT, open/update PRs, inspect CI and propose fixes.
- AI agents MUST STOP before MERGE.
- Merge is permitted only after explicit Owner approval for the exact head SHA.
- ChatGPT, Claude and other AI clients MUST NOT interpret CI success as merge authorization.
- A merge through an AI client additionally requires an explicit human instruction to merge the specific PR after the Owner approval artifact exists.

## Evidence

The pull request itself is the primary evidence bundle:

1. visible diff;
2. CI/Governance results;
3. exact PR head SHA;
4. Owner approval comment;
5. resulting merge commit.

This policy is part of the CAPITAL-AI DevelopmentChain and must remain synchronized with `docs/architecture/ROADMAP.md`, Agent IAM policy and merge governance.
