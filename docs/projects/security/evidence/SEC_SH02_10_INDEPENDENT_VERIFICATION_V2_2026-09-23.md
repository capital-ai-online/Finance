# Security — SH-02.10 Independent Verification v2

**Project:** `CAPITAL-AI-SEC`  
**Role:** cross-cutting Security requirements and independent verification  
**Verification target:** `OPS-08-B-SH-02 / SH-02.10`  
**Verification baseline:** `main@bc7edc096450be6b368ea706b97479567cc6ee55`  
**Contract generation:** `self-healing-contract/1.2.0` / `sh-02.10-fault-convergence/1.3.0`  
**Date:** 2026-09-23  
**Result:** `VERIFIED / SECURITY_BOUNDARY_CONFIRMED`  
**Canonicalization gate:** this return becomes current Security assurance only after its exact-head checks pass and the SEC PR is Human/CODEOWNER-merged.

## Independence and generation

This verification is freshly bound to the post-#1309 generation. PR #1304 is evidence-only and is superseded for assurance purposes because its head does not contain current main and its evidence describes the older `self-healing-contract/1.1.0` / fault-suite `1.2.0` generation.

Security performs no OPS remediation, provider mutation, deployment, runtime recycle, rollback/restore, Production fault or SH-02.11 activation.

## Current-generation repository and production evidence

The exact verification generation has already completed the implementation-side evidence required for independent review:

- `CURRENT_MAIN=bc7edc096450be6b368ea706b97479567cc6ee55`;
- main CI #5841: PASS, including TypeScript, full test suite, production build, CSP, deployment readiness, Docker validation, provenance signing and verified Render deployment;
- Container Security #2843: PASS, including HIGH/CRITICAL gate, exact image digest, keyless signature and provenance/SBOM attestation;
- Post-Merge Production Correlation #243: PASS;
- Render deployment `dep-dapsme3tqb8s73dlesd0`: LIVE on exact `bc7edc096450be6b368ea706b97479567cc6ee55`;
- Project Execution Directive validation #365: PASS.

These implementation-side results are evidence inputs only; they do not replace this independent Security return.

## Independent Security assertions

Security independently verifies the following invariants against the exact current generation:

1. `SELF_HEALING_CONTRACT_VERSION === self-healing-contract/1.2.0`.
2. `SH_02_10_FAULT_SUITE_VERSION === sh-02.10-fault-convergence/1.3.0`.
3. The required SH-02.10 matrix contains exactly 17 scenarios.
4. Every scenario fixes `protectedMutationAllowed=false` and `productionFaultAllowed=false`.
5. Every scenario requires both `QM` and `SECURITY` assurance.
6. `RUNTIME_PROCESS_RECYCLE`, `REDEPLOY_EXACT_SHA` and `PROTECTED_ROLLBACK_RESTORE` remain `HELD`, externally capability-bound and max-attempts=1.
7. `PR_GOVERNANCE_V18_METADATA_OMISSION` and `PR_GOVERNANCE_V18_HYBRID_BASELINE_SECTION` both route through `RECONCILE_PR_DECISION_EVIDENCE`.
8. The superseded `RECONCILE_PR_GOVERNANCE_METADATA` action remains HELD and is not allowed for PR Governance metadata drift.
9. The PR Decision Evidence Reconciler is the only mutating PR-body self-healing workflow.
10. Production Baseline refresh and post-merge refresh remain compatibility relay/observer surfaces with no `pull-requests: write` authority and no direct PR-body repair implementation.

## Exact source identities reviewed

- `src/platform/Supervisor/selfHealingContract.ts` → blob `bf926f6d2629344a36a2ed76499e33450ab3a3e2`;
- `src/platform/Supervisor/faultInjectionConvergence.ts` → blob `0563f082a68fba99232d51cecdd336d279e5d602`;
- `.github/workflows/pr-decision-reconciler.yml` → blob `bfcc2893be2c818c4e009aff26bd2a589f787293`;
- `.github/workflows/pr-production-baseline-refresh.yml` → blob `12b88dfb56613449c72489c66dbe8ffb00ad571f`;
- `.github/workflows/pr-production-baseline-post-merge-refresh.yml` → blob `13255b19f8da1fa2a76d605700e60a8a6ca87f`.

The dedicated independent test surface is `tests/unit/securitySh0210IndependentAssurance.test.ts`. It verifies the generation, complete non-destructive matrix, HELD protected actions, #1298 convergence route and Single-Writer invariant without mutating implementation.

## Security verification matrix

| Security property | Result | Current-generation verification |
|---|---|---|
| Production fault injection | PASS — prohibited | all 17 scenarios fix `productionFaultAllowed=false` |
| Protected mutation | PASS — prohibited | all 17 scenarios fix `protectedMutationAllowed=false` |
| Runtime recycle | PASS — HELD | external capability required; max attempts=1 |
| Exact-SHA redeploy | PASS — HELD | external capability required; max attempts=1 |
| Rollback/restore | PASS — HELD | protected capability required; max attempts=1 |
| Missing/unsafe capability | PASS — fail closed | held/capability semantics remain enforced |
| Budget exhaustion | PASS — fail closed | bounded action budgets admit no extra attempt |
| #1297 metadata omission | PASS — bounded | routes through leading Decision Evidence action |
| #1298 hybrid baseline shape | PASS — bounded | converges through the same leading PR-body writer |
| Superseded metadata writer | PASS — held | cannot be selected for metadata-drift policy |
| Single PR-body writer | PASS | only PR Decision Evidence Reconciler owns `pull-requests: write` in the PR-body convergence chain |
| New Security/Production authority | PASS — absent | verification adds no runtime/provider/merge/activation authority |

## Residual boundary

This verifies the repository-level SH-02.10 Security boundary only. It does not authorize SH-02.11 production activation, accepted risk, provider capability expansion, rollback/restore, auto-merge or Human/CODEOWNER bypass.

A fresh independent QM return for the same exact generation remains mandatory. Any later mutation of the Self-Healing contract, fault matrix or PR-body writer architecture invalidates this generation-bound Security return until re-verification.

## Security conclusion

At `main@bc7edc096450be6b368ea706b97479567cc6ee55`, SH-02.10 preserves the declared non-destructive Security boundary and is `VERIFIED / SECURITY_BOUNDARY_CONFIRMED`.

The return is canonical only after this Security PR's exact-head checks pass and Human/CODEOWNER merges it. SH-02.11 remains blocked until both the current Security return and the independent QM return are canonical for the same generation.
