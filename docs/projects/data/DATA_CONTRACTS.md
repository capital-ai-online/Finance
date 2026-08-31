# CAPITAL-AI-DATA — Contract & Status Semantics

This document defines the intended DATA boundary. It is a project contract proposal and does not supersede current runtime contract versions until implemented and accepted through normal repository governance.

## Project-routing identity

- DATA owns `PVC-09`, `PVC-10`, `PVC-11`.
- FINTECH owns the next project stage `PVC-12`.
- `PVC-*` is organizational routing only.
- Existing technical `VC-*` under `SC-MD-SPT-0001` remains separately governed.

## DATA status model

| DATA status | Meaning | Downstream numeric feature eligibility |
|---|---|---|
| `PASS` | Required schema, identity, provenance, freshness and DQ checks satisfied | allowed as validated source input |
| `PARTIAL` | Optional/declared fields missing but required core remains valid | only present validated fields; never impute missing fields |
| `FAIL` | Invalid schema/value/provenance or explicit negative DQ result | prohibited |
| `NOT_COMPUTABLE` | Required evidence/input absent or semantically inapplicable | prohibited; remains non-numeric |
| `STALE` | Evidence age exceeds allowed freshness | prohibited unless an explicitly non-scoring consumer accepts stale evidence |
| `MISSING` | Required source/evidence field absent | prohibited; never zero |
| `UNKNOWN` | State cannot be established with available evidence | prohibited; never PASS |

## Fail-closed transition rules

- `FAIL -> PASS` requires new validated evidence, never a default.
- `STALE -> PASS` requires new fresh evidence, not a label rewrite.
- `MISSING -> numeric` is forbidden without new source evidence.
- `NOT_COMPUTABLE -> numeric score` is forbidden in DATA.
- `UNKNOWN -> PASS` requires deterministic resolution evidence.
- `PARTIAL` must identify exactly which fields are absent/non-admissible.

## Existing runtime state mapping

| Existing state | Default DATA interpretation |
|---|---|
| MarketData `LIVE`, `DELAYED`, admissible `HISTORICAL` | candidate `PASS`, subject to provenance/evidence contract |
| MarketData `STALE` | `STALE` |
| MarketData `DEGRADED` | `PARTIAL` or `FAIL` through explicit capability policy; never implicit PASS |
| MarketData `UNAVAILABLE` | `MISSING` or `NOT_COMPUTABLE` according to required-field semantics |
| MarketData `INVALID` | `FAIL` |
| Evidence `VERIFIED` | candidate `PASS` only if freshness/provenance checks remain valid |
| Evidence `CONFLICTING` | `FAIL` or `UNKNOWN` through explicit conflict-resolution policy; never PASS |
| Evidence `NOT_APPLICABLE` | `NOT_COMPUTABLE` for computations requiring that evidence, otherwise explicitly excluded |

The word `candidate` is intentional: no source label alone is sufficient if other required DATA gates fail.

## Security stale/current verification states — S1-R2-11

The Security handoff requires a separate verification-observation state machine. These labels do not replace the DATA DQ statuses above.

| Security observation | Required meaning |
|---|---|
| `CURRENT` | evidence is bound to the required immutable current identity and is fresh for the verification contract |
| `STALE` | evidence is expired, wrong-identity, or otherwise not admissible as current |
| `CURRENT_AFTER_REFRESH` | a previously stale/uncertain observation became current only after a trusted refresh/readback bound to the required immutable identity |
| `STALE_RETRY_REQUIRED` | no trustworthy current refresh/readback is available; retry is required and current state is not authorized |

Rules:

- a candidate cannot self-authorize `CURRENT`;
- wrong baseline/head/runtime identity is never current evidence;
- a clock/label rewrite does not convert stale evidence;
- refresh must produce independently observable identity/freshness evidence;
- failed/untrusted refresh remains non-current;
- Security `VERIFIED/CLOSED` is outside DATA authority.

## Canonical DATA exit envelope

```text
ValidatedDataInput
  contractVersion
  assetIdentity
    assetId
    symbol
    assetClass
    providerSymbols?
  correlationId
  observations[]
    field
    value | null
    unit/currency?
    providerId
    providerFeed/sourcePath?
    evidenceId/evidenceRef
    observedAt
    retrievedAt/ingestedAt
    freshness { ageMs, maxAgeMs, evaluatedAt }
    status
    reason?
  aggregateStatus
  missingRequiredFields[]
  nonComputableReasons[]
  provenanceComplete
```

No feature-engineered values, model weights, confidence multipliers, scores, ranks or UI labels belong in this envelope.

## Evidence identity requirements

A `PASS` observation requires stable binding between:

- UAI `assetId`;
- provider/source identity;
- capability and field;
- evidence ID/reference;
- observation/source timestamp;
- retrieval/ingestion timestamp;
- freshness evaluation;
- correlation lineage.

Provider symbols are identity mappings, not evidence.

## FinTech handoff

`[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-FINTECH | VC-12]`

- `project_namespace: PVC`
- `project_stage: PVC-12`
- `target_project: CAPITAL-AI-FINTECH`
- `target_project_folder: docs/projects/fintech/`
- `primary_owner: CAPITAL-AI-FINTECH`
- `task: consume ValidatedDataInput and perform feature engineering plus downstream scoring/ranking semantics`
- `reason: DATA must remain upstream of feature/scoring authority`
- `dependency: DATA PVC-11 validated output; docs/projects/fintech/ROADMAP.md`
- `required_evidence: versioned contract compatibility and preservation of non-computable/missing/stale states`
- `verification_gate: FINTECH target-project tests and normal project governance`
- `status: REFERRED_NOT_EXECUTED`

FINTECH owns transformation of validated DATA observations into engineered features and all scoring/ranking semantics. FINTECH must reject or preserve non-numeric states rather than coercing them to neutral values.

The compatibility `VC-12` marker is routing metadata; it is not a technical `SC-MD-SPT-0001` stage claim.
