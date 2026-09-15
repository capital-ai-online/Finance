# CAPITAL-AI-SEC — S1-R2-11 Independent Verification

**Date:** `2026-09-15`  
**Project:** `CAPITAL-AI-SEC`  
**Security role:** independent verification; no productive PVC ownership  
**Affected productive owner:** `CAPITAL-AI-DATA / PVC-10 — Evidence Management`  
**Finding:** `S1-R2-11 — Evidence identity and stale-state automation`  
**Branch:** `agent/security-s1r211-verification-20260915`  
**Implementation baseline:** `main@ed584e36138427bb637af523df6e8ead994f6bda`  
**Status:** `IMPLEMENTED_BRANCH / HOSTED_PR_HEAD_VERIFICATION_PENDING`  
**Trust root:** `/AGENTS.md@ed584e36138427bb637af523df6e8ead994f6bda`  
**Security component contract:** `ESS-0006 v1.2.0`

## Purpose

Materialize a separate CAPITAL-AI-SEC re-test of the DATA-owned S1-R2-11 observer without modifying DATA production semantics or creating a second evidence/freshness authority.

This package intentionally adds only an independent Security negative-test surface plus this evidence record. The existing DATA evaluator remains the implementation authority for the observation semantics. Security consumes its public contract and verifies the original invariant independently.

`EVIDENCE_READY != VERIFIED` remains in force. This branch does not mark S1-R2-11 `VERIFIED` or `CLOSED` before the new Security test is executed by hosted PR-head CI.

## Authority and ownership boundary

Current project routing keeps:

- `CAPITAL-AI-SEC` cross-cutting, with no productive `PVC-*` stage;
- `CAPITAL-AI-DATA` as Primary Owner of `PVC-10 — Evidence Management`;
- Security responsible for independent test/verification evidence under `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION`, `CTRL-SEC-BOUNDED-REMEDIATION-001`, and `ESS-0006 v1.2.0`.

No DATA source file, provider configuration, EventMesh path, IAM setting, secret, production state, deployment surface or Compliance assessment is changed by this slice.

## Exact repository identity anchors

The verification is bound to the then-current repository baseline and immutable Git blob identities:

| Artifact | Exact identity |
|---|---|
| current-main baseline | `ed584e36138427bb637af523df6e8ead994f6bda` |
| DATA evaluator | `src/platform/MarketData/evidenceIdentityFreshness.ts` · blob `062d68e05dca7d90c5de19ebb83e4d69d5294ab8` |
| DATA DQ envelope | `src/platform/MarketData/evidenceQualityContracts.ts` · blob `d384872324d57a4ff34ed8b4d7d51d386f8ca672` |
| DATA owner unit test | `tests/unit/evidenceIdentityFreshness.test.ts` · blob `44544cd5ba4c9af835b160deff419ae669fa37fc` |
| independent SEC test | `tests/unit/securityS1R211IndependentVerification.test.ts` · blob `9adef6798f86627e692f2e33fca4fb17ec2e561b` |

The DATA evaluator contract remains exactly `evidence-identity-freshness/1.0.0` over the existing `market-evidence-dq/1.0.0` envelope.

## Owner-return provenance

DATA PR #811 (`[CAPITAL-AI-DATA] [Grok] S1-R2-11 Evidence-Identität und Freshness`) is Human-merged.

Exact owner-return identities:

- PR head: `776fe328e2e23c8fad075f591f1909ebfa431dbe`;
- merge commit: `a6a62e867749efe80fc05aa175a3dc3fdd183d82`;
- exact-head Container Security run `34098578728`: `success`;
- exact-head Governance run `34098578781`: `success`;
- exact-head CI run `34098578752`: `success`.

The current-main evaluator/test blobs are unchanged from that owner-return payload. This historical owner CI is supporting provenance only; it does not substitute for execution of the new independent Security test on this branch/PR head.

## Independent Security test cases

`tests/unit/securityS1R211IndependentVerification.test.ts` verifies the original Security invariant through the public DATA evaluator:

1. **Exact identity + fresh VERIFIED evidence** → `CURRENT`, `authorizesCurrent=true`.
2. **Wrong immutable identity** — independently mutates `assetId`, `providerId`, `capability`, and `field`; each must remain `STALE`, `authorizesCurrent=false`, reason `wrong-identity`.
3. **Stale evidence with rewritten freshness clocks** must remain `STALE/non-current`; a clock rewrite is not a trusted refresh.
4. **Untrusted refresh** with otherwise fresh/exact replacement evidence must fail closed as `STALE_RETRY_REQUIRED/non-current`.
5. **Trusted wrong-identity refresh** must remain `STALE/non-current` with `refresh-wrong-identity`.
6. **Trusted exact fresh refresh after stale state** may transition to `CURRENT_AFTER_REFRESH`, `authorizesCurrent=true`.
7. **Missing observation** requires `STALE_RETRY_REQUIRED/non-current`.

This test is Security-owned verification evidence. It does not alter or duplicate DATA's implementation contract.

## Validation truth at branch materialization

| Check | State |
|---|---|
| Branch created exactly from `main@ed584e36138427bb637af523df6e8ead994f6bda` | `PASS` |
| Initial branch diff before materialization | `0 ahead / 0 behind / 0 files` |
| Exact DATA evaluator / DQ / owner-test blobs re-read from current main | `PASS` |
| DATA PR #811 exact-head hosted runs re-read | `PASS` |
| Independent Security test file materialized | `PASS` |
| New independent Security test executed locally | `NOT RUN` — GitHub connector surface provides no local repository runner |
| Hosted PR-head execution of new Security test | `NOT RUN` — no PR exists yet |
| Security Roadmap promoted to `VERIFIED/CLOSED` | `NO` — intentionally remains `MERGED / VERIFY PENDING` until hosted PR-head evidence exists |

`NOT RUN` is not treated as PASS.

## Verification gate

S1-R2-11 remains fail-closed `MERGED / VERIFY PENDING` at this stage.

Promotion to Security `VERIFIED / CLOSED — repository scope` is permitted only after all of the following are true on the exact PR head:

1. hosted CI executes the independent Security test and passes;
2. TypeScript/unit/build checks required by the then-current PR classifier pass;
3. the DATA evaluator and relevant DQ contract remain semantically unchanged or any drift is re-correlated and re-tested;
4. current-main/open-writer/authority correlation remains PASS;
5. no missing, stale, wrong-identity or untrusted-refresh path authorizes current state.

Provider/production verification is not required for this pure deterministic repository contract unless then-current authority or implementation changes make runtime/provider state material.

## Downstream Compliance boundary

This Security verification is evidence input for later CAPITAL-AI-COMP reassessment of `REQ-COMP-033`. It is not an automatic Compliance PASS. The Human-merged OPS-18 strict/source-binding returns and this Security evidence must be independently consumed by Compliance against then-current main.

No Compliance requirement is changed or closed on this branch.
