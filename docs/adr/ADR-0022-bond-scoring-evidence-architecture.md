# ADR-0022 — Evidence-gated Bond Scoring Architecture

**Status:** Proposed / implementation gate  
**Scope:** CAPITAL-AI Bond Screening & Scoring  
**Depends on:** ADR-0020, ADR-0021, P0 Scoring Integrity

## Context

CAPITAL-AI besitzt inzwischen einen realen EODHD-Evidence-Pfad für explizite `*.GBOND`-Instrumente sowie Macro-/Rate-Evidence aus FRED und der ECB Data API. Diese Daten reichen jedoch noch nicht aus, um einen belastbaren Enterprise-Bond-Score automatisch freizuschalten.

Ein Bond-Score darf insbesondere nicht aus AssetRegistry-Bootstrapwerten, Symbol-Hashes oder geschätzten Yield-/Duration-Werten entstehen.

## Decision

Bond Scoring bleibt **deaktiviert**, bis ein Instrument den folgenden Evidence Contract erfüllt.

### Mandatory instrument evidence

1. eindeutige Provider-Instrument-ID / ISIN oder expliziter Provider-Ticker;
2. reale Preis- oder Yield-Historie mit Observation Timestamps;
3. Maturity Date;
4. Coupon / Coupon Type;
5. Currency;
6. mindestens eine belastbare Duration- oder Cashflow-Basis, aus der Duration reproduzierbar berechnet werden kann;
7. Provider-Provenance und stabile Evidence IDs für alle verwendeten Faktoren.

### Mandatory macro/rate context

Mindestens eine reale, zeitlich gültige Rate-/Curve-Quelle muss vorhanden sein. Zulässige Rollen sind beispielsweise:

- FRED Treasury-/Policy-Rate-Evidence;
- ECB offizielle Referenz-/Euro-Area-Rate-Evidence;
- weitere später governte Sovereign-Yield-/Reference-Rate-Provider.

Referenzdaten sind **keine Execution Prices**.

## Proposed scoring dimensions

Erst nach Erfüllung des Evidence Contracts darf die Scoring Engine folgende Dimensionen berechnen:

| Dimension | Beispiel-Evidence | Regel |
|---|---|---|
| Interest-rate sensitivity | Duration, maturity, yield curve | keine geschätzte Duration |
| Yield attractiveness | YTM / current yield + reference curve | nur belegte Yield-Werte |
| Credit quality | issuer/rating evidence | Rating-Quelle erforderlich |
| Liquidity | real volume/spread/trading evidence | fehlende Liquidität = Faktor ausgeschlossen |
| Price momentum | real historical prices | deterministisch aus History |
| Curve / regime context | FRED/ECB/official rates | reference-only context |
| Currency risk | bond currency + FX reference | keine ECB-Referenzrate als Execution Price |

Gewichte dürfen erst mit einem separaten versionierten Scoring Contract festgelegt werden.

## Fail-closed states

- `BOND_EVIDENCE_INCOMPLETE`
- `SOURCE_UNAVAILABLE`
- `SOURCE_CONFLICT`
- `STALE_EVIDENCE`
- `SCORE_NOT_COMPUTABLE`

Keiner dieser Zustände darf durch einen heuristischen Defaultscore ersetzt werden.

## Activation gate

Ein produktiver Bond-Score benötigt vor Aktivierung:

1. versionierten Bond Feature Contract;
2. versionierten Bond Scoring Contract;
3. Golden Dataset / Regression Tests;
4. Mindest-Coverage je Instrument;
5. Source-Conflict-Regeln für kritische Felder;
6. Data Freshness Gate;
7. vollständige Lineage `request -> retrieval -> factor -> evidence -> score`;
8. Supervisor Provider Health;
9. Compliance-/Runtime-Evidence;
10. dokumentierte Lizenz-/Redistributionsfreigabe je Datenquelle.

## Consequences

Der vorhandene EODHD-Bond-Pfad und FRED/ECB-Daten erhöhen die Evidence-Abdeckung, schalten aber **keinen Score automatisch frei**. Dies verhindert, dass unvollständige Fixed-Income-Daten als quantitativ belastbare Bewertung dargestellt werden.

## UI / Visuals

Diese ADR verlangt keine grafischen Änderungen. UI-Änderungen bedürfen einer separaten Freigabe.
