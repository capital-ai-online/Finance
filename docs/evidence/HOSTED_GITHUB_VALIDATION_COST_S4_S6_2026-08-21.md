# Hosted GitHub Validation Cost — S4–S6 Evidence

- **Date:** 2026-08-21
- **Branch:** `agent/hosted-validation-cost-s0-s3-2026-08-21`
- **Work item:** S4 shadow attestation, S5 auxiliary runner reduction, S6 negative tests
- **Starting main:** `7d173d3239fdbe31216354fc848f948d517069f6`
- **Required Check mutation:** none
- **Production mutation:** none

## 1. Pre-implementation correlation

At S4–S6 start:

- current `main` remained `7d173d3239fdbe31216354fc848f948d517069f6`;
- the work branch was 1 commit ahead / 0 behind with merge-base exactly that main SHA;
- no open pull requests were present;
- no competing changed paths were found.

Repository authorities were re-read before implementation:

- `/AGENTS.md` requires independent hosted checks and canonical PR creation;
- ADR-0073 keeps `build-and-test` the sole repository-hosted technical Required Check;
- expected main protection requires `build-and-test` + `GitGuardian Security Checks`;
- M10 remains suspended/off.

## 2. S4 implementation evidence

Added:

- `.github/policies/pre-pr-attestation-trust.shadow.json`
- `scripts/pr/shadowAttestation.mjs`
- `scripts/pr/shadowAttestation.test.mjs`
- `docs/runbooks/PRE_PR_SHADOW_ATTESTATION.md`

Security properties:

- exact repository/PR/Base/Head binding;
- D/C/R class binding and trusted expected scope;
- toolchain binding;
- per-check SHA-256 evidence digest requirement;
- generation/expiry TTL;
- nonce;
- `candidateControlled=false` requirement;
- Ed25519 detached signature validation;
- canonical payload SHA-256 `attestationId`;
- unknown signer fail-closed;
- current registry contains zero trusted signers and cannot authorize a Required Check.

This proves the verifier contract without fabricating an independent signer.

## 3. S5A Google-Marketing runner consolidation

Previous measured PR #469 Google-Marketing static guard runtime was approximately three seconds but
rounded to one Linux runner minute.

Candidate topology:

- PR Governance remains one `ubuntu-latest` job;
- Google-Marketing protected wiring runs as a step in that already allocated runner;
- steady state uses the trusted-main validator against candidate content;
- bootstrap fallback is explicit for the cutover PR because current main does not yet contain the
  new validator;
- the former standalone workflow becomes `workflow_dispatch` manual diagnostics only;
- central `build-and-test` continues all technical test/build/predeploy evidence.

Expected recurring reduction: one separately rounded Linux minute for each future PR event that
would otherwise match the Google-Marketing protected path set, without removing the invariant.

## 4. S5B Self-Heal correlation and suspension

The previous `self-heal-ci.yml` had:

- automatic `workflow_run` activation after failed PR CI;
- `contents: write`, `pull-requests: write`, `issues: write`, `id-token: write`;
- checkout with write token;
- dependency installation;
- `anthropics/claude-code-action@v1` with `ANTHROPIC_API_KEY`;
- autonomous branch/commit/push behavior;
- free-form `gh pr create --draft` instruction.

The free-form PR creation conflicts with the current trusted `/AGENTS.md` requirement to read the
current main template, validate the work claim and render the canonical PR body before creation.
It also amplifies cost after every CI failure.

Candidate replacement:

- manual `workflow_dispatch` only;
- read-only `actions`, `contents`, `pull-requests` permissions;
- no AI secret/action;
- no checkout/npm install;
- no branch/commit/push/PR creation;
- read-only `gh pr view` / `gh run view` diagnostics.

No autonomous healer is reintroduced in this work item.

## 5. S6 isolated test evidence

The new Node built-in tests were executed in an isolated filesystem using the available local Node
runtime for syntax/logic validation. Repository CI remains responsible for independent Node 24
validation after PR creation.

Result:

```text
10 tests
10 pass
0 fail
```

Covered cases:

- valid signed exact snapshot;
- wrong PR/head/base/repository;
- cross-subject replay rejection;
- exact-subject reuse within TTL;
- expired/future evidence;
- candidate-controlled producer;
- unsigned evidence;
- unknown signer;
- tampered payload/signature;
- missing required check;
- shadow registry zero-signer invariant;
- Google protected path matching;
- complete Google wiring pass;
- missing central build evidence fail-closed.

## 6. Workflow syntax/security preflight

All three candidate workflow YAML files were parsed successfully with a local YAML parser.

Changed-workflow policy compatibility was statically checked against current main
`verifyChangedWorkflowSecurity.mjs` requirements:

- no `pull_request_target`;
- explicit least-privilege permissions;
- no `write-all`;
- no `persist-credentials: true`;
- every remaining external action pinned to a 40-character SHA;
- event workflows keep concurrency where applicable.

The new Self-Heal diagnostic contains no external `uses:` action at all.

## 7. Control boundaries preserved

This work does not change:

- `.github/workflows/ci.yml`;
- `build-and-test` Required Check identity;
- GitGuardian requirement;
- `.github/policies/main-production-protection.expected.json`;
- M10 state;
- Human/CODEOWNER merge authority;
- Sigstore/Fulcio/Rekor production provenance;
- `environment: production`;
- Render exact-SHA deployment;
- post-deploy identity verification.

## 8. Remaining future gate

A real independent shadow producer and Owner-approved signer do not exist yet and are deliberately
not invented by this branch. Therefore S7 hosted deterministic-check replacement is **not eligible**.
The correct next step after merge, if desired, is to gather real signed shadow evidence from a
separately controlled execution surface before any ruleset or Required Check cutover is proposed.
