# CAPITAL-AI — Data

**Project ID:** `CAPITAL-AI-DATA`  
**Display name:** CAPITAL-AI Data  
**Domain:** UAI / Data Ingestion / Evidence / Data Quality  
**Project Value Chain ownership:** `PVC-09`, `PVC-10`, `PVC-11`  
**Lifecycle:** `ACTIVE — CANONICAL PROJECT SURFACE`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

CAPITAL-AI-DATA is the operational project boundary for Universal Asset Identity data semantics, provider/source ingestion, evidence identity, provenance, freshness, input validation and fail-closed Data Quality before downstream FinTech processing.

```text
Source / Provider
→ PVC-09 UAI / Data Ingestion
→ PVC-10 Evidence / Provenance / Freshness
→ PVC-11 Data Quality
→ validated upstream input
→ CAPITAL-AI-FINTECH / PVC-12
```

DATA does not engineer financial features, score, rank or own presentation.

## Human-readable development model

```text
PVC-09..11
→ ROADMAP.md
→ applicable ADR
→ applicable ESS
→ DATA implementation / tests / evidence
```

Repository trust and protected lifecycle rules remain rooted in `/AGENTS.md`. Machine-readable registries, old handoff files and historical work claims support audit/traceability only and do not replace this project Roadmap.

## Owned boundary

DATA owns:

- Universal Asset Identity data boundary;
- canonical provider/source ingestion;
- evidence identity and evidence ingestion;
- provenance continuity and freshness;
- provider input/schema validation;
- Data Quality Gate and fail-closed status semantics;
- target-project implementation/evidence when the affected Primary Owner is DATA.

DATA does not own:

- independent Security verification;
- Quality Management assessment;
- Feature Engineering / Scoring / Ranking;
- frontend presentation;
- Release/Deployment authority;
- OPS-owned execution/control-plane tooling.

## Core invariants

1. Provider output is untrusted until validated.
2. Missing data never becomes synthetic data or zero.
3. Missing evidence never becomes neutral evidence.
4. `FAIL`, `STALE`, `MISSING`, `NOT_COMPUTABLE` and `UNKNOWN` cannot silently become valid numeric feature input.
5. Provenance survives the complete DATA chain and downstream boundary.
6. Productive Data Quality remains upstream of scoring and independent from the Quality Center.
7. No provider bypasses the canonical ingress/DQ boundary to become scoring authority.
8. Security requirements constrain DATA work but do not transfer ownership to Security.

## Security dependency

Historical Security finding `S1-R2-11 — Evidence identity and stale-state automation` maps to `CAPITAL-AI-DATA / PVC-10`. Current work should be planned directly in `ROADMAP.md`; the old handoff document is retained only as a historical compatibility index. CAPITAL-AI-SEC retains independent verification.

## Navigation

- [`ROADMAP.md`](./ROADMAP.md) — canonical DATA workstream state.
- [`TAKEOVER_INDEX.md`](./TAKEOVER_INDEX.md) — source correlation.
- [`DATA_BASELINE.md`](./DATA_BASELINE.md) — DATA baseline/migration findings.
- [`DATA_CONTRACTS.md`](./DATA_CONTRACTS.md) — data/downstream contracts.
- [`runbooks/`](./runbooks/) — repeatable fail-closed procedures.
- [`evidence/`](./evidence/) — evidence guidance.

`PVC-*` project ownership never silently rewrites technical `VC-*`, ADR, ESS or `SC-MD-SPT-0001` authority.
