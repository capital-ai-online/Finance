# Hosted GitHub Validation Cost Supersession — S0–S6

- **Document ID:** `GOV-SUPERSESSION-HOSTED-VALIDATION-COST-2026-08-21`
- **Authority ID:** `AUTH-GOV-HOSTED-VALIDATION-COST-SUPERSESSION-2026-08-21`
- **Version:** `0.3.0`
- **Status:** `PROPOSED — S5 COST-CONTROL IMPLEMENTATION CANDIDATE / HOSTED REPLACEMENT NOT ENABLED`
- **Date:** 2026-08-21
- **Baseline at work start:** `main@7d173d3239fdbe31216354fc848f948d517069f6`
- **S0–S3 evidence:** `docs/evidence/HOSTED_GITHUB_VALIDATION_COST_S0_S3_2026-08-21.md`
- **S4–S6 evidence:** `docs/evidence/HOSTED_GITHUB_VALIDATION_COST_S4_S6_2026-08-21.md`
- **Runbook:** `docs/runbooks/PRE_PR_SHADOW_ATTESTATION.md`

## 1. Scope and non-authority boundary

This work evaluates and reduces avoidable GitHub-hosted PR validation cost while preserving the
repository trust model. It does not authorize a replacement of `build-and-test`, GitGuardian,
Human/CODEOWNER merge authority or the verified production promotion chain.

The former unmerged working branch `agent/hosted-validation-cost-supersession-2026-08-21` never
became repository authority. This S0–S6 implementation branch is the only active work item for the
supersession analysis.

If merged, **S5 only** changes auxiliary runner topology:

1. Google-Marketing static wiring is co-located in the existing PR Governance runner and the
   separate Google-Marketing workflow becomes manual diagnostics only.
2. the autonomous Self-Heal `workflow_run` mutation path is suspended and replaced by a read-only
   manual diagnostic.

S4/S6 remain shadow-only research infrastructure and cannot satisfy a Required Check.

## 2. Existing authorities preserved

The following remain binding:

1. `/AGENTS.md` remains the single repository trust root.
2. ADR-0073 keeps `build-and-test` as the sole repository-hosted technical Required Check.
3. `.github/policies/main-production-protection.expected.json` keeps `build-and-test` and
   `GitGuardian Security Checks` required.
4. M10 Passkey authorization remains `SUSPENDED / OFF`.
5. Human/CODEOWNER merge authority remains separate from CI success.
6. Production promotion remains `main`-only and preserves supply-chain provenance/Sigstore,
   `environment: production`, exact-SHA Render deployment and post-deployment identity validation.
7. Candidate-controlled evidence cannot create its own CI or merge authority.

## 3. S0 — Cost baseline

S0 established that the primary avoidable cost was repeated runner allocation and per-job minute
rounding rather than the nominal Linux runner rate itself.

Representative measured evidence from PR #469:

| Path | Real duration | Rounded Linux minutes |
|---|---:|---:|
| Full Class-R `build-and-test` | ~170.6 s | 3 |
| P0 exact-snapshot reuse | ~2.7 s | 1 |
| P2A ready-for-review sync | ~1.1 s | 1 |
| separate Google-Marketing static guard | ~3.0 s | 1 |

The ten-final-head sample PR #460–#469 exposed 15 successful CI runs for ten final heads, including
multiple repeated full validations on identical final heads before P0. Pre-P1 Governance also
allocated several sub-minute jobs independently, each subject to whole-minute rounding.

Conclusion: preserve independent trust validation, but eliminate duplicate or separately rounded
runner allocations wherever the control can safely share an already-running trusted job.

## 4. S1 — Detection classification

### `UNIQUE_HOSTED_VALUE`

- authoritative GitHub PR number/body/event state;
- exact external Base/Head relation and current-main ancestry;
- trusted-main PR-body/workflow governance;
- Human/CODEOWNER merge boundary;
- independent GitGuardian security result.

### `REPLACEABLE_WITH_ATTESTED_EVIDENCE`

- repository integrity;
- dependency install/audit with freshness contract;
- TypeScript/lint/static contracts;
- unit/integration tests;
- production build/CSP/predeploy;
- Docker hardening/image validation with controlled builder identity;
- Google-Marketing static wiring.

### `REDUNDANT`

- exact Workflow+PR+Head+Base revalidation after an earlier successful PASS, already addressed by
  P0 snapshot reuse.

### `ADVISORY_ONLY`

- repository convention advisory work.

### `MAIN_ONLY`

- supply-chain provenance/Sigstore;
- `production` environment;
- Render exact-SHA deploy;
- post-deploy identity evidence.

## 5. S2 — Failure yield

S2 proved both categories of value:

- PR #469 had a genuine unit-test failure caused by stale M7 topology assertions. The defect was
  reproducible by ordinary tests and was not unique to GitHub hosting.
- PR #462 had a genuine canonical PR-body marker failure detected against the actual GitHub PR body
  with trusted-main policy. This is hosted trust-boundary value.
- PR #460 had a genuine missing mandatory merge-authorization section in the actual GitHub PR body,
  again detected by trusted-main governance.

Therefore globally disabling hosted PR validation would remove a control that has already caught
real governance defects.

## 6. S3 — Decision

Selected direction:

**Keep A now and evolve toward B. Do not activate C or D.**

- **A:** hosted required validation with continued dedupe/consolidation — current safe state.
- **B:** always keep a cheap GitHub trust-boundary path, while deterministic checks may later become
  risk-selective when independently attestable.
- **C:** replacement with independent exact-snapshot attestations — research/shadow only.
- **D:** global hosted disablement — rejected.

## 7. S4 — Shadow-only exact-snapshot attestation prototype

### 7.1 Purpose

