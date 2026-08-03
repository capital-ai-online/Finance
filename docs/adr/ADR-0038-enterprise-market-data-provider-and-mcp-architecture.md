# Architectural Decision Record (ADR-0038)
## Enterprise Market Data Provider & MCP Architecture

**Status:** ACCEPTED  
**Implementation-Status:** SPECIFIED / NOT YET IMPLEMENTED  
**Date:** 2026-08-03  
**Version:** 0.6.0  
**Priority:** P1  
**Related ESS:** ESS-0015  
**Related ADR:** ADR-0009, ADR-0012, ADR-0013, ADR-0018, ADR-0035, ADR-0037  

---

## 1. Kontext

CAPITAL-AI verarbeitet externe Finanzmarktdaten für Screening, Scoring, Backtesting, Monte-Carlo-Simulationen, Klassifikation, Explainability und AI-gestützte Analysen.

Die bestehende Backend-Architektur besitzt bereits serverseitige Market-Data-Zugriffe, Caching, einen Request-Orchestrator, Asset-spezifische Scoring-Services und mehrere externe Provider. Gleichzeitig wird die Plattform um agentische MCP-Integrationen erweitert.

Mit dem in Render hinterlegten Alpaca-Credential entsteht die Möglichkeit, Alpaca als produktiven Market-Data-Provider einzubinden. Zusätzlich steht ein offizieller Alpaca MCP Server V2 zur Verfügung. Alpha Vantage stellt ebenfalls einen offiziellen Remote-MCP-Server und ein breites Finanzdatenangebot bereit.

Ohne eine explizite Architekturentscheidung entstehen jedoch folgende Risiken:

- direkte Kopplung von Scoring-Code an Provider-Schemas;
- Vendor Lock-in;
- inkonsistente Datenqualität und Zeitstempel;
- unkontrollierte MCP-Tool-Berechtigungen;
- versehentliche Freigabe von Trading-/Order-Funktionen;
- Provider-Ausfälle mit stillen Demo-/Synthetic-Fallbacks;
- uneinheitliche Rate-Limit- und Cache-Strategien;
- fehlende Provenance und Auditierbarkeit;
- ungeprüfte Datenlizenz-/Redistributionsannahmen;
- Alpha-Vantage-Quota als versteckter Single Point of Failure.

---

## 2. Problem Statement

Die Plattform benötigt zwei unterschiedliche Integrationsarten:

```text
A. deterministische Runtime Data Plane
B. agentische MCP Tool Plane
```

Diese beiden Pfade haben unterschiedliche Sicherheits-, Latenz-, Determinismus- und Audit-Anforderungen.

Würde ein LLM/MCP direkt zum Kern der Scoring-Pipeline gemacht, könnten Toolauswahl, Agentenverhalten, Response-Transformationen oder Provider-Tooländerungen den deterministischen Berechnungspfad beeinflussen.

Würde dagegen jeder Business-Service direkt einen bestimmten Provider ansprechen, entstünden Duplikate für:

- Authentication;
- Retry;
- Rate Limits;
- Caching;
- Normalisierung;
- Fallback;
- Data Quality;
- Observability.

---

## 3. Entscheidung

CAPITAL-AI führt einen **providerneutralen Market Data Provider Gateway** als verbindliche Integrationsgrenze ein.

### 3.1 Provider-Rollen

```text
Alpaca
  = Primary Market Data Provider

Alpha Vantage
  = Secondary / Enrichment / Research Provider

Alpaca MCP
  = Governed Read-only Agent Market-Data Plane

Alpha Vantage MCP
  = Governed Research / Enrichment Agent Plane
```

### 3.2 MCP ist nicht die Runtime-Pipeline

Produktive Screening-, Scoring-, Backtest- und Monte-Carlo-Services beziehen Daten über typisierte Provider-Adapter und den Market Data Gateway.

```text
Business Logic
   -> MarketDataGateway
      -> ProviderAdapter
         -> Provider API / Stream
```

Nicht zulässig als Standardpfad:

```text
Business Logic
   -> LLM
      -> MCP
         -> Market Data
```

MCP darf ergänzende Research-/Evidence-Daten liefern, aber keine ungeprüfte agentische Ausgabe als authoritative Marktpreis oder deterministischen Score einschleusen.

---

## 4. Alpaca wird Primary Provider

Alpaca wird für unterstützte Asset-Klassen als bevorzugte Quelle vorgesehen, insbesondere für:

- US Equities;
- historische und aktuelle Bars;
- Quotes;
- Trades;
- Snapshots;
- Crypto Market Data;
- Options Market Data;
- Option Chains;
- Corporate Actions;
- später optional WebSocket Streaming.

