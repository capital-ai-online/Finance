# ESS-0016 — Enterprise Market Data Provider & MCP Governance

## Enterprise Specification

**Version:** 1.0.0  
**Status:** Enterprise Specification  
**Implementation Status:** PHASE 2 IMPLEMENTED / RUNTIME PROMOTION NOT AUTHORIZED  
**Owner:** Platform Director  
**Security Authority:** CAPITAL-AI IAM / Security & Compliance  
**Related ADR:** ADR-0041  
**Related ESS:** ESS-0003, ESS-0006, ESS-0008, ESS-0011, ESS-0013, ESS-0014, ESS-0015  
**Primary Provider:** Alpaca Market Data  
**Secondary / Enrichment Provider:** Alpha Vantage  

---

## 1. Zweck

ESS-0016 definiert die verbindliche Enterprise-Architektur für externe Finanzmarktdaten in CAPITAL-AI. Ziel ist eine providerneutrale, auditierbare und ausfallsichere FinTech Data Pipeline, in der Markt-, Referenz- und Enrichment-Daten nicht direkt an einzelne Drittanbieter-Schemas gekoppelt werden.

Die Spezifikation trennt ausdrücklich zwei technische Pfade:

1. **deterministische Runtime Data Plane** für Screening, Scoring, Backtesting, Monte-Carlo und weitere produktive Berechnungen;
2. **governed MCP Agent Plane** für kontrollierte agentische Recherche, Erklärung, Evidence-Erhebung und Supervisor-gestützte Tool-Nutzung.

MCP ist damit eine Agent-/Tool-Integration und **kein Ersatz** für die deterministische Market-Data-Pipeline.

---

## 2. Architekturentscheidung auf ESS-Ebene

CAPITAL-AI verwendet folgende Provider-Rollen:

### 2.1 Alpaca — Primary Market Data Provider

Alpaca ist der bevorzugte Provider für unterstützte Echtzeit- und historische Marktdaten, insbesondere:

- US Equities;
- Quotes und Trades;
- OHLCV Bars;
- Snapshots;
- Crypto Market Data;
- Options- und Option-Chain-Daten;
- Corporate Actions, sofern für die jeweilige Pipeline benötigt;
- WebSocket-basierte Streaming-Daten, sofern der konkrete Produktionsplan und die Datenlizenz dies erlauben.

### 2.2 Alpha Vantage — Secondary / Enrichment Provider

Alpha Vantage wird als ergänzender Provider vorgesehen für:

- Fundamentals und Company Data;
- FX;
- Commodities;
- globale Equity-Daten, soweit vom verwendeten Tarif gedeckt;
- technische Indikatoren als unabhängige Referenz bzw. Enrichment;
- agentische Research- und Evidence-Abfragen über den offiziellen Alpha-Vantage-MCP-Server;
- Cross-Provider-Validierung.

Alpha Vantage darf aufgrund tarifabhängiger Request-Limits und Datenentitlements nicht als ungeprüfte alleinige Runtime-Abhängigkeit für die gesamte produktive Screening-Pipeline vorausgesetzt werden.

---

## 3. Verbindliche Systemgrenzen

### 3.1 Runtime Data Plane

```text
External Provider API / Stream
        |
        v
Provider Adapter
        |
        v
Market Data Provider Gateway
        |
        +--> Provider Health
        +--> Rate-Limit Budget
        +--> Cache / Request Coalescing
        +--> Timeout / Retry / Circuit Breaker
        |
        v
Normalization Layer
        |
        v
Canonical MarketData DTO
        |
        v
Data Quality / Provenance
        |
        v
FinTech Data Pipeline
        |
        +--> Screening
        +--> Scoring
        +--> Backtesting
        +--> Monte Carlo
        +--> Classification
        +--> AI Analysis
```

Produktive Business-Services dürfen nicht direkt gegen ein Alpaca-, Alpha-Vantage-, FMP- oder anderes Drittanbieter-Response-Schema programmiert werden.

### 3.2 MCP Agent Plane

