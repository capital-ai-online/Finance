# CAPITAL-AI-FINTECH Runbook — Validated Data → Feature Handoff

## Purpose

Guarantee that the FINTECH Feature Engineering stage receives only validated PVC-09..11 observations while non-computable/missing/stale states remain explicit.

## Preconditions

- UAI identity validated;
- evidence identity present where required;
- provenance complete for every PASS observation;
- freshness evaluated;
- DQ aggregate status calculated by explicit transition rules;
- no direct Quality Center dependency in the producing hot path;
- any active Security requirement on the supplied evidence remains explicit rather than silently treated as verified.

## Handoff gate

A numeric observation may enter the downstream validated-input envelope only when its validated-data status is `PASS` or explicitly `PARTIAL` for that exact present field. Missing optional fields remain absent.

The following cannot be coerced into numeric/neutral values:

- `FAIL`;
- `STALE`;
- `MISSING`;
- `NOT_COMPUTABLE`;
- `UNKNOWN`.

## Internal ownership boundary — PVC-11 -> PVC-12

`[INTERNAL_FINTECH_HANDOFF | PVC-11 -> PVC-12]`

- `project_namespace: PVC`
- `project_stage: PVC-12`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: consume ValidatedDataInput after the PVC-11 Quality Gate and own downstream feature/scoring/ranking semantics`
- `reason: preserve the internal boundary between PVC-09..11 validated-data semantics and PVC-12..17 feature/scoring/ranking semantics`
- `dependency: docs/projects/fintech/ROADMAP.md and the versioned validated-data exit contract`
- `required_evidence: contract compatibility and preservation of explicit non-numeric states`
- `verification_gate: FINTECH target-project tests and governance`
- `status: REFERRED_NOT_EXECUTED`

After the boundary, PVC-12..17 own feature engineering, model inputs, confidence, scoring and ranking. PVC-09..11 remain the FINTECH stages responsible for source/evidence provenance and DQ semantics for supplied observations.

The compatibility `VC-12` marker is not a technical `SC-MD-SPT-0001` stage claim.

## Regression checks

- no zero-fill for missing fields;
- no stale-to-fresh promotion;
- no unknown-to-pass default;
- evidence IDs/refs survive serialization;
- correlation/asset identity survive serialization;
- downstream adapter rejects unsupported validated-data contract versions;
- downstream consumers cannot interpret a pending Security verification as validated-data `PASS` authority.
