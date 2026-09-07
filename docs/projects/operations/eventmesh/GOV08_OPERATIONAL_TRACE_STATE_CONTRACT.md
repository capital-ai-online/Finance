# GOV-08 Operational / Traceability State Contract

**Handoff:** `GOV08-OPS-TRACE-STATE-001`  
**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-18 — EventMesh / Traceability`  
**Consumer:** `CAPITAL-AI-CLIENT Admin Panel`  
**Status:** `OPS_GOV08_STATE_CONTRACT_READY` on this branch, pending normal branch/PR/Human-Merge lifecycle  
**Correlation baseline:** `main@a6a62e867749efe80fc05aa175a3dc3fdd183d82`

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
- Accepted architecture decisions: `ADR-0010` and canonical `ADR-0013` establish the Enterprise Standard/ESS responsibility and ESS-0011 allocation; they do not grant this projection decision authority.
- Applicable contracts: `ESS-0011` and `ESS-0011-CONTRACTS`.
- `/AGENTS.md` remains the trust root; Human/CODEOWNER merge and protected Production mutations remain external gates.

## Reuse result

No new transport or persistence subsystem is introduced.

| Required input | Existing source reused | Projection behavior |
|---|---|---|
| trace/correlation identity | EventMesh `EventMetadata` / delivery records | copy only when source-supplied; never synthesize |
| timestamps | EventMesh event metadata and source-owned status/evidence | keep `sourceTimestamp` distinct from projection `observedAt` |
| evidence references | Traceability/repository/runtime/validation source references | preserve opaque source-owned reference and kind |
| trace relationships | Traceability ETM and EventMesh correlation identity | read-only linkage only |
| operational status | existing owner-supplied status surfaces | normalize only; projection is not status authority |
| validation | existing owner-supplied validation evidence | preserve reported value but fail closed if evidence/freshness is insufficient |

The existing `OperationalSystemEventJournal` remains an ephemeral diagnostic read model and is not promoted into trace/audit authority by this contract.

## Contract

Each record contains:

- `identity.projectId`
- `identity.pvcId`
- `identity.statusId`
- `reportedState`: `CURRENT | BLOCKED | WAITING | UNKNOWN`
- effective `state`: same vocabulary, but forced to `UNKNOWN` when fail-closed conditions apply
- `reportedValidation`: `PASS | FAIL | PENDING | NOT_RUN | UNKNOWN`
- effective `validation`: forced to `UNKNOWN` when fail-closed conditions apply
- source-owned `evidence[]`
- optional source-owned `correlationId`, `traceId`, `spanId`
- `provenance.source`, optional source reference, optional authoritative source timestamp, projection observation time and freshness
- explicit `missingEvidence`, `staleOrUnknownFreshness`, `failsClosed`

The envelope fixes the semantics:

```text
authority.semantics = EVIDENCE_ONLY
decisionAuthority = false
mergeAuthority = false
releaseAuthority = false
deploymentAuthority = false
missingStateSemantics = UNKNOWN_NON_PASS
```

## Fail-closed semantics

The projector computes effective state as follows:

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

## Authority boundary

This projection is evidence-only. It cannot:

- approve a merge;
- authorize a release or Production deployment;
- convert EventMesh delivery into a protected decision;
- convert a Traceability relationship into approval;
- create a synthetic completion state;
- create or mutate trace/correlation identities;
- write to EventMesh, Traceability, audit, Security, Release or Production state.

Human/CODEOWNER merge, Governance decisions, Security verification, Release transition and Production mutation remain with their existing canonical authorities.

## CLIENT consumption rule

CLIENT may import/use the contract shape and render the effective fields. CLIENT must not duplicate the normalization semantics into a new domain authority. In particular:

1. use `state`, not `reportedState`, for graph status rendering;
2. use `validation`, not `reportedValidation`, for PASS/non-PASS rendering;
3. preserve `evidence` and `provenance` for drill-down/explanation;
4. show absence/staleness as unknown/non-PASS;
5. never map `CURRENT` or `PASS` to approval, mergeability, releasability or deployability.

## Validation evidence

Focused unit coverage is added for:

- fresh evidenced state preserved without authority expansion;
- stale evidence downgraded to `UNKNOWN`/non-PASS;
- missing evidence downgraded to `UNKNOWN`/non-PASS;
- no synthesized trace/correlation identity;
- no synthetic records for absent graph nodes;
- envelope authority flags fixed to false.

At this stage the focused test file is **implemented but NOT RUN** in the current GitHub connector execution surface. `NOT RUN` is not reported as PASS. Hosted checks, if applicable, occur only after an authorized PR is created according to `/AGENTS.md`.

## Exit-gate assessment

| Condition | Branch result |
|---|---|
| One canonical read-only state contract exists | SATISFIED |
| CLIENT can consume it without domain duplication | SATISFIED — shared contract/projector boundary; no CLIENT-owned authority required |
| Evidence vs authority semantics explicit | SATISFIED |
| Unknown/stale evidence fails closed | SATISFIED by implementation semantics; focused tests are present but `NOT RUN` |
| Protected provider/Production mutation required by this package | NO |

No Security verification, test PASS, PR creation or Human Merge is claimed by this document.