```text
Approved LLM / Agent
        |
        v
Supervisor / Policy Gate
        |
        v
MCP Capability Gateway
        |
        +--> Alpaca MCP        [read-only market-data toolsets]
        +--> Alpha Vantage MCP [research / enrichment]
        |
        v
Evidence / Explainability / Research
```

MCP darf IAM, Policy Engine, Rate Limits, Audit Logging, Provider Budgets oder den No-Demo-Data-Vertrag nicht umgehen.

---

## 4. Provider-Abstraktionsvertrag

Jeder Runtime-Provider MUSS eine providerneutrale Schnittstelle implementieren. Der konkrete Codepfad kann später erweitert werden, muss funktional aber mindestens folgende Capability-Klassen abbilden können:

```ts
interface MarketDataProvider {
  id: string;
  capabilities(): ProviderCapability[];
  health(): Promise<ProviderHealth>;
  getSnapshot(request: SnapshotRequest): Promise<CanonicalSnapshot>;
  getBars(request: BarsRequest): Promise<CanonicalBars>;
}
```

Optionale Capability-Erweiterungen:

- quotes;
- trades;
- order book;
- options chain;
- fundamentals;
- FX;
- commodities;
- corporate actions;
- streaming subscription.

Business-Services referenzieren ausschließlich den Gateway-/Contract-Layer.

---

## 5. Canonical Market Data Contract

Jeder normalisierte Datensatz MUSS die Herkunft und zeitliche Qualität nachvollziehbar machen.

Mindestens:

```text
provider
providerFeed
symbol
assetClass
currency
sourceTimestamp
ingestedAt
receivedAt
isRealtime
isDelayed
freshnessMs
marketStatus
qualityState
correlationId
```

Für Preis-/Bar-Daten zusätzlich, soweit fachlich anwendbar:

```text
price
bid
ask
open
high
low
close
volume
vwap
tradeCount
```

Fehlende Felder dürfen nicht durch erfundene Werte ersetzt werden.

---

## 6. Data-Quality-Zustände

CAPITAL-AI unterscheidet mindestens:

```text
LIVE
DELAYED
HISTORICAL
STALE
DEGRADED
UNAVAILABLE
INVALID
```

### 6.1 Freshness

Freshness wird aus Provider-Timestamp und Ingestion-Zeit berechnet. Asset-Klasse, Handelszeit und erwartete Feed-Frequenz sind bei der Bewertung zu berücksichtigen.

### 6.2 Cross-Provider Validation

Wenn mehrere Provider dieselbe fachliche Information liefern, darf ein Confidence-/Consensus-Layer verwendet werden.

Beispiel:

```text
Alpaca Snapshot
      +
Secondary Reference
      |
      v
Divergence Check
      |
      +--> within tolerance -> high confidence
      +--> outside tolerance -> degraded / review
```

Cross-Provider-Divergenz darf nicht still durch Mittelwertbildung verschleiert werden.

---

## 7. No Demo Data Policy

Produktive Market-Data-Pfade dürfen bei Provider-Ausfall **keine simulierten, zufälligen oder synthetischen Kursdaten als reale Marktdaten ausgeben**.

Verboten:

```text
provider failure
   -> generated price fluctuation
   -> production score
```

Zulässig:

```text
provider failure
   -> bounded stale cache + explicit STALE marker
```

oder:

```text
provider failure
   -> approved secondary provider
   -> provenance retained
```

oder:

```text
provider failure
   -> UNAVAILABLE / DEGRADED
```

Testfixtures und synthetische Daten sind ausschließlich in klar isolierten Testkontexten zulässig und dürfen nicht als Produktions-Evidence persistiert werden.

---

## 8. Resilience Contract

Jeder externe Provider-Adapter MUSS mindestens unterstützen:

- bounded timeout;
- begrenzte Retries mit Backoff und Jitter;
- Circuit Breaker;
- Request Coalescing für identische parallele Requests;
- provider- und endpoint-spezifische Rate-Limit-Budgets;
- serverseitiges Caching;
- Health State;
- strukturierte Fehlerklassifikation;
- Correlation ID;
- Telemetrie ohne Secret-Werte.