Die tatsächliche Verfügbarkeit einzelner Feeds und Echtzeitqualitäten hängt vom Alpaca-Plan, den Entitlements und Datenlizenzen ab und wird nicht durch das Vorhandensein eines API-Keys implizit angenommen.

---

## 5. Alpha Vantage wird Secondary / Enrichment Provider

Alpha Vantage wird nicht als alleinige zentrale Runtime-Abhängigkeit festgelegt.

Primäre Anwendungsfälle:

- Fundamentals;
- FX;
- Commodities;
- globale Equity-Ergänzung;
- technische Indikatoren als Referenz;
- Historical Research;
- Cross-Provider Validation;
- MCP-basierte Agent-Recherche.

Der kostenlose Alpha-Vantage-Zugang ist laut Anbieter aktuell auf 25 Requests pro Tag begrenzt. Daher darf dieser Tarif nicht still als ausreichende Kapazität für eine produktive Multi-User-SaaS-Runtime behandelt werden.

---

## 6. Provider Gateway

Zielstruktur:

```text
src/platform/MarketData/
  contracts/
  providers/
  ProviderRegistry.ts
  ProviderRouter.ts
  MarketDataGateway.ts
  DataNormalizer.ts
  DataQualityService.ts
```

Der Gateway übernimmt mindestens:

- Capability Routing;
- Provider Health;
- Timeout;
- Retry;
- Circuit Breaker;
- serverseitigen Cache;
- Request Coalescing;
- Rate-Limit Budgets;
- Fallback;
- Provenance;
- Freshness;
- Data Quality;
- Observability.

Business-Services dürfen keine Provider-spezifische Response-Struktur als Domain Contract verwenden.

---

## 7. Canonical Market Data

Jeder produktiv verwendete Datensatz erhält mindestens:

```text
provider
providerFeed
symbol
assetClass
currency
sourceTimestamp
ingestedAt
freshnessMs
qualityState
isRealtime
isDelayed
correlationId
```

Provider-spezifische Zusatzfelder dürfen gespeichert werden, aber Domain-Logik darf nicht davon abhängig sein, sofern sie nicht über einen expliziten Capability Contract modelliert sind.

---

## 8. No Demo Data

Die ältere Architekturidee eines Fallbacks auf simulierte Kursbewegungen wird für produktive Market-Data-Pfade verworfen.

Bei Ausfall gilt ausschließlich:

```text
fresh approved secondary provider
OR explicit stale cache with STALE marker
OR DEGRADED / UNAVAILABLE
```

Nicht zulässig:

```text
random / synthetic / simulated market price
-> presented as production market data
-> score / decision evidence
```

Damit wird die No Demo Data Policy auf die Market-Data-Infrastruktur explizit ausgedehnt.

---

## 9. Alpaca MCP — Read-only Entscheidung

Der offizielle Alpaca MCP Server V2 unterstützt ein Toolset-Filtering über `ALPACA_TOOLSETS`.

CAPITAL-AI genehmigt im Rahmen dieses ADR nur Marktdaten-/Research-Capabilities, zum Beispiel:

```text
assets
stock-data
crypto-data
options-data
corporate-actions
news
```

Das Toolset `trading` wird **nicht** genehmigt.

Ebenfalls nicht genehmigt:

- Order Placement;
- Order Replacement;
- Order Cancellation;
- Account Mutation;
- Portfolio Mutation.

Eine spätere Trading-Funktion benötigt ein eigenes ADR und darf nicht als Erweiterung dieses ADR interpretiert werden.

---

## 10. Alpha Vantage MCP

Der offizielle Alpha-Vantage-MCP-Server darf als kontrollierter Agent-/Research-Provider eingesetzt werden.

Die MCP-Verbindung wird logisch hinter Supervisor-/Policy-Gates betrieben. Tool-Nutzung muss Rate-Limits, Data Provenance und Audit Logging respektieren.

Die MCP-Integration begründet keine automatische Runtime-Abhängigkeit. Soll Alpha Vantage in der deterministischen Runtime verwendet werden, wird dies über einen normalen `AlphaVantageProvider` Adapter umgesetzt.

---

## 11. Security Boundary

Provider-Secrets verbleiben serverseitig.

Erwartete Secret-Klassen:

```text
ALPACA_API_KEY
ALPACA_SECRET_KEY
ALPHA_VANTAGE_API_KEY
```

Regeln:

