# ADR-0020: Multi-Provider Market Data Routing & Evidence-Preserving Failover

* **Status:** ACCEPTED
* **Datum:** 2026-08-02
* **Autor:** CAPITAL-AI Architecture

## Kontext

CAPITAL-AI besitzt bereits mehrere reale Datenquellen (u. a. CoinGecko, Binance, Kraken, Stooq, Alpha Vantage und FMP). Bisher waren diese Quellen jedoch überwiegend asset- oder service-spezifisch verdrahtet. Ein Ausfall, Rate-Limit oder regionales Netzwerkproblem eines bevorzugten Providers kann dadurch trotz vorhandener Alternativen zu `SOURCE_UNAVAILABLE` führen.

Finanzdaten dürfen gleichzeitig nicht wie austauschbare HTTP-Backends behandelt werden: unterschiedliche Provider haben abweichende Marktdefinitionen, Börsenabdeckung, Zeitstempel, Aggregationsmethoden, Lizenzrechte und Datenqualität. Ein klassisches Round-Robin würde deshalb Datenherkunft verschleiern und kann Scoring-Integrität beschädigen.

## Entscheidung

CAPITAL-AI führt eine zentrale, evidence-preserving Market-Data-Routing-Schicht ein.

Die Routing-Entscheidung berücksichtigt:

1. Governance-Basispriorität des Providers
2. Assetklasse und Capability
3. beobachtete Fehlerrate
4. aufeinanderfolgende Fehler
5. Cooldown-/Circuit-Zustand
6. beobachtete Latenz
7. explizite Provider-Provenance im Ergebnis

Die Strategie ist **adaptive failover / load-aware routing**, nicht blindes Round-Robin.

### Grundregel

Ein alternativer Provider darf einen Primärprovider nur für eine Capability ersetzen, für die er explizit im Provider Registry zugelassen ist. Provider-ID, Source Path, Observation-/Retrieval-Time und Evidence-ID bleiben bis zum finalen Score erhalten.

### Aktivierung neuer Provider

Neue externe Provider werden zunächst als `candidate` registriert und bleiben technisch deaktiviert, bis folgende Punkte erfüllt sind:

- Adapter implementiert und getestet
- API-Key/Secret ausschließlich über Production Environment
- Nutzungs-/Redistributionsrechte geprüft
- Rate-Limit-/Quota-Policy dokumentiert
- Provenance-Contract erfüllt
- Provider Health & Circuit Breaker integriert
- Golden-/Contract-Tests grün
- Production Handoff dokumentiert

## Architektur

```text
Scoring / Market Consumer
          |
          v
Market Data Router
  | governance priority
  | health / failures
  | latency / cooldown
  | capability filter
          |
     +----+----+-----+
     |         |     |
 Provider A Provider B Provider C
     |         |     |
     +----+----+-----+
          |
Normalization + Provenance
          |
Data Quality Gate
          |
Feature / Score / Evidence
```

## Initiale Provider-Gruppen

### Crypto

- CoinGecko — bevorzugte aggregierte History/Snapshot-Quelle
- Binance — Venue-Fallback für History/Quotes/Orderbook
- Kraken — Venue-Fallback für History/Quotes/Orderbook
- CoinAPI — Kandidat für normalisierte Multi-Exchange-Daten

### Stocks / Forex / Indices

- Stooq — bestehende History-Quelle
- Alpha Vantage — bestehende Fundamentals/Market-Data-Quelle
- FMP — bestehende Index-/Traditional-Asset-Quelle
- Twelve Data — Kandidat für globale Multi-Asset-Redundanz
- Finnhub — Kandidat für Fundamentals/Market/Alternative Data
- Massive — Kandidat für US Stocks/Options sowie Multi-Asset-Streaming

### Macro / Rates / Bonds

- FRED — Kandidat für makroökonomische Zeitreihen und Zins-/Bond-Kontext
- ECB — offizielle EUR-Referenz- und Euro-Area-Daten; Referenzdaten, keine Execution Prices

## Konsequenzen

### Positiv

- geringere Single-Provider-Abhängigkeit
- bessere Cold-Start-Resilienz
- providerübergreifende Observability
- kontrollierte Ausweichpfade bei Rate Limits
- vollständige Datenherkunft bleibt erhalten
- neue Provider können ohne Änderung der Scoring-Contracts ergänzt werden

### Negativ / Risiken

- mehrere Provider können unterschiedliche Werte für denselben Marktzeitpunkt liefern
- zusätzliche Lizenz- und Kostenkomplexität
- Symbol-/Instrument-Mapping wird komplexer
- Konsens-/Quorum-Logik benötigt eigene Toleranzregeln
- eine niedrige Latenz darf niemals Qualitäts-/Lizenzregeln überstimmen

## Nicht entschieden

Dieses ADR aktiviert keine neuen kostenpflichtigen Provider und ändert keine Secrets, Render-, Supabase- oder Billing-Konfiguration. Die Kandidaten sind Architektur-/Integrationsziele; ihre produktive Aktivierung erfordert jeweils einen eigenen Handoff und gegebenenfalls ein Folge-ADR.