Ein Fallback darf nur auf einen Provider erfolgen, dessen Capability, Entitlement und Datenqualität für den angeforderten Use Case zulässig sind.

---

## 9. Provider Routing

Provider Routing berücksichtigt mindestens:

1. Asset-Klasse;
2. benötigte Capability;
3. Echtzeit-/Delayed-/Historical-Anforderung;
4. Provider-Entitlement;
5. Datenlizenz;
6. Health State;
7. verbleibendes Request-Budget;
8. Freshness;
9. erwartete Latenz;
10. Datenqualität;
11. Kostenprofil;
12. Fallback-Priorität.

Der Provider Router darf keine kostenpflichtige oder lizenzpflichtige Capability implizit annehmen.

---

## 10. Alpaca MCP Governance

Der offizielle Alpaca MCP Server V2 unterstützt Toolset-Filtering. Für CAPITAL-AI wird initial ausschließlich ein **Read-only Market Data Profile** genehmigt.

Zulässige Toolset-Klassen, abhängig von tatsächlichem Bedarf:

```text
assets
stock-data
crypto-data
options-data
corporate-actions
news
```

Nicht freigegeben durch dieses ESS/ADR:

```text
trading
order placement
order replacement
order cancellation
account mutation
portfolio mutation
```

Wird ein MCP-Host direkt konfiguriert, MUSS die Toolauswahl explizit eingeschränkt werden. Eine Default-Konfiguration mit allen verfügbaren Alpaca-Tools ist für den Produktionskontext nicht zulässig.

---

## 11. Alpha Vantage MCP Governance

Der offizielle Alpha-Vantage-MCP-Server darf für kontrollierte Research-, Enrichment- und Evidence-Aufgaben eingebunden werden.

Geeignete Anwendungsfälle:

- Fundamentals;
- FX;
- Commodities;
- technische Indikatoren;
- historische Research-Abfragen;
- unabhängige Referenzwerte;
- agentische Erklärungen.

Der Alpha-Vantage-MCP darf keine versteckte Abhängigkeit in der deterministischen Runtime-Pipeline erzeugen. Runtime-Nutzung erfolgt über einen expliziten Provider Adapter mit Rate-Limit- und Entitlement-Kontrolle.

---

## 12. Secrets und Render

Provider-Secrets werden ausschließlich serverseitig verwaltet.

Beispielhafte Server-Secret-Namen:

```text
ALPACA_API_KEY
ALPACA_SECRET_KEY
ALPHA_VANTAGE_API_KEY
```

Regeln:

1. Kein Secret erhält ein `VITE_`-Präfix.
2. Kein Secret wird in Client Bundles, Logs, Metrics, Audit-Dokumente oder Fehlermeldungen geschrieben.
3. Repository-Dokumentation enthält nur Secret-Namen und den Contract, niemals Werte.
4. Secret Rotation darf keinen Code-Change erzwingen.
5. Fehlende Pflicht-Secrets führen für den betroffenen Provider zu `UNAVAILABLE`, nicht zu Demo-/Fake-Daten.
6. Ein in Render vorhandener Key wird nicht als Nachweis gewertet, dass alle für die konkrete Provider-Funktion erforderlichen Credentials und Entitlements vollständig sind.

Render-Mutationen und Secret-Werte selbst gehören zur Production Control Plane und werden nicht durch dieses Dokument verändert.

---

## 13. IAM und MCP Capability Policy

MCP-Zugriff wird als Capability behandelt, nicht als allgemeiner Netzwerkzugriff.

Beispielhafte Capabilities:

```text
marketdata.alpaca.read
marketdata.alphavantage.read
marketdata.provider.health.read
marketdata.provider.config.read
marketdata.provider.config.plan
```

Nicht Bestandteil dieses ESS:

```text
marketdata.trade.execute
marketdata.order.cancel
marketdata.portfolio.modify
```

Eine spätere Trading-Integration benötigt ein eigenes ADR mit separater IAM-, Step-up-, Suitability-, Compliance-, Audit- und Failure-Mode-Bewertung.

---

## 14. Observability Contract

Mindestens folgende technische Signale werden vorgesehen:

