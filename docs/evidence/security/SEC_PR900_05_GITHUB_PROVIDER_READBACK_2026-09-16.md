# CAPITAL-AI-SEC — SEC-PR900-05 GitHub Provider Readback

**Date:** `2026-09-16`  
**Project:** `CAPITAL-AI-SEC`  
**Project folder:** `docs/projects/security/`  
**Role:** read-only Security verification / provider-boundary evidence  
**Roadmap item:** `SEC-PR900-05 — CodeQL/PostHog/security-provider boundaries`  
**Correlation baseline:** `main@cf1d8b84f2455c0859f61407773ad9022dff00fa`  
**Branch:** `agent/security-provider-readback-20260916`  
**Trust root:** `/AGENTS.md@cf1d8b84f2455c0859f61407773ad9022dff00fa` (`Control Plane 2.11.0`)  
**Security contract:** `ESS-0006 v1.2.0`  
**Execution authority:** `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` / `CTRL-SEC-BOUNDED-REMEDIATION-001`  
**Provider mutation:** `NONE`

## Purpose

Reproduce the currently observable GitHub repository Security boundary through the already-connected read-only-capable GitHub surface, distinguish repository truth from prior chat returns, and fail closed where effective provider state is not observable.

This evidence does **not** install, enable, disable or reconfigure GitHub security products, CodeQL Default Setup, Copilot, SSO, Audit Streaming, Environments, IAM, OAuth, PATs, secrets, rulesets or repository permissions. It creates no new Security authority and does not treat connector availability as authorization.

`EVIDENCE_READY != VERIFIED` remains applicable to provider state that is not directly observed.

During correlation, PR `#992` merged and changed only `/AGENTS.md` chat-handoff presentation; the resulting Trust Root was fully re-read. Subsequent current-main drift through the Human-merged DATA/QM Roadmap work changed only `docs/projects/data/ROADMAP.md` and `docs/projects/quality-management/ROADMAP.md`. The final Security branch was therefore recreated from `main@cf1d8b84f2455c0859f61407773ad9022dff00fa` rather than reusing a vanished or stale branch ref. No Security workflow, planner, DATA evaluator or S1-R2-11 test identity changed through those intervening merges.

## Terminal predecessor correlation

PR `#969` (`[CAPITAL-AI-SEC] [ChatGPT] Selektive Provider-Workflows härten`) is terminal `CLOSED / NOT MERGED` with head `d544de6f68eb5fbb033e822117cd3b08285c6bb3`.

Under the current ordered-Roadmap rule, no successor may assume that closed-unmerged payload. The Security queue was therefore recomputed from then-current `main` instead of reusing the #969 branch.

Current `main` independently contains the relevant hardened repository behavior that must be evaluated as current truth:

- `.github/workflows/selective-codeql.yml` blob `5b5d37a8dff484e150c5cacc8ce5eb16f6703589` uses manual `workflow_dispatch`, read-only repository permissions for planning, `actions/checkout` v5.1.0 pinned to `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09`, `persist-credentials: false`, and blocks Advanced analysis when its runtime readback reports GitHub Default Setup active.
- `.github/workflows/selective-copilot-code-review.yml` blob `65ec9c519df7f80f005d941734214c7f33c268ca` is manual `workflow_dispatch` for one concrete PR, has top-level `permissions: {}`, performs no repository checkout or PR-controlled code execution, and scopes the only mutation permission to `pull-requests: write` in the review-request job.
- `scripts/pr/planPrValidation.mjs` blob `da303b82b5b4b3d7226251eaebb87aa3ad8ff393` validates `CHANGED_FILES_JSON` as a JSON `string[]` and prefers it over the legacy newline-delimited fallback; the file explicitly records that Security-sensitive provider workflows use JSON.

This is **current-main evidence**, not retroactive attribution of #969 as merged.

## Live repository ruleset readback

The repository exposes one active ruleset for `main`:

- Ruleset ID: `20849710`
- Name: `main-production-protection`
- Enforcement: `active`
- Target: `branch`
- Included refs: `~DEFAULT_BRANCH`, `refs/heads/main`
- Non-fast-forward protection: enabled
- Pull Request rule: enabled
- `require_code_owner_review`: `false`
- `require_extra_approval_for_unattributed_changes`: `true`
- Current user bypass: `never`
- Code Quality rule: enabled at severity `warnings`
- License Compliance Scanning rule: enabled

The exact Required Status Check set is:

1. `GitGuardian Security Checks`
2. `Hardened image / HIGH+CRITICAL CVE gate`
3. `PR Governance (Kosten / Workflow / Vorlage)`
4. `build-and-test`

**CodeQL is not a Required Status Check in this live ruleset.** No conclusion about whether CodeQL is enabled elsewhere follows from that fact alone.

## Provider-state observability boundary

The connected repository surface successfully exposed repository metadata, current rulesets, Pull Requests, workflow files and workflow-run evidence. A direct read of the GitHub Code Scanning Default Setup endpoint is not supported by the current connector fetch surface and returned an unsupported-endpoint boundary rather than provider state.

Therefore:

