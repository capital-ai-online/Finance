# ADR-0023 — FRED & ECB Macro/Rate Evidence Sources

**Status:** Accepted for evidence use  
**Scope:** Financial Intelligence / Macro & Rate Evidence  
**Related:** ADR-0020, ADR-0021, ADR-0022

## Context

CAPITAL-AI benötigt für Fixed Income, Macro-Regime, FX-Plausibilisierung und spätere Cross-Asset-Risikomodelle belastbare Referenzdaten. Solche Quellen dürfen nicht mit Realtime-/Execution-Market-Data gleichgesetzt werden.

## Decision

### FRED

FRED wird als serverseitiger, API-key-geschützter Macro-/Rate-Evidence-Provider integriert.

Initiale Series-Allow-List:

- `DGS2` — U.S. Treasury 2Y Constant Maturity
- `DGS10` — U.S. Treasury 10Y Constant Maturity
- `FEDFUNDS` — Federal Funds Effective Rate
- `CPIAUCSL` — Consumer Price Index

Beliebige vom Client übergebene FRED-Series-IDs sind nicht zugelassen. Erweiterungen erfolgen über reviewed Code-/Governance-Änderungen.

### ECB

Die ECB Data API wird als keyless `reference-only` Provider eingebunden. Initial wird die offizielle `EXR`-Dataflow für explizit zugelassene EUR-Referenzwährungen verwendet.

ECB-Referenzkurse werden niemals als handelbare oder ausführbare Preise markiert.

## Common Evidence Contract

Jede Zeitreihe enthält:

- Provider;
- Series ID;
- Purpose;
- Unit;
- Observation Date;
- Retrieval Timestamp;
- secret-freien Source Path;
- stabile Evidence IDs;
- `executionPriceEligible: false`.

## Runtime behavior

- Providerfehler sind fail-closed;
- fehlender `FRED_API_KEY` erzeugt `SOURCE_UNAVAILABLE`, keine Defaultdaten;
- Provider Health und adaptive Routing Telemetry werden erfasst;
- bestehendes `RUNTIME-01` Compliance Evidence verarbeitet beobachtete Providerzustände automatisch;
- der abgeleitete DGS2/DGS10-Macro-Regime-Contract besitzt zusätzlich ein Freshness-Gate und unterscheidet Provider-Erreichbarkeit von fachlicher Evidence-Aktualität.

## Production handoff status — 2026-08-02

Der Betreiber hat `FRED_API_KEY` in der Render-Produktionsumgebung als serverseitige Environment Variable angelegt. Dieser ADR und der zugehörige PR enthalten **keinen Secret-Wert** und verändern Render nicht selbst. Nach Merge und erfolgreichem Deployment kann der implementierte FRED-Live-Pfad den Runtime-Key konsumieren.

## API boundaries

- `GET /api/registry/macro/fred/:seriesId`
- `GET /api/registry/macro/ecb/fx/:currency`
- `GET /api/registry/macro/risk-regime`

Die Endpunkte unterstützen Request-/Response-Correlation und geben Evidence IDs aus. Der Risk-Regime-Endpunkt bleibt Evidence-/Context-only und kann bei veralteten Treasury-Daten `STALE_EVIDENCE` statt eines aktuellen Regimes ausgeben.

## Security

`FRED_API_KEY` ist ausschließlich serverseitig und darf keinen `VITE_`-Prefix besitzen. Die ECB API benötigt keinen Secret-Key.

## Consequences

Macro-/Rate-Evidence steht für nachgelagerte Analysen zur Verfügung, aktiviert jedoch weder Bond-Scoring noch Execution-/Trading-Funktionen automatisch. Eine Verwendung als Scoringfaktor benötigt einen separat versionierten Feature-/Scoring-Contract.

## UI / Visuals

Keine grafischen Komponenten sind Bestandteil dieser Architekturentscheidung.