```text
market_data_requests_total
market_data_errors_total
market_data_cache_hit_total
market_data_rate_limit_total
market_data_fallback_total
market_data_stale_total
market_data_unavailable_total
market_data_provider_latency_ms
market_data_provider_divergence
```

Logs enthalten Provider-ID, Capability, Status, Correlation ID und Latenz, aber keine API-Keys oder vollständigen sensiblen Response-Payloads.

---

## 15. Data Licensing & Redistribution

Marktdaten dürfen nur im Rahmen des tatsächlich gebuchten Provider-Plans und der geltenden Lizenz-/Redistributionsrechte verwendet werden.

Vor einer Funktion, die Daten an Endnutzer weiterverteilt, exportiert, dauerhaft speichert oder in größerem Umfang weiterverarbeitet, MUSS geprüft werden:

- Echtzeit-/Delayed-Entitlement;
- Exchange-/Feed-Lizenz;
- Redistributable vs. display-only;
- historische Speicherung;
- geografische Beschränkungen;
- Nutzer-/Geräte-/Display-Regeln;
- Tarif- und Nutzungsgrenzen.

Das Vorhandensein eines API-Keys allein ist kein Lizenznachweis.

---

## 16. Integration in CAPITAL-AI

Zielstruktur:

```text
src/platform/MarketData/
  contracts/
    MarketDataProvider.ts
    MarketDataSnapshot.ts
    ProviderCapability.ts
  providers/
    AlpacaProvider.ts
    AlphaVantageProvider.ts
  ProviderRegistry.ts
  ProviderRouter.ts
  DataNormalizer.ts
  DataQualityService.ts
  MarketDataGateway.ts
```

Bestehende Scoring-/Screening-Services werden schrittweise von direkten Provider-Aufrufen auf `MarketDataGateway` migriert.

Der vorhandene Request-Orchestrator kann für Concurrency-/Queue-Schutz wiederverwendet werden; provider-spezifische Rate-Limit-Budgets bleiben zusätzlich erforderlich.

---

## 17. FinTech Use Cases

### 17.1 Equity Screening

```text
Alpaca Snapshot
 -> Canonical DTO
 -> Technical Signals
 -> Traditional Asset Scoring
 -> Screener
```

### 17.2 Historical Backtesting

```text
Alpaca Historical Bars
 -> Normalization
 -> Data Quality
 -> Backtest Engine
```

### 17.3 Options Intelligence

Options Chains, Quotes, Implied Volatility und Greeks können für zusätzliche Risiko-, Volatilitäts- und Derivate-Scores verwendet werden, soweit Feed und Tarif diese Daten bereitstellen.

### 17.4 Cross-Provider Confidence

Alpaca kann als Primary Signal mit Alpha Vantage oder einem anderen freigegebenen Secondary Provider auf Divergenz geprüft werden.

### 17.5 Agentic Explainability

Ein Supervisor-gesteuerter Agent darf aktuelle Read-only-Market-Data-Tools nutzen, um Score-Erklärungen oder Research-Evidence zu erzeugen. Der Agent darf den deterministischen Score nicht durch ungeprüfte MCP-Ausgaben überschreiben.

### 17.6 Data Quality Auditor

Ein Quality-/Compliance-Agent kann prüfen:

- Timestamp/Freshness;
- Provider/Feed;
- Missing Fields;
- Divergence;
- Delayed-vs-Realtime Status;
- Entitlement-/Capability-Mismatch;
- Fallback-Häufigkeit.

---

## 18. Event-Mesh-Integration

Nach Umsetzung sollten providerbezogene Events in den bestehenden Enterprise Event Mesh eingebunden werden, zum Beispiel:

```text
marketdata.provider.healthy
marketdata.provider.degraded
marketdata.provider.unavailable
marketdata.rate_limit.hit
marketdata.fallback.activated
marketdata.data.stale
marketdata.divergence.detected
```

Event-Namens- und Registry-Regeln werden nicht in ESS-0016 neu definiert, sondern aus ESS-0013 übernommen.

---

## 19. Implementation Phases