- CodeQL Default Setup effective provider state: `NOT_DIRECTLY_PROVEN_BY_THIS_READBACK`
- GitHub SSO state: `NOT_OBSERVED_IN_THIS_SLICE`
- Audit Streaming state: `NOT_OBSERVED_IN_THIS_SLICE`
- Environment/provider-permission state: `NOT_OBSERVED_IN_THIS_SLICE`
- Secret Protection / Secret Scanning effective provider state: `NOT_OBSERVED_IN_THIS_SLICE`

These states MUST NOT be upgraded from earlier `CHAT_RETURN` evidence to `VERIFIED` merely because repository-side workflows reference the provider APIs.

The exact pre-merge head `fbd5147e1309f09cce95b079f1df346a3c809220` of PR `#992` showed successful repository CI, Container Security and Governance workflow runs. No CodeQL workflow run was present in the connector's commit-workflow-run response for that exact head. This is useful negative observation about that returned run set, but it is **not** proof that GitHub CodeQL Default Setup is globally disabled because the provider's trigger/configuration state is not directly readable here.

## Positive Security evidence

| Invariant | Evidence | Result |
|---|---|---|
| `main` is protected by an active repository ruleset | live ruleset `20849710` | `PASS` |
| Required merge checks are explicit and bounded | exact four-check ruleset readback | `PASS` |
| CodeQL is not silently made Required by the live ruleset | CodeQL absent from exact required-status-check set | `PASS` |
| Selective CodeQL fallback is not automatic PR/push/schedule fan-out | current workflow has only `workflow_dispatch` | `PASS` |
| Selective CodeQL checkout is immutable and credential-less | checkout v5.1.0 SHA + `persist-credentials: false` | `PASS` |
| Copilot review path does not checkout/execute candidate code | current manual workflow | `PASS` |
| Copilot write authority is job-bounded | top-level `{}` + job `pull-requests: write` | `PASS` |
| Security-sensitive changed-file transport supports strict JSON validation | current planner blob | `PASS` |

## Negative / fail-closed evidence

1. Unsupported connector access to the Code Scanning Default Setup endpoint does **not** become `disabled`, `enabled`, `PASS` or `FAIL`; it remains `NOT_DIRECTLY_PROVEN_BY_THIS_READBACK`.
2. Absence of a CodeQL run from one exact PR-head workflow-run response does **not** prove global provider disablement.
3. Repository workflow configuration does **not** prove effective organization/provider permissions.
4. Prior chat returns for SSO, Audit Streaming, Environment APIs or provider scopes do **not** become current provider truth without a reproducible readback.
5. This slice performs no provider write, permission change, license activation, OAuth/PAT mutation, secret operation or ruleset mutation.
6. A closed-unmerged PR payload is never treated as integrated merely because later current-main behavior is semantically similar.

## S1-R2-11 queue re-correlation

The prior queue candidate `S1-R2-11 — Evidence identity/freshness` is no longer an implementation target:

- Security PR `#956` (`[CAPITAL-AI-SEC] [ChatGPT] S1-R2-11 unabhängig verifizieren`) is Human-merged; merge commit `8b2fc1805bdbf27523460ec41243ee32cb7e7609`.
- Exact PR head `c730ca539dc7a14c39d3066190105405390bd646` had successful hosted CI. The non-reused execution ran repository integrity, TypeScript and Unit Tests successfully; subsequent exact-snapshot CI reuse was also successful.
- Current-main DATA evaluator blob remains `062d68e05dca7d90c5de19ebb83e4d69d5294ab8`.
- Current-main DATA DQ envelope blob remains `d384872324d57a4ff34ed8b4d7d51d386f8ca672`.
- Current-main DATA owner-test blob remains `44544cd5ba4c9af835b160deff419ae669fa37fc`.
- Current-main independent Security test blob remains `a05ce6696149c8bdacf057bbc8a0b2118260c4b0`.
- The Security test covers positive exact/fresh authorization and negative wrong-identity, stale-clock rewrite, untrusted refresh, trusted wrong-identity refresh and missing-observation paths.

Therefore the repository-scoped Security verification gate for S1-R2-11 is satisfied on the currently unchanged contract/test identities. This does **not** imply a downstream Compliance PASS and does not alter DATA ownership of `PVC-10`.

## Disposition

- `SEC-PR900-05 / GitHub repository boundary`: `PARTIAL_VERIFIED`
  - live ruleset and current repository workflow/permission boundaries: `VERIFIED_BY_READBACK`
  - effective CodeQL Default Setup / SSO / Audit Streaming / Environment / broader provider permissions: `NOT_FULLY_PROVEN`
- `S1-R2-11`: `VERIFIED / CLOSED — repository scope`; downstream Compliance reassessment remains separate.
- `PR #969`: `CLOSED_UNMERGED / PAYLOAD_NOT_ASSUMED`; no reimplementation is justified from current main.

## Remaining gate

A future provider-level closure of `SEC-PR900-05` requires a supported, authorized read-only source that can reproduce the still-unobserved effective GitHub provider states. Any provider mutation remains a separate explicitly authorized action and is outside this evidence slice.