1. keine Provider-Secrets im Frontend;
2. keine `VITE_*` Provider-Secrets;
3. keine Secrets in Logs, Metrics oder Audit-Evidence;
4. Credential-Rotation ohne Codeänderung;
5. fehlende Credentials führen zu Provider `UNAVAILABLE`;
6. kein Fallback auf Demo-/Synthetic-Daten;
7. MCP-Hosts erhalten nur die für den jeweiligen Host erforderlichen Credentials und Toolsets;
8. eine API-Key-Konfiguration ist kein Ersatz für IAM, Entitlement- oder Lizenzprüfung.

Render bleibt Production Control Plane für die dort gespeicherten Secrets. Dieses ADR autorisiert keine Offenlegung oder Verschiebung bestehender Secret-Werte.

---

## 12. IAM-Entscheidung

MCP-Market-Data-Zugriffe werden als explizite Capabilities modelliert.

Ziel-Capabilities:

```text
marketdata.alpaca.read
marketdata.alphavantage.read
marketdata.provider.health.read
marketdata.provider.config.read
marketdata.provider.config.plan
```

Nicht eingeführt:

```text
marketdata.trade.execute
marketdata.order.cancel
marketdata.portfolio.modify
```

Ein Agent darf keine eigene Capability erweitern.

---

## 13. Data Licensing / Entitlements

Marktdaten sind nicht nur ein technisches API-Thema, sondern ein Lizenz- und Entitlement-Thema.

Vor Produktionsfreigabe eines Feeds wird geprüft:

- realtime vs. delayed;
- Feed/Exchange;
- Speicherung;
- Display;
- Redistribution;
- Nutzerzahl;
- geografische Einschränkungen;
- Tariflimits;
- API-/WebSocket-Entitlements.

Die Anwendung darf den Marketingbegriff „real-time“ nur verwenden, wenn die tatsächlich verwendete Datenquelle und Lizenz dies für den betreffenden Datensatz rechtfertigen.

---

## 14. Cross-Provider Validation

Provider-Fallback und Provider-Consensus sind getrennte Funktionen.

### Fallback

```text
Primary unavailable
 -> Secondary provider
 -> provenance preserved
```

### Consensus

```text
Primary value + reference value
 -> divergence calculation
 -> confidence / degraded signal
```

Eine Abweichung wird nicht still durch Durchschnittsbildung versteckt.

---

## 15. Streaming-Entscheidung

Alpaca WebSocket Streaming wird als spätere Erweiterungsphase zugelassen, aber nicht allein durch dieses ADR produktiv aktiviert.

Vor Aktivierung erforderlich:

- Plan-/Entitlement-Nachweis;
- reconnect strategy;
- backpressure;
- connection limits;
- bounded fan-out;
- event ordering;
- duplicate handling;
- freshness monitoring;
- graceful shutdown;
- Render runtime impact;
- observability.

Der REST-basierte Gateway bleibt weiterhin verfügbar.

---

## 16. Observability

Mindestsignale:

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

Provider-Fehler müssen klassifiziert werden, zum Beispiel:

```text
AUTH
ENTITLEMENT
RATE_LIMIT
TIMEOUT
UPSTREAM_4XX
UPSTREAM_5XX
MALFORMED_DATA
STALE_DATA
NETWORK
UNKNOWN
```

---

## 17. Auswirkungen auf bestehende Architektur

### Positive Auswirkungen

- geringere Provider-Kopplung;
- bessere Testbarkeit;
- zentrale Datenqualität;
- klare Provenance;
- kontrollierbare Fallbacks;
- MCP-Least-Privilege;
- verbesserte Explainability;
- leichterer späterer Provider-Wechsel;
- bessere Multi-Provider-Validierung;
- No-Demo-Data-konformes Failure Handling.

### Negative Auswirkungen

- zusätzlicher Gateway-/Adapter-Layer;
- mehr Contract- und Mapping-Code;
- zusätzliche Provider-Health- und Quota-Logik;
- komplexere Observability;
- Lizenz-/Entitlement-Evidence wird Bestandteil des Production Handoffs.

Diese Kosten werden akzeptiert, da ein FinTech-Screener ohne providerneutrale Datenintegritätsgrenze ein höheres Betriebs-, Qualitäts- und Auditrisiko aufweist.

---

## 18. Nicht gewählte Alternativen

### Alternative A — Alpaca direkt in jeden Scoring-Service integrieren

**Abgelehnt.**

Grund: Vendor Lock-in, duplizierte Fehlerbehandlung, schwierige Provider-Migration und fehlende zentrale Provenance.

### Alternative B — Alpaca MCP als alleinigen Datenpfad verwenden

**Abgelehnt.**

Grund: agentische Tool-Nutzung ist nicht der geeignete deterministische Kern für produktives Screening, Backtesting und Scoring.

### Alternative C — Alpha Vantage als einzigen Primary Provider verwenden

**Abgelehnt.**

