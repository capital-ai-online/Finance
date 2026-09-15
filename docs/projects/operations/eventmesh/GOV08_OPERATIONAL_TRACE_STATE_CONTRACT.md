# GOV-08 Operational / Traceability State Contract

**Handoff:** `GOV08-OPS-TRACE-STATE-001`  
**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-18 — EventMesh / Traceability`  
**Consumer:** `CAPITAL-AI-CLIENT Admin Panel`  
**Status:** `OPS_GOV08_STATE_CONTRACT_READY / STRICT_BINDING_EXTENSION_IMPLEMENTED_BRANCH`  
**Correlation baseline:** `main@0b7ffb3bf06c1165a3b73f9d4d6e0933dee971f2`

## Purpose

Provide one smallest read-only state projection for the Admin Panel process graph without creating a second EventMesh, trace store, approval engine or browser authority.

Canonical code surfaces:

- `src/platform/Traceability/Contracts/OperationalTraceStateContract.ts`
- `src/platform/Traceability/Services/OperationalTraceStateProjection.ts`
- focused evidence: `tests/unit/operationalTraceStateProjection.test.ts`

The projection is a normalization boundary only. Existing EventMesh, Traceability and source-owned status/evidence surfaces remain the data owners.

## Authority / contract correlation

- Target Project / Primary Owner: `CAPITAL-AI-OPS`.
- Target PVC: `PVC-18 — EventMesh / Traceability`.
- Accepted architecture decision: `ADR-0015` defines the existing Traceability platform component and forbids invented relations.
- Applicable specifications/contracts: `ESS-0011` and `ESS-0011-CONTRACTS`.
- `ESS-0011-CONTRACTS` requires source-owned correlation propagation for ETM events and prohibits origin-less/assumed links.
- `/AGENTS.md` remains the trust root; Human/CODEOWNER merge and protected Production mutations remain external gates.

## Reuse result

No new transport or persistence subsystem is introduced.

| Required input | Existing source reused | Projection behavior |
|---|---|---|
| trace/correlation identity | EventMesh `EventMetadata` / delivery records | copy only when source-supplied; never synthesize |
| timestamps | EventMesh event metadata and source-owned status/evidence | keep `sourceTimestamp` distinct from projection `observedAt` |
| evidence references | Traceability/repository/runtime/validation source references | preserve opaque source-owned reference and kind |
| source-owned evidence identity | upstream owner evidence | copy as opaque `identityRef`; never infer DATA/FINTECH semantics |
| trace relationships | Traceability ETM and EventMesh correlation identity | read-only linkage only |
| operational status | existing owner-supplied status surfaces | normalize only; projection is not status authority |
| validation | existing owner-supplied validation evidence | preserve reported value but fail closed if required evidence/freshness/binding is insufficient |

The existing `OperationalSystemEventJournal` remains an ephemeral diagnostic read model and is not promoted into trace/audit authority by this contract.

## Contract

Schema version `1.1` is an additive extension of the existing read-only state contract.

Each record contains:

- `identity.projectId`
- `identity.pvcId`
- `identity.statusId`
- `reportedState`: `CURRENT | BLOCKED | WAITING | UNKNOWN`
- effective `state`: same vocabulary, but forced to `UNKNOWN` when fail-closed conditions apply
- `reportedValidation`: `PASS | FAIL | PENDING | NOT_RUN | UNKNOWN`
- effective `validation`: forced to `UNKNOWN` when fail-closed conditions apply
- source-owned `evidence[]`
- optional source-owned `evidence[].identityRef` and `evidence[].correlationId`
- optional source-owned `correlationId`, `traceId`, `spanId`
- `provenance.source`, optional source reference, authoritative source timestamp when available, projection observation time and freshness
- optional `strictEvidenceBinding`
- explicit diagnostics for missing/stale/binding-invalid inputs and `failsClosed`

The envelope fixes the semantics:

```text
authority.semantics = EVIDENCE_ONLY
decisionAuthority = false
mergeAuthority = false
releaseAuthority = false
deploymentAuthority = false
missingStateSemantics = UNKNOWN_NON_PASS
```

## Default fail-closed semantics

Generic operational records retain their existing behavior:

```text
missing evidence OR freshness != FRESH
  => state = UNKNOWN
  => validation = UNKNOWN
  => failsClosed = true

otherwise
  => state = reportedState
  => validation = reportedValidation
