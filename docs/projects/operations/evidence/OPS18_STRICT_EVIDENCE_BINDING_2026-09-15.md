# OPS-18 Strict Evidence Binding — REQ-COMP-033 Owner Return

**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-18 — EventMesh / Traceability`  
**Work package:** `OPS-18-A` / `REQ-COMP-033` owner return  
**Branch:** `agent/operations-ops18-evidence-binding-20260915`  
**Implementation baseline:** `main@0b7ffb3bf06c1165a3b73f9d4d6e0933dee971f2`  
**Status:** `IMPLEMENTED_BRANCH / SANDBOX_EVIDENCE_READY`  
**Trust root:** `/AGENTS.md@current-main`

## Objective

Close the concrete OPS-owned traceability gap identified during REQ-COMP-033 reassessment without changing DATA evidence semantics, creating a second EventMesh/Traceability architecture or manufacturing correlation identities.

The prior generic `OperationalTraceState` projection failed closed for missing evidence and stale/unknown freshness, but correlation and evidence identity were optional. A record could therefore remain effective `CURRENT/PASS` without proving the exact identity/correlation binding required by the REQ-COMP-033 exit gate.

## Authority and ownership

- `PVC-18` remains owned by `CAPITAL-AI-OPS`.
- `ADR-0015` keeps Traceability in `src/platform/Traceability/**` and prohibits invented relations.
- `ESS-0011` requires traceability links to have a provable origin and forbids assumed relationships.
- `ESS-0011-CONTRACTS` requires ETM correlation IDs to be propagated unchanged from triggering events.
- DATA/PVC-10 remains owner of S1-R2-11 evidence identity/freshness semantics.
- Security remains the independent verification authority for S1-R2-11; this OPS package does not self-close Security findings.
- Compliance remains responsible for the final REQ-COMP-033 reassessment after owner returns are merged/available.

## Implementation

The existing operational trace-state contract is extended additively to schema `1.1`.

### Generic records

Generic records keep their existing behavior. They are not globally required to carry correlation or evidence identity when the authoritative source does not provide it.

### Strict records

A source may opt one record into `STRICT_IDENTITY_CORRELATION` and declare an exact source-owned triplet:

- `evidenceIdentityRef`;
- `evidenceRef`;
- `correlationId`.

The source-owned evidence reference carries optional opaque `identityRef` and `correlationId` fields. The projector compares values; it never derives or synthesizes them.

Strict records fail closed to effective `UNKNOWN / UNKNOWN` when any of the following is true:

- evidence is missing;
- freshness is not `FRESH`;
- declared or trace/evidence correlation is missing;
- evidence identity is missing;
- authoritative `sourceTimestamp` is missing or invalid;
- trace correlation differs from the declared correlation;
- no evidence entry matches the exact declared `evidenceRef + identityRef + correlationId` triplet.

## Changed surfaces

- `src/platform/Traceability/Contracts/OperationalTraceStateContract.ts`
- `src/platform/Traceability/Services/OperationalTraceStateProjection.ts`
- `tests/unit/operationalTraceStateProjection.test.ts`
- `docs/projects/operations/eventmesh/GOV08_OPERATIONAL_TRACE_STATE_CONTRACT.md`
- this evidence record

No EventMesh storage, trace registry, audit store, provider configuration, IAM, secret, billing, DNS/TLS, deployment or Production surface is changed.

## Validation

Pre-PR sandbox validation executed against the exact implementation payload:

| Check | Result |
|---|---|
| TypeScript strict compile — contract + projector | `PASS` |
| TypeScript strict compile — focused test shape with Vitest declaration stub | `PASS` |
| Strict fully bound record | `PASS` |
| Missing correlation | `PASS` — effective `UNKNOWN/non-PASS` |
| Wrong correlation | `PASS` — effective `UNKNOWN/non-PASS` |
| Missing evidence identity | `PASS` — effective `UNKNOWN/non-PASS` |
| Wrong evidence identity | `PASS` — effective `UNKNOWN/non-PASS` |
| Stale evidence | `PASS` — effective `UNKNOWN/non-PASS` |
| Missing evidence | `PASS` — effective `UNKNOWN/non-PASS` |
| Missing authoritative source timestamp | `PASS` — effective `UNKNOWN/non-PASS` |
| Generic/no-trace backward compatibility | `PASS` |

Executable isolated harness summary: **`9/9 PASS`**.

Not-run evidence remains explicit:

- repository Vitest runner: `NOT RUN`;
- repository TypeScript/lint command: `NOT RUN`;
- Production build: `NOT RUN`;
- hosted GitHub checks: `NOT RUN`;
- Production/provider verification: `N/A` for this repository-only package.

## Exit-gate disposition

OPS/PVC-18 now has a bounded repository mechanism capable of proving the required identity/correlation/freshness/evidence binding without weakening the generic projection or inventing source relationships.

Branch-level disposition: `IMPLEMENTED_BRANCH / SANDBOX_EVIDENCE_READY`.

This evidence does **not** label REQ-COMP-033 `PASS`. Final Compliance disposition remains downstream of normal branch/PR/Human-Merge lifecycle plus Compliance reassessment against the then-current exact snapshot.
