# HUMAN / OWNER Pull Request Approval Policy

Status: REQUIRED
Effective from: 2026-08-11
Repository Owner: `SvenKulessa`

## Purpose

Every pull request targeting `main` MUST remain human-visible and MUST receive a lightweight but explicit Owner review before merge.

AI agents, coding assistants and connector clients may prepare branches, commits, pull requests, evidence and CI fixes. They MUST NOT self-approve or autonomously merge a pull request.

## Human-visible change requirement

Before approval, the Owner MUST inspect the GitHub pull-request diff under `Files changed` and the CI/Governance results for the current PR revision.

GitHub's per-file `Viewed` state is treated as a human UI action. Because that state is not exposed as a reliable merge-gate signal to the current Actions contract, the Owner attests completion through a mandatory PR-body checkbox.

## Approval artifact

Approval consists of three human actions:

1. In the PR description the Owner checks:
   - `[x] Human/Owner: vollständigen PR-Diff geprüft.`
   - `[x] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`
2. The Owner submits a GitHub pull-request review for the current PR head commit.
3. The review body contains either `💪` or `okay`.

The review MUST:

- be authored by repository Owner `SvenKulessa`;
- be attached by GitHub to the exact current PR head commit;
- contain `💪` or `okay` (case-insensitive for `okay`);
- exist before merge.

A review attached to an older commit becomes invalid when the PR receives a new commit. The Owner must then inspect the delta again and submit a new short review.

## Required merge gate

The stable required check remains `build-and-test`.

To avoid slowing the production flow, the CI architecture separates:

- `technical-validation`: expensive Git/toolchain, dependency, TypeScript, unit-test, build, CSP/predeploy and Docker validation as required by scope;
- `build-and-test`: lightweight final merge gate that depends on successful technical validation and verifies the Human/Owner checklist + current-commit review.

Therefore a failed/missing Owner gate can be re-run without repeating the expensive technical validation.

Successful tests alone are insufficient for merge. Successful AI review alone is insufficient for merge. Human checklist completion without a current-commit review is insufficient for merge.

## AI-agent capability restriction

Until a future independently approved merge-controller architecture replaces this rule:

- AI agents MAY: READ, ANALYZE, PLAN, BRANCH, COMMIT, open/update PRs, inspect CI and propose fixes.
- AI agents MUST STOP before MERGE.
- ChatGPT, Claude and other AI clients MUST NOT interpret CI success as merge authorization.
- Merge is permitted only after the Human/Owner gate is satisfied.
- A merge through an AI client additionally requires an explicit human instruction to merge that specific PR after approval exists.

## Evidence

The pull request is the evidence bundle:

1. visible `Files changed` diff;
2. two checked Human/Owner PR-body boxes;
3. CI/Governance results;
4. current PR head SHA;
5. Owner review attached to that SHA with `💪` or `okay`;
6. resulting merge commit.

This policy is part of the CAPITAL-AI DevelopmentChain and must remain synchronized with `docs/architecture/ROADMAP.md`, Agent IAM policy and merge governance.
