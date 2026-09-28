# OPS-RETIRED-MERGE-CADENCE-VERSION-GATE-01

**Issue:** #1495  
**Project:** CAPITAL-AI-OPS  
**Primary PVC:** PVC-06 Version Management  
**Supporting PVC:** PVC-07 Release Management, PVC-02 Controlled Implementation  
**Baseline:** `main@73bdf0c295a5f23754d9a088891e17b6c8cbe349`  
**State:** `IMPLEMENTED_ON_BRANCH / EXACT_HEAD_VALIDATION_REQUIRED`

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
