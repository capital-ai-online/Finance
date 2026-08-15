# Architectural Decision Record (ADR-0041)
## Enterprise Market Data Provider & MCP Architecture

**Status:** ACCEPTED  
**Implementation-Status:** PHASE 3B PARTIALLY IMPLEMENTED / ALPACA PROMOTION NOT AUTHORIZED  
**Date:** 2026-08-03  
**Version:** 0.6.0  
**Priority:** P1  
**Related ESS:** ESS-0016  
**Related ADR:** ADR-0009, ADR-0012, ADR-0013, ADR-0018, ADR-0035, ADR-0037, ADR-0040  

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

Würde dagegen jeder Business-Service direkt einen bestimmten Provider ansprechen, entstünden Duplikate für Authentication, Retry, Rate Limits, Caching, Normalisierung, Fallback, Data Quality und Observability.

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

## 3.3 P1 Phase-1 implementation boundary (2026-08-14)

Phase 1 introduces the provider-neutral canonical snapshot contract, data-quality assessment,
explicit provider registry, fail-closed gateway and Alpaca REST adapter under
`src/platform/MarketData/`.

Alpaca remains registered with role `shadow`. The gateway excludes shadow providers unless the
caller explicitly sets `includeShadow: true`; no existing quote, screening or scoring call site
is migrated by this phase. Therefore the architectural target "Alpaca primary" remains a future
promotion decision subject to the documented 14-trading-day / 1,000-observation evidence gate,
entitlement review and separate Owner authorization.

## 3.4 P2 Phase-2 gateway resilience boundary (2026-08-14)

Phase 2 adds explicit provider routing with bounded server-side caching, identical-request
coalescing, provider/capability rate-limit budgets, circuit-breaker isolation and structured
payload-free telemetry. Cached observations are revalidated against the caller's freshness
contract before use; expired or unacceptable observations are evicted and never converted into
synthetic data.

This phase remains outside the active scoring/screening composition root. Alpaca remains
`shadow`; provider promotion, entitlement approval and pipeline migration require separate
evidence and Owner authorization.

## 3.5 P3A traditional quote migration boundary (2026-08-15)

The existing Twelve Data stock/forex quote path now enters through the canonical
`MarketDataGateway` and a typed `TwelveDataMarketDataProvider`. The legacy
`traditional-quote/1.0.0` response remains a compatibility boundary for current consumers,
while freshness, provenance, cache, coalescing, rate-limit and circuit-breaker controls are
enforced centrally.

Alpaca continues to run as independent score-neutral shadow evidence. Index quotes, historical
series, fundamentals and scoring-input migrations remain outside P3A and require later bounded
work packages.

## 3.6 P3B index quote migration boundary (2026-08-15)

FMP index quotes now enter the canonical gateway through an injected read-only loader adapter.
The platform provider does not import server internals; existing approved ticker mappings, FMP
cooldown and cache remain in the server composition boundary. The legacy Traditional Quote
contract remains compatible and continues to deny execution-price eligibility.

Index histories, stock fundamentals and scoring-input generation remain outside P3B. Alpaca
remains score-neutral shadow evidence and is not promoted.

## 4. Alpaca wird Primary Provider

Alpaca wird für unterstützte Asset-Klassen als bevorzugte Quelle vorgesehen, insbesondere für US Equities, historische und aktuelle Bars, Quotes, Trades, Snapshots, Crypto Market Data, Options Market Data, Option Chains, Corporate Actions und später optional WebSocket Streaming.

Die tatsächliche Verfügbarkeit einzelner Feeds und Echtzeitqualitäten hängt vom Alpaca-Plan, den Entitlements und Datenlizenzen ab und wird nicht durch das Vorhandensein eines API-Keys implizit angenommen.

---

## 5. Alpha Vantage wird Secondary / Enrichment Provider

Alpha Vantage wird nicht als alleinige zentrale Runtime-Abhängigkeit festgelegt.

Primäre Anwendungsfälle sind Fundamentals, FX, Commodities, globale Equity-Ergänzung, technische Indikatoren als Referenz, Historical Research, Cross-Provider Validation und MCP-basierte Agent-Recherche.

Tarif- und Quota-Grenzen dürfen nicht still als ausreichende Kapazität für eine produktive Multi-User-SaaS-Runtime behandelt werden.

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

Der Gateway übernimmt mindestens Capability Routing, Provider Health, Timeout, Retry, Circuit Breaker, serverseitigen Cache, Request Coalescing, Rate-Limit Budgets, Fallback, Provenance, Freshness, Data Quality und Observability.

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

CAPITAL-AI genehmigt im Rahmen dieses ADR nur Marktdaten-/Research-Capabilities, zum Beispiel:

```text
assets
stock-data
crypto-data
options-data
corporate-actions
news
```

Das Toolset `trading` sowie Order-, Account- und Portfolio-Mutationen werden **nicht** genehmigt. Eine spätere Trading-Funktion benötigt ein eigenes ADR und darf nicht als Erweiterung dieses ADR interpretiert werden.

---

## 10. Alpha Vantage MCP

