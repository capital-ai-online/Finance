# OPS-RETIRED-MERGE-CADENCE-VERSION-GATE-01

**Issue:** #1495  
**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-06 Version Management  
**Supporting PVC:** PVC-07 Release Management, PVC-02 Controlled Implementation  
**Baseline:** `main@73bdf0c295a5f23754d9a088891e17b6c8cbe349`  
**State:** `DONE_MAIN / TERMINAL`

## Ziel

Den durch `/AGENTS.md@CURRENT_MAIN` supersedierten festen 10-Merge-PATCH-Zwang aus dem produktiven PR-CI-/Autofix-Pfad entfernen, ohne die weiterhin gültige 5-Merge-Deployment-Cadence oder die Release-Acceptance-Authority zu verändern.

## Bounded scope

- `.github/workflows/ci.yml`: ausschließlich den 10er-Merge-Version-Gate-Schritt und dessen trusted-policy Bootstrap entfernen.
- `scripts/pr/prAutofixRepairRegistry.mjs`: `MERGE_CADENCE_PATCH_V1` deregistrieren.
- `scripts/pr/repairers/mergeCadencePatchV1.mjs`: retired Writer entfernen.
- Regressionen aktualisieren, sodass die alte Signatur im Default-Registry fail-closed `no-registered-repairer` bleibt.
- Current architecture/work-package projection auf Release-Acceptance-Semantik konvergieren.

## Invarianten

- 5-Merge-Render-Deployment-Cadence bleibt unverändert.
- Keine neue Release-/Versionierungs-Authority.
- Kein package.json/package-lock.json Write aufgrund des Merge-Ordinals.
- Human/CODEOWNER Merge bleibt erforderlich.
- Keine Production-/Provider-Mutation.

## Exit Evidence

- Normaler PR-CI-Pfad enthält keinen `10er-Merge-Version-Gate`-Schritt.
- Default PR Autofix Registry enthält `MERGE_CADENCE_PATCH_V1` nicht.
- Alte Signatur wird als nicht registriert/fail-closed behandelt.
- TypeScript/Tests/CI/Governance/Security auf Exact Head PASS.
- Nach Merge kann #1495 nach frischem CURRENT_MAIN-Readback geschlossen werden.


## Main completion evidence

- Human/CODEOWNER merge: PR #1497 → `4ccc6cdf3bb8ddad5c4957c6bdea8f35f5871fd0`.
- Implementation head: `68ae5d281aa4617184e18844a4a37d6975088467`.
- Exact-head evidence: CI #6691, Governance #6175, Container Security #3666, Project Directive #938, PR #1032 and zizmor #767 completed successfully.
- Fresh CURRENT_MAIN readback: `4ccc6cdf3bb8ddad5c4957c6bdea8f35f5871fd0`; this is the PR #1497 merge commit.
- The productive PR-CI path contains no `10er-Merge-Version-Gate` and no `MERGE_CADENCE_PATCH_V1` signature.
- The default PR Autofix Registry no longer registers `MERGE_CADENCE_PATCH_V1`.
- The retired repairer implementation is absent as an executable repository path.
- The associated work claim is released/non-exclusive by this post-merge closure.
