# DATA Runbook — FinTech Handoff

## Purpose

Guarantee that CAPITAL-AI-FINTECH receives only validated upstream DATA observations while non-computable/missing/stale states remain explicit.

## Preconditions

- UAI identity validated;
- evidence identity present where required;
- provenance complete for every PASS observation;
- freshness evaluated;
- DQ aggregate status calculated by explicit transition rules;
- no direct Quality Center dependency in the producing hot path;
- any active Security requirement on the supplied evidence remains explicit rather than silently treated as verified.

## Handoff gate

A numeric observation may enter the downstream validated-input envelope only when its DATA status is `PASS` or explicitly `PARTIAL` for that exact present field. Missing optional fields remain absent.

The following cannot be coerced into numeric/neutral values:

- `FAIL`;
- `STALE`;
- `MISSING`;
- `NOT_COMPUTABLE`;
- `UNKNOWN`.

## Ownership boundary — PVC-11 -> PVC-12

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]`

- `project_namespace: PVC`
- `project_stage: PVC-12`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: consume ValidatedDataInput after the DATA Quality Gate and own downstream feature/scoring/ranking semantics`
- `reason: DATA owns validated upstream observations, not Feature Engineering or Scoring`
- `dependency: docs/projects/fintech/ROADMAP.md and the versioned DATA exit contract`
- `required_evidence: contract compatibility and preservation of explicit non-numeric states`
- `verification_gate: FINTECH target-project tests and governance`
- `status: REFERRED_NOT_EXECUTED`

After the boundary, FINTECH owns feature engineering, model inputs, confidence, scoring and ranking. DATA remains owner of source/evidence provenance and DQ semantics for supplied observations.

The compatibility `VC-12` marker is not a technical `SC-MD-SPT-0001` stage claim.

## Regression checks

- no zero-fill for missing fields;
- no stale-to-fresh promotion;
- no unknown-to-pass default;
- evidence IDs/refs survive serialization;
- correlation/asset identity survive serialization;
- downstream adapter rejects unsupported DATA contract versions;
- downstream consumers cannot interpret a pending Security verification as DATA `PASS` authority.