Grund: unterschiedliche Datenstärken und tarifabhängige Limits; der kostenlose Tarif ist insbesondere nicht für eine hochfrequente Multi-User-Runtime geeignet.

### Alternative D — Bei Provider-Ausfall simulierte Kurse erzeugen

**Abgelehnt.**

Grund: verletzt die No Demo Data Policy und beschädigt Datenintegrität, Explainability und Audit Evidence.

### Alternative E — Alpaca Trading Tools vorsorglich mit aktivieren

**Abgelehnt.**

Grund: unnötige Capability-Ausweitung und erheblich größerer finanzieller, regulatorischer und IAM-bezogener Blast Radius.

---

## 19. Implementierungsreihenfolge

### Phase 1 — Market Data Contracts

- Canonical DTO;
- Provider Interface;
- Alpaca Adapter;
- Env validation;
- Unit Tests.

### Phase 2 — Gateway & Resilience

- Provider Registry;
- Provider Router;
- cache;
- request coalescing;
- quota/rate-limit budget;
- retry/circuit breaker;
- health state;
- metrics.

### Phase 3 — Pipeline Migration

- direkte Market-Data-Aufrufe inventarisieren;
- traditionelle Asset-Scoring-Pfade auf Gateway migrieren;
- Backtest-Input auf canonical bars umstellen;
- No-Demo-Data-Fallbacks entfernen.

### Phase 4 — Alpaca MCP

- nur read-only Toolsets;
- Supervisor/Policy Gate;
- Audit Trail;
- Evidence für Tool-Liste;
- Negativtest: Trading Tools nicht verfügbar.

### Phase 5 — Alpha Vantage

- Provider Adapter für ausgewählte Enrichment-Capabilities;
- MCP Research Plane;
- Quota Tracking;
- Cross-Provider Validation.

### Phase 6 — Streaming

- optionaler Alpaca WebSocket;
- reconnect/backpressure;
- deployment/runtime evidence;
- load/failure tests.

---

## 20. Production Gate

Vor der technischen Produktionsfreigabe müssen mindestens folgende Evidence-Artefakte vorhanden sein:

1. aktive Provider-Capabilities;
2. verwendete Feed-/Entitlement-Klasse;
3. Secret-Namen vollständig, Werte nicht dokumentiert;
4. Health-/Failure-Test;
5. Rate-Limit-Test;
6. Cache-/Freshness-Test;
7. Fallback-Test;
8. No-Demo-Data-Negativtest;
9. MCP Tool Inventory;
10. Nachweis, dass Alpaca Trading Tools nicht exponiert sind;
11. Alpha-Vantage-Quota-Konfiguration;
12. Data Licensing/Redistribution Review;
13. Traceability ESS-0015 ↔ ADR-0038 ↔ Implementation ↔ Tests.

---

## 21. Verifikation externer Provider-Eigenschaften

Provider-Eigenschaften wurden am **2026-08-03** gegen die offiziellen Anbieterinformationen geprüft:

- Alpaca MCP Server V2: https://alpaca.markets/blog/alpaca-launches-mcp-server-v2/
- Alpaca MCP toolset guidance: https://alpaca.markets/learn/mcp-trading-with-claude-alpaca-google-sheets
- Alpha Vantage official MCP: https://mcp.alphavantage.co/
- Alpha Vantage API documentation: https://www.alphavantage.co/documentation/
- Alpha Vantage quota/support: https://www.alphavantage.co/support/

Aktuell dokumentiert Alpaca MCP V2 61 Actions und ein Toolset-Filtering. Alpha Vantage dokumentiert einen offiziellen Remote-MCP-Server; der kostenlose API-Service ist aktuell auf 25 Requests pro Tag begrenzt. Diese externen Eigenschaften können sich ändern und werden vor relevanten Produktionsänderungen erneut verifiziert.

---

## 22. Ergebnis

CAPITAL-AI entscheidet sich für eine **hybride, providerneutrale Market-Data-Architektur**:

```text
Alpaca REST / Stream
        |
        v
Market Data Gateway
        |
        v
Deterministic FinTech Data Pipeline
```

plus getrennt:

```text
Approved Agent
        |
        v
Supervisor / Policy
        |
        v
Read-only MCP Plane
   |             |
Alpaca        Alpha Vantage
```

Damit wird Alpaca zum bevorzugten Market-Data-Provider, ohne die Plattform an Alpaca zu koppeln. Alpha Vantage ergänzt Fundamentals, FX, Commodities, Research und Provider-Validation. MCP erweitert die Agentenfähigkeiten, ohne den deterministischen Kern der FinTech Data Pipeline oder die Security Boundary zu ersetzen.
