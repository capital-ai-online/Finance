# GOV-PR-DECISION-V18-MARKERFREE-BASELINE-01

**Project:** `CAPITAL-AI-GOV`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Source:** Issue `#1405`, PR `#1403` exact-head Governance failure  
**Baseline:** `main@be33bde31d9e96d8cb306086428f90036350d8ea`  
**State:** `IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED`

## Finding

PR #1403 currently has successful build/test, GitGuardian, license and container
evidence. Its remaining PR Governance failure is deterministic:

1. `productionPreflight.mjs` produces a valid exact-main/exact-head baseline.
2. The v1.8 body carries the canonical machine-baseline details boundary and the
   allowlisted marker-free `NOT_RUN` sentinel.
3. `repairCurrentDecisionBodyStructure()` rejects that state because its
   canonical branch requires an already-rendered baseline block.
4. Therefore `prepareLeadingPrBody()` never reaches the already-capable
   `replaceProductionBaselineBlock()` specialist.
5. PR Governance subsequently fails on missing
   `CAPITAL_AI_PRODUCTION_BASELINE_START/END`.

The immediate trigger came from the PR-body bootstrap path used for #1403:
the body was created/edited outside the canonical renderer and later normalized
to the repository's allowlisted `NOT_RUN` sentinel. The repository should still
converge this bounded state because that sentinel is already an explicit
self-healing contract.

## Bounded repair

- Do not add another writer.
- Do not make arbitrary marker-free v1.8 bodies repairable.
- Recognize only the exact current v1.8 three-section shape containing one
  machine-baseline details boundary, zero baseline markers and the exact
  allowlisted `NOT_RUN` sentinel.
- Preserve required-metadata validation.
- Return the structure as admissible so the existing
  `replaceProductionBaselineBlock()` stage performs the atomic mutation.
- Keep all non-allowlisted marker-free content fail-closed.

## Acceptance

- Structure test: exact sentinel shape is accepted for specialist refresh.
- Negative test: arbitrary marker-free machine-baseline text is blocked.
- Reconciler regression: PR #1403-style input produces exactly one start/end
  baseline marker pair and removes the sentinel.
- Existing v1.8 malformed-shape tests remain fail-closed.
- No workflow, merge, auto-merge or provider authority changes.
- Human/CODEOWNER merge remains required.
