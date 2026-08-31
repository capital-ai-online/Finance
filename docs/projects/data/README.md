# CAPITAL-AI — Data

**Project ID:** `CAPITAL-AI-DATA`  
**Display name:** CAPITAL-AI Data  
**Domain:** UAI / Data Ingestion / Evidence / Data Quality  
**Project Value Chain ownership:** `PVC-09`, `PVC-10`, `PVC-11`  
**Lifecycle:** `PROPOSED — PVC OWNERSHIP CORRELATED / CURRENT-MAIN CONSOLIDATION CANDIDATE`  
**Canonical execution roadmap:** [`ROADMAP.md`](./ROADMAP.md)

## Purpose

CAPITAL-AI-DATA is the intended single operational boundary for Universal Asset Identity data semantics, provider/source ingestion, evidence identity, provenance, freshness, input validation and fail-closed Data Quality before downstream FinTech processing.

```text
Source / Provider
  -> UAI / Data Ingestion          (PVC-09)
  -> Evidence Identity             (PVC-10)
  -> Provenance / Freshness        (PVC-10)
  -> Data Quality Gate             (PVC-11)
  -> Validated Feature Input
  -> CAPITAL-AI-FINTECH            (PVC-12)
```

`Validated Feature Input` means validated upstream observations/evidence suitable for downstream feature engineering. DATA does not engineer features, score, rank or present them.

## Project-routing and technical namespaces

Repository trust and lifecycle rules remain rooted in `/AGENTS.md`.

`docs/projects/PROJECT_VALUE_CHAIN.md` now defines the organizational project-routing namespace:

- `PVC-09` — UAI / Data Ingestion — `CAPITAL-AI-DATA`;
- `PVC-10` — Evidence Management — `CAPITAL-AI-DATA`;
- `PVC-11` — Data Quality — `CAPITAL-AI-DATA`;
- `PVC-12` — Feature Engineering — `CAPITAL-AI-FINTECH`.

These `PVC-*` identifiers do **not** replace the existing technical financial `VC-*` identifiers governed by `SC-MD-SPT-0001`. Project routing and technical runtime stages remain explicitly separate.

## Owned boundary

DATA owns:

- Universal Asset Identity data boundary;
- canonical provider/source ingestion;
- evidence identity and evidence ingestion;
- provenance continuity;
- freshness evaluation;
- provider input/schema validation;
- Data Quality Gate and fail-closed status semantics;
- explicit `NOT_COMPUTABLE`/missing-input semantics at the DATA exit;
- target-project implementation/evidence required by Security findings when the affected Primary Owner is DATA.

DATA does not own:

- Security requirement/finding authority or independent Security verification;
- Quality Management assessment;
- feature engineering;
- confidence/scoring/ranking logic;
- frontend presentation;
- release/deployment authority;
- OPS-owned PR/trace/DevelopmentChain tooling.

## Core invariants

1. Provider output is untrusted until validated.
2. Missing data never becomes synthetic data or zero.
3. Missing evidence never becomes neutral evidence.
4. `FAIL`, `STALE`, `MISSING`, `NOT_COMPUTABLE` and `UNKNOWN` cannot silently become valid numeric feature input.
5. Provenance must survive the complete DATA chain and downstream handoff.
6. Productive Data Quality remains upstream of scoring and independent from the Quality Center.
7. No provider may bypass the canonical ingress/DQ boundary to become scoring authority.
8. Security requirements are inputs to DATA implementation/evidence, not a transfer of DATA ownership to Security.
9. DATA may report `IMPLEMENTED` or `EVIDENCE_READY`; only CAPITAL-AI-SEC may independently set a Security finding `VERIFIED`/`CLOSED`.

## Current Security dependency

Merged Security PR #631 routes `S1-R2-11 — Evidence identity and stale-state automation` to `CAPITAL-AI-DATA / PVC-10`.

See [`handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md`](./handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md). The current target-project status is `REFERRED_NOT_EXECUTED`; Security retains independent verification and its source traceability remains `WAITING_FOR_EVIDENCE`.

## Navigation

- [`ROADMAP.md`](./ROADMAP.md) — canonical DATA workstream state.
- [`TAKEOVER_INDEX.md`](./TAKEOVER_INDEX.md) — correlation of existing ingestion/evidence/DQ sources into DATA.
- [`DATA_BASELINE.md`](./DATA_BASELINE.md) — exact repository/runtime baseline and migration findings.
- [`DATA_CONTRACTS.md`](./DATA_CONTRACTS.md) — target status and downstream handoff semantics.
- [`HANDOFFS.md`](./HANDOFFS.md) — project-routing dependencies and cross-project records.
- [`handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md`](./handoffs/CAPITAL_AI_SEC_CROSS_PROJECT_HANDOFF.md) — resolved Security handoff contract and S1-R2-11 intake.
- [`runbooks/`](./runbooks/) — repeatable fail-closed operating procedures.
- [`evidence/`](./evidence/) — append-only evidence guidance.

## Takeover rule

Source roadmaps retain domain/history context and normative authority where applicable. Operational DATA-only state is maintained in this project after the corresponding source item is explicitly correlated. `PVC-*` project ownership never silently rewrites technical `VC-*`, ADR, ESS or SPT authority.