S4 creates a verifier contract for future independently produced pre-PR evidence without allowing
that evidence to satisfy `build-and-test` today.

Canonical implementation:

- `scripts/pr/shadowAttestation.mjs`
- `.github/policies/pre-pr-attestation-trust.shadow.json`
- `scripts/pr/shadowAttestation.test.mjs`
- `docs/runbooks/PRE_PR_SHADOW_ATTESTATION.md`

### 7.2 Exact subject binding

An attestation is bound to:

- repository;
- PR number;
- Base SHA;
- Head SHA;
- D/C/R scope class;
- trusted expected scope flags;
- required toolchain;
- individual check evidence digests;
- generation/expiry time;
- nonce;
- independent producer identity;
- Ed25519 signature.

A signature covers the canonical unsigned payload. `attestationId` is a SHA-256 digest of that same
payload.

### 7.3 Fail-closed trust registry

The repository trust registry is deliberately:

- `state: SHADOW_ONLY`;
- `signers: []`;
- `authorizesRequiredCheck: false`;
- `authorizesMerge: false`.

Therefore no evidence produced today can bypass or replace hosted CI. Adding a trusted signer is a
future protected cutover, not a side effect of this PR.

### 7.4 Replay semantics

Evidence may be reused only for the **same exact subject** while it is fresh and correctly signed.
Reuse across another repository, PR, Base SHA or Head SHA is rejected. This mirrors P0's safe exact-
snapshot reuse model rather than inventing a weaker identity contract.

## 8. S5A — Google-Marketing static guard co-location

### Previous topology

A protected Google-Marketing path change allocated a separate `ubuntu-latest` job that normally
performed only a few seconds of static wiring validation, resulting in one whole rounded runner
minute.

### New topology candidate

- PR Governance still uses exactly one Ubuntu runner.
- a correlated Google-Marketing wiring check runs inside that existing runner;
- after this cutover reaches `main`, the validator is loaded from trusted `main` and inspects the
  candidate checkout;
- during this one bootstrap PR, if trusted `main` does not yet contain the validator, the candidate
  script runs while the old base-branch Google-Marketing workflow remains the independent cutover
  control;
- the standalone Google-Marketing workflow retains `workflow_dispatch` only as a manual diagnostic;
- full technical Google-Marketing validation remains in central `ci.yml`, `npm run build` and
  `predeploy:check`.

No Required Check name or ruleset entry changes.

## 9. S5B — Autonomous Self-Heal suspension

### Correlation finding

The prior `self-heal-ci.yml` automatically reacted to failed PR CI and allocated a write-capable
25-minute runner with repository write permissions, `id-token: write` and `ANTHROPIC_API_KEY`.
Its prompt instructed Claude to push a branch and use free-form `gh pr create --draft`.

That path conflicts with the current `/AGENTS.md` contract because agent PR creation must use the
canonical current-main PR template and work-claim validation before the external create mutation.
It is also a secondary cost amplifier after any CI failure.

### Suspension candidate

The workflow is reduced to a manual read-only diagnostic:

- no `workflow_run` automatic trigger;
- no repository write permission;
- no AI provider secret;
- no Claude Code action;
- no checkout or dependency install;
- no branch/commit/PR mutation;
- optional `gh pr view` and `gh run view` only.

A future autonomous healer requires its own controlled redesign, canonical work claim, current-main
PR-body generation and shadow evidence before reactivation.

## 10. S6 — Negative and invariance tests

The S4 verifier test suite covers:

1. valid signed exact subject;
2. wrong repository;
3. wrong PR number;
4. wrong Base SHA;
5. wrong Head SHA;
6. cross-subject replay rejection;
7. exact-subject reuse within TTL;
8. expiration;
9. materially future-dated evidence;
10. candidate-controlled producer rejection;
11. unsigned evidence rejection;
12. unknown signer rejection;
13. payload tampering/signature failure;
14. missing scope-required check rejection;
15. repository trust registry remains shadow-only with zero trusted signers.

Google-Marketing tests cover protected path classification, complete wiring acceptance and
fail-closed removal of central CI evidence.

Workflow topology tests cover:

- one PR Governance Ubuntu runner;
- trusted-main steady-state Google validator with bootstrap fallback;
- standalone Google workflow manual-only;
- Self-Heal manual-only/read-only/no-AI-secret/no-PR-create.

## 11. Merge impact if this PR is accepted

### Activated by merge

- S5A auxiliary Google-Marketing runner consolidation;
- S5B automatic Self-Heal suspension/read-only diagnostic replacement;
- S4/S6 shadow verifier code and tests become available for research/evidence generation.

### Explicitly not activated

- no replacement or removal of `build-and-test`;
- no change to GitGuardian requirement;
- no ruleset cutover;
- no M10 reactivation;
- no candidate self-attestation authority;
- no production pipeline or Render mutation change;
- no merge-authorization change.

## 12. S7 eligibility gate — future, not part of this activation

A replacement of deterministic hosted validation is **not eligible** until all of the following
exist on then-current `main`:

1. an independent evidence producer with an Owner-approved signer identity;
2. public key/federated trust provisioned through protected governance, never from candidate code;
3. representative D/C/R shadow comparisons against hosted validation;
4. negative tests for wrong PR/Base/Head, stale evidence, unknown signer, tampering and workflow
   security scope;
5. audit/dependency freshness rules;
6. evidence transport that does not mutate the attested Head after generation;
7. a cheap hosted verifier that resolves real GitHub PR state and trusted-main classification;
8. no loss of PR-body/current-main/workflow-security controls;
9. semantic updates to `/AGENTS.md`, ADR-0073 and expected/live ruleset in one coordinated cutover;
10. explicit Human/Owner ACCEPT or MODIFY after reviewing real shadow evidence and rollback.

Until then, S4 evidence remains non-authorizing by construction.
