# CAPITAL-AI-DATA — DATA-12 Provenance Lineage Slice

**Date:** `2026-09-07`  
**Project:** `CAPITAL-AI-DATA`  
**Project stage:** `PVC-10` / handoff into `PVC-11`  
**DATA status:** `LINEAGE_SLICE_IMPLEMENTED`  
**main SHA at branch creation:** `2a6dfc5246672decd14cd8d0ace8dc2c4db94455`  
**Work branch:** `agent/data-12-provenance-20260907`

## Scope

Canonical lineage envelope `data-provenance-lineage/1.0.0` requires:

- asset identity
- provider path
- capability/field
- evidence reference
- observation and retrieval timestamps
- correlation identity

Incomplete lineage cannot be marked complete. A downstream copy that drops or mutates required fields does not survive the handoff.

`ValidatedDataInput` snapshot and history `provenanceComplete` now consume this evaluator instead of an ad-hoc boolean.

## Residual

Correction-version lineage remains an architecture gap. Provider-feed is retained as optional metadata and is not a required identity field.
