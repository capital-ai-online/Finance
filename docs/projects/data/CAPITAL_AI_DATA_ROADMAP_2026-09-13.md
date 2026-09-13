# CAPITAL-AI-DATA — Roadmap 2026-09-13

**Project:** `CAPITAL-AI-DATA`  
**Folder:** `docs/projects/data/`  
**Owner/PVC:** `CAPITAL-AI-DATA / PVC-09, PVC-10, PVC-11`  
**Status:** `ACTIVE — CANONICAL DATED ROADMAP`  
**Baseline:** `main@9634053b222725db69d557f61d44d77b9eb8cb04` (PR #900 merged)  
**Superseded baseline:** `archive/CAPITAL_AI_DATA_ROADMAP_SUPERSEDED_2026-09-13.md`

## Consolidation rule
All non-terminal DATA work from the superseded baseline remains active with existing identifiers and constraints unless replaced below. No synthetic provider data or synthetic DQ PASS is introduced.

## Active work packages

### DATA-CARRY-01 — Existing non-terminal DATA backlog
Carry forward every non-terminal DATA ingestion, provenance, freshness, quality, lineage, authorization and evidence package.

### DATA-PR900-01 — Fail-closed DQ handoff
Preserve `PVC-11 → PVC-12` as a fail-closed Data Quality handoff. Provider provenance, freshness and DQ state must remain visible to FINTECH consumers.

**Exit:** unverifiable/stale/wrong-identity data cannot silently enter feature/scoring stages.

### DATA-PR900-02 — Evidence freshness semantics
Close S1-R2-11 with reproducible current/stale/wrong-identity semantics under PVC-10.

**Exit:** evidence freshness can be tested and produces deterministic non-synthetic outcomes.

### DATA-PR900-03 — Authorization/data-owner coverage
For DATA-owned routes/objects/fields, provide cross-role/cross-user negative evidence required by SEC V8 coverage; foreign route owners retain their own slices.

### DATA-PR900-04 — Product-chain lineage return
Provide exact lineage/provenance inputs required for canonical FINTECH feature/scoring/ranking; do not fill missing scores/data with frontend or synthetic fallback.

## Dependencies
OPS provider/runtime evidence, SEC independent verification, FINTECH PVC-12..17 consumers, QM exact-snapshot evidence.

## Project exit gate
One active DATA roadmap; real provider data reaching product features is provenance/freshness/DQ traceable and all non-terminal baseline work remains represented.