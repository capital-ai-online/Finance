# M10 Controlled Cutover — Render Dispatch-Credential Handoff Evidence

Date: 2026-08-19  
PR: #429  
Authority: M10 Controlled Cutover / ADR-0066 / ESS-0022 / Human Owner confirmation

## Purpose

Record the pre-merge production handoff for the separate GitHub Actions dispatch credential required by the M10 Controlled Cutover. No secret value is stored in this repository evidence.

## Owner confirmation

The Human Owner confirmed in the controlled execution chat on 2026-08-19 that `M10_GITHUB_DISPATCH_TOKEN` was configured for the Finance production service.

This confirmation is evidence of the Human-performed secret mutation only. It does not expose, reproduce, or attest the raw credential value.

## Render verification

Read-only verification through the connected Render control plane found:

- workspace: `AICapital` (`tea-d90o4rj7uimc739i86ug`);
- service: `Finance` (`srv-d91o1o9o3t8c73edi55g`);
- region/runtime: Frankfurt / Docker;
- branch: `main`;
- auto-deploy: disabled;
- production URL: `https://finance-7clq.onrender.com`;
- manual deploy: `dep-da2kjtoae00c73cd89t0`;
- deployed commit: `afc8e56de7deebab879f054eb03e099bf516eb1b`;
- deploy status: `live`;
- deploy finished: `2026-08-19T06:16:35.058633Z`.

The manual deploy occurred after the Owner-confirmed credential configuration. The Render connector used for verification does not expose existing environment-variable values, so this evidence intentionally does not claim cryptographic proof of the secret value itself.

## Required credential posture

The configured dispatch credential is required to remain separate from `M10_GITHUB_TOKEN` and limited to repository `SvenKulessa/Finance` with GitHub Actions write plus only GitHub-required metadata read. It must not grant unrelated Pull Requests write, Contents write, Administration, Issues, or broader repository authority.

`M10_GITHUB_TOKEN` remains the separate read-only trusted PR-state resolver credential and must not be widened for dispatch.

## Current repository correlation

Immediately before this evidence commit, PR #429 had been automatically synchronized with the then-current `main@afc8e56de7deebab879f054eb03e099bf516eb1b` after PR #414 merged. Comparison was `behind=0`; the M10 Controlled-Cutover file set remained semantically separate from the newly merged privacy/runtime changes.

The bot-generated synchronization head produced GitHub Actions runs with conclusion `action_required` and no jobs, so those runs are not accepted as final validation evidence. This Human-authorized evidence commit intentionally retriggers the normal PR validation stack on the fully synchronized branch.

## Pre-merge gate

Repository merge-readiness requires all of the following on the new head created by this evidence commit:

1. Governance / changed-workflow security PASS;
2. canonical PR contract PASS;
3. Class-R `build-and-test` PASS including M10 OIDC negative tests, production build and Docker verification;
4. final branch-vs-current-main correlation with `behind=0`;
5. no newly introduced correlated open-PR conflict;
6. separate explicit Human instruction for merge.

The Render credential handoff does **not** authorize merge and does **not** make M10 `COMPLETE / VERIFIED PASS`. Post-merge deployment and the live Controlled-Cutover exit matrix remain mandatory.