### Phase 1 — Contracts & Adapter

- `MarketDataProvider` Contract;
- Canonical DTO;
- Alpaca REST Adapter;
- Secret/Env validation;
- unit tests.

Phase-1-Nachweis (2026-08-14): kanonischer Snapshot-Vertrag, Quality Assessment,
Provider Registry, fail-closed Gateway-Grundgrenze und Alpaca REST Adapter sind implementiert.
Alpaca bleibt technisch `shadow` und wird ohne `includeShadow: true` nicht geroutet. Bestehende
Scoring-/Screening-Pfade sind noch nicht migriert.

### Phase 2 — Gateway

- Provider Registry;
- Routing;
- caching;
- rate-limit budget;
- circuit breaker;
- observability.

Phase-2-Nachweis (2026-08-14): explizites Registry-Routing, bounded Cache mit erneuter
Freshness-Prüfung, Request Coalescing, provider-/capability-spezifisches Rate-Limit-Budget,
Circuit Breaker und strukturierte payloadfreie Telemetrie sind implementiert. Die Komponenten
sind weiterhin nicht in Scoring-/Screening-Call-Sites verdrahtet; Alpaca bleibt `shadow`.

### Phase 3 — Pipeline Migration

- traditionelle Asset-Services auf Gateway migrieren;
- bestehende direkte Provider-Zugriffe inventarisieren;
- No-Demo-Data-Invariante verifizieren.

### Phase 4 — Streaming

- Alpaca WebSocket nur nach Entitlement-/Planprüfung;
- reconnect/backpressure;
- bounded fan-out;
- freshness monitoring.

### Phase 5 — MCP Read Plane

- Alpaca MCP mit explizitem Read-only Toolset;
- Supervisor/Policy Gate;
- Audit Trail;
- keine Trading Tools.

### Phase 6 — Alpha Vantage Enrichment

- Alpha Vantage Provider Adapter;
- offizieller Remote MCP für Agent Research;
- Quota Tracking;
- Cross-Provider Validation.

### Phase 7 — Production Evidence

- latency/failure metrics;
- failover tests;
- entitlement evidence;
- licensing review;
- traceability links;
- operational runbook.

---

## 20. Acceptance Criteria

ESS-0016 gilt technisch als umgesetzt, wenn mindestens:

- ein providerneutraler MarketData Contract existiert;
- Alpaca über einen Server-side Adapter angebunden ist;
- Scoring-/Screening-Code nicht direkt an Alpaca-Response-Schemas gekoppelt ist;
- Provider Health, Timeouts, Rate Limits und Cache instrumentiert sind;
- Provenance und Freshness in normalisierten Daten enthalten sind;
- bei Provider-Ausfall keine simulierten Produktionsdaten erzeugt werden;
- ein expliziter Fallback-/Degraded-State existiert;
- Alpaca MCP ausschließlich read-only/toolset-restricted betrieben wird;
- Alpha Vantage MCP als Enrichment/Research Plane getrennt bleibt;
- Trading-/Order-Funktionen nicht freigegeben sind;
- Secrets ausschließlich serverseitig vorliegen;
- Lizenz-/Entitlement-Annahmen dokumentiert und verifiziert sind;
- Tests die No-Demo-Data- und Fail-Closed-Invarianten abdecken;
- ESS/ADR/Implementation in der Traceability Matrix verknüpft sind.

---

## 21. Externe Referenzen

Stand der Provider-Eigenschaften wurde am **2026-08-03** geprüft.

- Alpaca MCP Server V2: https://alpaca.markets/blog/alpaca-launches-mcp-server-v2/
- Alpaca MCP toolset guidance: https://alpaca.markets/learn/mcp-trading-with-claude-alpaca-google-sheets
- Alpha Vantage official MCP: https://mcp.alphavantage.co/
- Alpha Vantage API documentation: https://www.alphavantage.co/documentation/
- Alpha Vantage support / quota information: https://www.alphavantage.co/support/

Provider-Funktionen, Preise, Entitlements und Limits sind externe Verträge und müssen vor produktionskritischen Änderungen erneut verifiziert werden.