Der Alpha-Vantage-MCP-Server darf als kontrollierter Agent-/Research-Provider eingesetzt werden. Die MCP-Verbindung wird logisch hinter Supervisor-/Policy-Gates betrieben. Tool-Nutzung muss Rate-Limits, Data Provenance und Audit Logging respektieren.

Die MCP-Integration begründet keine automatische Runtime-Abhängigkeit. Runtime-Nutzung erfolgt über einen expliziten `AlphaVantageProvider` Adapter.

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
7. MCP-Hosts erhalten nur erforderliche Credentials und Toolsets;
8. API-Key-Konfiguration ersetzt keine IAM-, Entitlement- oder Lizenzprüfung.

Render bleibt Production Control Plane für die dort gespeicherten Secrets. Dieses ADR autorisiert keine Offenlegung oder Verschiebung bestehender Secret-Werte.

---

## 12. IAM-Entscheidung

MCP-Market-Data-Zugriffe werden als explizite Capabilities modelliert.

```text
marketdata.alpaca.read
marketdata.alphavantage.read
marketdata.provider.health.read
marketdata.provider.config.read
marketdata.provider.config.plan
```

Nicht eingeführt werden Trading-, Order-Cancel- oder Portfolio-Mutations-Capabilities. Ein Agent darf keine eigene Capability erweitern.

---

## 13. Data Licensing / Entitlements

Vor Produktionsfreigabe eines Feeds werden Realtime-/Delayed-Status, Feed/Exchange, Speicherung, Display, Redistribution, Nutzerzahl, geografische Einschränkungen, Tariflimits und API-/WebSocket-Entitlements geprüft.

Die Anwendung darf den Marketingbegriff „real-time“ nur verwenden, wenn Datenquelle und Lizenz dies für den betreffenden Datensatz rechtfertigen.

---

## 14. Cross-Provider Validation

Provider-Fallback und Provider-Consensus sind getrennte Funktionen.

```text
Primary unavailable
 -> Secondary provider
 -> provenance preserved
```

```text
Primary value + reference value
 -> divergence calculation
 -> confidence / degraded signal
```

Eine Abweichung wird nicht still durch Durchschnittsbildung versteckt.

---

## 15. Streaming-Entscheidung

Alpaca WebSocket Streaming wird als spätere Erweiterungsphase zugelassen, aber nicht allein durch dieses ADR produktiv aktiviert.

Vor Aktivierung erforderlich sind Plan-/Entitlement-Nachweis, Reconnect-Strategie, Backpressure, Connection Limits, bounded fan-out, Event Ordering, Duplicate Handling, Freshness Monitoring, Graceful Shutdown, Render Runtime Impact und Observability.

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

Provider-Fehler werden strukturiert klassifiziert, etwa AUTH, ENTITLEMENT, RATE_LIMIT, TIMEOUT, UPSTREAM_4XX, UPSTREAM_5XX, MALFORMED_DATA, STALE_DATA, NETWORK und UNKNOWN.

---

## 17. Auswirkungen auf bestehende Architektur

Positive Auswirkungen sind geringere Provider-Kopplung, bessere Testbarkeit, zentrale Datenqualität, klare Provenance, kontrollierbare Fallbacks, MCP-Least-Privilege, bessere Explainability und No-Demo-Data-konformes Failure Handling.

Akzeptierte Kosten sind zusätzlicher Gateway-/Adapter-Code, Provider-Health- und Quota-Logik, komplexere Observability sowie Lizenz-/Entitlement-Evidence im Production Handoff.

---

## 18. Nicht gewählte Alternativen

- **Direkte Alpaca-Integration in jeden Scoring-Service:** abgelehnt wegen Vendor Lock-in und duplizierter Fehlerbehandlung.
- **Alpaca MCP als alleiniger Datenpfad:** abgelehnt, da agentische Tool-Nutzung kein deterministischer Kern für Screening, Backtesting und Scoring ist.
- **Alpha Vantage als einziger Primary Provider:** abgelehnt wegen unterschiedlicher Datenstärken und tarifabhängiger Limits.
- **Simulierte Kurse bei Provider-Ausfall:** abgelehnt wegen Verletzung der No Demo Data Policy.
- **Vorsorgliche Aktivierung von Trading Tools:** abgelehnt wegen unnötiger Capability-Ausweitung und regulatorischem Blast Radius.

---

## 19. Implementierungsreihenfolge

1. Market Data Contracts und Canonical DTO.
2. Alpaca Adapter und Environment-Validierung.
3. Gateway, Registry, Routing, Cache, Quota, Circuit Breaker und Metrics.
4. Migration direkter Market-Data-Aufrufe.
5. Read-only Alpaca MCP hinter Supervisor-/Policy-Gate.
6. Alpha-Vantage-Adapter und MCP Research Plane.
7. Optionales Streaming nach eigenem Production Gate.

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
13. Traceability ESS-0016 ↔ ADR-0041 ↔ Implementation ↔ Tests.

---

## 21. Verifikation externer Provider-Eigenschaften

Provider-Funktionen, Preise, Entitlements und Limits sind externe Verträge und müssen vor produktionskritischen Änderungen erneut gegen offizielle Anbieterinformationen verifiziert werden.

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
