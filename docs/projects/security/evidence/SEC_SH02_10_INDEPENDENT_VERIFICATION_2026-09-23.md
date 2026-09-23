# Security — SH-02.10 v1.2 Independent Verification

**Project:** `CAPITAL-AI-SEC`  
**Role:** cross-cutting Security requirements and independent verification  
**Verification target:** `OPS-08-B-SH-02 / SH-02.10`  
**Verification baseline:** `main@d5bac1575796f7f73238527abfac0fd1cc4d836b`  
**Contract generation:** `sh-02.10-fault-convergence/1.2.0` / `self-healing-contract/1.1.0`  
**Date:** 2026-09-23  
**Result:** `VERIFIED / SECURITY_BOUNDARY_CONFIRMED`

## Independence and generation

This verification is freshly bound to the Human-merged PR #1305 generation. The pre-#1305 Security assessment is stale for the changed contract generation and is not used as the current return.

Security performs no OPS remediation, provider mutation, deployment, runtime recycle, rollback/restore or Production fault.

## Current-main Security evidence

Current main proves:
- 16 deterministic SH-02.10 scenarios with `protectedMutationAllowed=false` and `productionFaultAllowed=false`;
- `RUNTIME_PROCESS_RECYCLE`, `REDEPLOY_EXACT_SHA` and `PROTECTED_ROLLBACK_RESTORE` remain `HELD`;
- fail-closed scenarios for missing capability, failed exact-SHA readback and exhausted budget;
- unsafe HTTP mutation methods are not automatically retried;
- worker ambiguity remains inside the existing quarantine/dead-letter boundary;
- the new `PR_GOVERNANCE_V18_METADATA_OMISSION` path maps to `REPOSITORY_PR_GOVERNANCE_METADATA_DRIFT -> RECONCILE_PR_GOVERNANCE_METADATA`;
- that new recovery is SH-1, idempotent, WORK_ITEM scoped, capability-bound to the existing PR Production Baseline refresh writer, max-attempts=1 and requires exact Governance-metadata readback;
- no new production-runtime, protected-state, Security or merge authority is introduced.

Relevant blobs:
- `src/platform/Supervisor/faultInjectionConvergence.ts` → `821f2eea205ad76e95d783ad5346bfa60520af53`;
- `tests/unit/faultInjectionConvergence.test.ts` → `a1bf618cc25b84d069c682bc1c2f57032aefd0e5`;
- `src/platform/Supervisor/selfHealingContract.ts` → `8bfdf32fe223f613e94ee8fbb6c4ed55810e8ff0`.

## Exact-head Security evidence

PR #1289, #1297 and #1305 each completed their final applicable CI/Governance/Container-Security/PR-policy/Project-Directive validation successfully before Human/CODEOWNER merge. PR #1305 exact head is `5ad49aeb8fd5f699cb93ea8bff1015df881ff23e`; merge commit/current main is `d5bac1575796f7f73238527abfac0fd1cc4d836b`.

Historical failed intermediate Governance runs remain failed history; only the final successful exact-head runs support the current state.

## Security verification matrix

| Security property | Result | Current-generation verification |
|---|---|---|
| Production fault injection | PASS — prohibited | only in-memory/model/mock seams are allowed |
| Protected mutation | PASS — prohibited | scenario contract fixes protected mutation to false |
| Runtime recycle | PASS — HELD | cannot execute from SH-02.10 |
| Exact-SHA redeploy | PASS — HELD | drift/readback scenarios escalate without authorization |
| Rollback/restore | PASS — HELD | SH-02.8 remains negative-control only |
| Missing capability | PASS — fail closed | explicit capability-blocked path |
| Budget exhaustion | PASS — fail closed | no additional attempt admitted |
| Unsafe mutation retry | PASS — denied | mutation requests are not generic retry candidates |
| Worker ambiguous side effects | PASS — bounded | existing quarantine/dead-letter authority preserved |
| Repository projection repair | PASS — bounded | one-attempt existing autofix with exact-head readback |
| v1.8 Governance metadata repair | PASS — bounded | SH-1 WORK_ITEM scope; one attempt; existing writer; ambiguity fails closed |
| New Security/Production authority | PASS — absent | no new Security, deployment, protected-state or merge authority |

## Residual boundary

This verifies the repository-level SH-02.10 non-destructive contract only. It does not authorize SH-02.11 production activation. SH-02.11 must separately re-correlate then-current Production identity, tier kill switches, effective capability grants and all SH-3 prerequisites.

## Security conclusion

At `main@d5bac1575796f7f73238527abfac0fd1cc4d836b`, SH-02.10 v1.2 preserves the declared Security boundary and is `VERIFIED / SECURITY_BOUNDARY_CONFIRMED`.

The return becomes current canonical Security evidence only after this SEC PR is Exact-Head-valid and Human/CODEOWNER-merged. Any later SH-02.10 contract mutation invalidates the generation-bound return until re-verification.
