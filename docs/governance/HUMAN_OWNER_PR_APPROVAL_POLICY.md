# HUMAN / OWNER Pull Request Approval Policy

Status: REQUIRED
Effective from: 2026-08-11
Repository Owner: `SvenKulessa`

## Purpose

Every pull request targeting `main` MUST remain human-visible and MUST receive a lightweight but explicit Owner review **before expensive CI/build/test execution begins**.

AI agents, coding assistants and connector clients may prepare branches, commits, pull requests, evidence and proposed fixes. They MUST NOT self-approve or autonomously merge a pull request.

## Human-visible change requirement

Before technical validation starts, the Owner MUST inspect the GitHub pull-request diff under `Files changed`.

The Owner MUST mark every changed file as `Viewed` in the GitHub UI. GitHub does not expose the per-user `Viewed` state as a reliable GitHub Actions API signal. Therefore enforcement is two-part:

1. the Owner performs the per-file `Viewed` actions in the UI;
2. the Owner explicitly attests completion through the mandatory PR-body checkbox.

This limitation MUST NOT be represented as if Actions could independently prove the per-file UI state.

## Pre-CI Owner gate

Expensive CI MUST NOT start until all of the following are true for the current PR head:

1. PR body contains:
   - `[x] Human/Owner: vollständigen PR-Diff geprüft.`
   - `[x] Human/Owner: alle geänderten Dateien im Tab Files changed als Viewed markiert.`
2. repository Owner `SvenKulessa` submitted a GitHub pull-request review for the exact current PR head commit;
3. the review body contains `💪` or `okay`.

A new commit invalidates the previous review evidence for gating purposes. The Owner must inspect the delta, confirm the checkboxes remain truthful and submit a new current-head review.

## CI sequencing

The CI sequence is intentionally:

`PR OPEN/UPDATE → LIGHTWEIGHT OWNER GATE → OWNER REVIEW PASS → TECHNICAL VALIDATION → build-and-test → MERGE ELIGIBLE`

Before Owner approval:

- only the lightweight gate may run;
- Git source build MUST NOT run;
- npm dependency installation/audit MUST NOT run;
- TypeScript/unit tests MUST NOT run;
- production build MUST NOT run;
- Docker build MUST NOT run.

After Owner approval:

- `technical-validation` executes the scope-appropriate technical pipeline;
- `build-and-test` remains the stable required check;
- governance/security workflows may run independently because they are lightweight policy checks.

Successful technical validation is still not merge authorization. Merge requires the existing Human/Owner policy and, when an AI client is used for the merge operation, a separate explicit human instruction for that specific PR.

## Owner authentication assurance

GitHub Actions can verify that the GitHub review author is account `SvenKulessa`, but it cannot determine whether that review session used a specific physical device or passkey. Device-ID claims alone MUST NOT be treated as a strong authentication factor.

For privileged future transitions (especially production mutation, break-glass and autonomous-agent capability elevation), the target architecture SHOULD add a separate CAPITAL-AI WebAuthn/passkey step-up assertion bound to actor + action + target + request/PR head. Until that service exists, no workflow may claim that GitHub review evidence proves passkey/device authentication.

## AI-agent capability restriction

Until a future independently approved merge-controller architecture replaces this rule:

- AI agents MAY: READ, ANALYZE, PLAN, BRANCH, COMMIT, open/update PRs, inspect CI and propose fixes when allowed by the active roadmap profile.
- AI agents MUST STOP before MERGE.
- ChatGPT, Claude and other AI clients MUST NOT interpret CI success as merge authorization.
- Merge is permitted only after the Human/Owner gate is satisfied.
- A merge through an AI client additionally requires an explicit human instruction to merge that specific PR after approval exists.

Read-only daily-task agents are governed separately by `AUTONOMOUS_AGENT_CONCEPT_GATE.md` and MUST NOT receive BRANCH, COMMIT, PR, CI_REQUEST, DEPLOY_REQUEST, PRODUCTION_MUTATION or MERGE capabilities.

## Evidence

The pull request is the evidence bundle:

1. visible `Files changed` diff;
2. Owner attestation that all changed files were marked `Viewed`;
3. two checked Human/Owner PR-body boxes;
4. current PR head SHA;
5. Owner review attached to that SHA with `💪` or `okay`;
6. subsequent technical CI/Governance results;
7. resulting merge commit.

This policy is part of the CAPITAL-AI DevelopmentChain and must remain synchronized with `docs/architecture/ROADMAP.md`, Agent IAM policy and merge governance.