```

A missing graph record is not materialized synthetically. CLIENT must interpret absence according to the envelope rule `UNKNOWN_NON_PASS` rather than infer completion or approval.

`STALE` and freshness `UNKNOWN` therefore cannot surface as effective PASS. A source can still report its prior observation, but the UI receives a distinct effective value that is fail-closed.

## Bounded strict evidence binding

Records that require an exact integrity chain may opt into:

```text
strictEvidenceBinding.mode = STRICT_IDENTITY_CORRELATION
```

The strict requirement is source-owned and contains exactly:

- `evidenceIdentityRef` — opaque immutable identity supplied by the authoritative source;
- `evidenceRef` — exact evidence reference expected for that identity;
- `correlationId` — exact source correlation identity expected across trace and evidence.

A strict record is effective `CURRENT/PASS` only when all default requirements pass **and**:

1. the declared strict identity, evidence reference and correlation are non-empty;
2. `trace.correlationId` is present and exactly equals the declared correlation;
3. at least one evidence reference carries the exact declared `ref + identityRef + correlationId` triplet;
4. `provenance.sourceTimestamp` is present and a valid timestamp;
5. `provenance.freshness` is `FRESH`.

Missing or mismatching strict data forces `state=UNKNOWN`, `validation=UNKNOWN` and `failsClosed=true`.

This is deliberately **not** a global correlation requirement. Generic records remain backward-compatible and may omit trace/correlation identity when their source does not authoritatively provide one. The projector never creates identity, evidence or correlation values.

## Authority boundary

This projection is evidence-only. It cannot:

- approve a merge;
- authorize a release or Production deployment;
- convert EventMesh delivery into a protected decision;
- convert a Traceability relationship into approval;
- create a synthetic completion state;
- create or mutate evidence/trace/correlation identities;
- infer DATA/FINTECH business semantics from opaque identity references;
- write to EventMesh, Traceability, audit, Security, Release or Production state.

Human/CODEOWNER merge, Governance decisions, Security verification, Release transition and Production mutation remain with their existing canonical authorities.

## CLIENT consumption rule

CLIENT may import/use the contract shape and render the effective fields. CLIENT must not duplicate the normalization semantics into a new domain authority. In particular:

1. use `state`, not `reportedState`, for graph status rendering;
2. use `validation`, not `reportedValidation`, for PASS/non-PASS rendering;
3. preserve `evidence`, `provenance` and strict-binding diagnostics for drill-down/explanation;
4. show absence/staleness/strict-binding failure as unknown/non-PASS;
5. never map `CURRENT` or `PASS` to approval, mergeability, releasability or deployability.

## Validation evidence

Focused coverage now includes:

- generic fresh evidenced state preserved without authority expansion;
- fully bound strict identity/correlation/freshness evidence preserved;
- missing strict correlation fails closed;
- wrong strict correlation fails closed;
- missing strict evidence identity fails closed;
- wrong strict evidence identity fails closed;
- missing authoritative source timestamp fails closed;
- stale evidence fails closed;
- missing evidence fails closed;
- generic records without trace identity remain backward-compatible and do not receive synthetic identities;
- no synthetic records for absent graph nodes;
- envelope authority flags remain fixed to false.

Pre-PR sandbox evidence on the exact implementation payload:

- strict TypeScript compile of contract + projector + focused test shape: `PASS`;
- isolated executable decision harness: `9/9 PASS` for strict positive/negative and backward-compatibility cases;
- repository Vitest suite: `NOT RUN` in the current connector execution surface;
- hosted GitHub checks: `NOT RUN` before PR creation.

`NOT RUN` is not reported as PASS.

## Exit-gate assessment

| Condition | Branch result |
|---|---|
| One canonical read-only state contract exists | SATISFIED |
| No second EventMesh/trace store/authority created | SATISFIED |
| Generic records remain backward-compatible | SATISFIED by bounded opt-in semantics |
| Strict record requires exact identity + evidenceRef + correlation + source timestamp + fresh provenance | SATISFIED by implementation + sandbox harness |
| Missing/wrong/stale strict inputs fail closed to `UNKNOWN/non-PASS` | SATISFIED by implementation + sandbox harness |
| Protected provider/Production mutation required by this package | NO |
| Repository-wide/hosted validation | OPEN / NOT RUN |

No Security closure, Compliance PASS, PR creation or Human Merge is claimed by this document.
