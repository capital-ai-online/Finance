# ADR-0024 — Cross-Asset Risk Context Contract

**Status:** Accepted for evidence/context use  
**Scope:** Financial Intelligence / Cross-Asset Risk Context  
**Related:** ADR-0021, ADR-0022, ADR-0023

## Context

CAPITAL-AI verfügt über verifizierte Asset-Scoring-Lineage sowie FRED-/ECB-Macro-Evidence. Makrodaten dürfen jedoch nicht stillschweigend als zusätzlicher Asset-Score-Faktor verwendet werden, solange dafür kein separat kalibrierter und regression-getesteter Scoring Contract existiert.

## Decision

Ein eigenständiger, versionierter Cross-Asset Risk Context wird eingeführt.

### Asset classes

- stock
- forex
- index
- crypto
- bond

### Evidence inputs

Primäre Regime-Evidence:

- FRED DGS2
- FRED DGS10
- 10Y-2Y Treasury Spread

Supplemental Evidence:

- FRED FEDFUNDS
- FRED CPIAUCSL

Supplemental Evidence darf fehlende oder veraltete Yield-Curve-Evidence nicht zu `READY` hochstufen.

## Contract rules

Der Contract führt Provider, Evidence IDs, Observation Dates und Macro-Sensitivity mit.

Fest verdrahtete Sicherheitsgrenzen:

- `executionPriceEligible: false`
- `scoreImpactEnabled: false`
- `recommendationEligible: false`

Ein zukünftiger Score-Impact erfordert eine neue ADR, einen versionierten Feature-/Scoring-Contract, Golden-Dataset-Regressionen und dokumentierte Kalibrierung.

## Backend boundaries

- `GET /api/registry/macro/cross-asset/:assetClass`
- `GET /api/registry/assets/:symbol/verified-context`

Der zweite Endpunkt korreliert Asset-Score-Lineage und Macro-Evidence über eine gemeinsame Request-Korrelation, verrechnet beide Teilverträge aber nicht miteinander.

## Runtime Governance

Source-Conflict-, Quorum- und Snapshot-Integrity-Beobachtungen werden separat in die Supervisor-/Compliance-Runtime-Evidence geschrieben. Damit bleibt unterscheidbar:

1. Provider Availability;
2. Market Data Integrity;
3. Asset Scoring Lineage;
4. Macro Context Evidence.

## UI / Visuals

Keine grafischen Änderungen sind Bestandteil dieser ADR.
