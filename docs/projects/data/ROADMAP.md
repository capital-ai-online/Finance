# CAPITAL-AI-DATA — Project Roadmap

**Project ID:** `CAPITAL-AI-DATA`  
**Status:** `ACTIVE — CANONICAL DATA ROADMAP`  
**Project Value Chain ownership:** `PVC-09`, `PVC-10`, `PVC-11`  
**Repository trust root:** `/AGENTS.md`

## How to use this roadmap

```text
PVC-09..11 / DATA Primary Owner
→ this Roadmap
→ applicable ADR
→ applicable ESS
→ implementation / tests / evidence
```

Current Git terminology is `main SHA`, `branch head SHA`, `PR head SHA` and `merge SHA`. Historical branch/evidence identities remain valid, but Candidate-Head lifecycle terminology is not used for current work.

## DATA-09 — UAI / Data Ingestion

**State:** `READY / ACTIVE BACKLOG`

Work:

- maintain one canonical ingress contract per capability;
- reuse `UniversalAssetAdapter`, `MarketDataGateway`, history gateway and provider registry/router boundaries;
- validate all external provider payloads before evidence promotion;
- remove duplicate direct-provider paths only after consumer correlation proves no semantic loss.

Exit:

- UAI identity is distinct from evidence;
- provider output cannot bypass validation;
- no provider becomes scoring authority.

## DATA-10 — Evidence Management

**State:** `READY / SECURITY EVIDENCE WORK OPEN`

Work:

- generalize evidence identity beyond provider/domain-specific registries;
- bind evidence to asset, provider, capability/field, observation/retrieval time and correlation identity;
- preserve explicit `CURRENT`, `STALE`, `MISSING`, `UNKNOWN` and refresh/retry semantics;
- support independent Security verification for stale/wrong-identity evidence findings.

Exit:

- one canonical evidence identity/envelope;
- stale/wrong-identity evidence cannot authorize current state;
- no Security self-verification by DATA.

## DATA-11 — Data Quality

**State:** `READY`

Work:

- keep snapshot/evidence DQ under one explicit gate model while retaining capability-specific checks;
- preserve `PASS`, `PARTIAL`, `FAIL`, `NOT_COMPUTABLE`, `STALE`, `MISSING`, `UNKNOWN` semantics;
- keep scoring/ranking outside DATA.

Exit:

- no `FAIL` reaches valid downstream input;
- stale/missing/unknown state cannot be silently upgraded;
- no scoring or ranking logic is owned by DATA.

## DATA-12 — Provenance

**State:** `READY`

Provider/source path, evidence reference, timestamps, asset identity and correlation lineage must survive the DATA chain and downstream handoff.

## DATA-13 — Freshness

**State:** `READY`

Freshness is evaluated from source/observation time against an explicit capability-specific maximum age. `STALE` never silently becomes fresh or scoring-admissible.

## DATA-14 — Provider Input Validation

**State:** `READY`

Validate schema, required fields, numeric finiteness/ranges, timestamps, provider identity, asset/symbol binding and capability invariants. Malformed/ambiguous input becomes an explicit non-admissible state.

## DATA-15 — Data Contract Testing

**State:** `READY`

Minimum test families:

- UAI normalization / unsupported assets;
- provider invalid/missing/exception cases;
- provenance/evidence-reference requirements;
- freshness clock determinism;
- DQ status transitions;
- no zero/synthetic fallback;
- no score/ranking mutation from DATA;
- downstream FINTECH rejects non-admissible inputs;
- stale/wrong identity remains fail-closed until trusted refresh.

Tests and evidence bind to the actual branch/PR-head identity, not to a separate Candidate lifecycle.

## DATA-16 — Evidence

**State:** `READY / CONTINUOUS`

Retain versioned contract compatibility, provider/DQ outcomes, provenance completeness and Security-return evidence. A file's existence is never proof of PASS.

## Downstream boundary — PVC-11 → PVC-12

DATA exports only validated upstream observations/evidence. `CAPITAL-AI-FINTECH / PVC-12` owns Feature Engineering and downstream scoring/ranking semantics.

## Security relationship

Historical Security routing files are compatibility/audit records only. Current Security-related DATA work is represented directly in this Roadmap and independently verified by `CAPITAL-AI-SEC`.

## Definition of Done

- `PVC-09..11` ownership is explicit;
- technical financial `VC-*` authority remains separate;
- provider output remains untrusted until validated;
- provenance is complete;
- DQ is fail-closed;
- no scoring/ranking logic is owned by DATA;
- applicable ADR/ESS are reused rather than duplicated;
- required tests/evidence pass on the final PR head;
- Human/CODEOWNER performs merge.
