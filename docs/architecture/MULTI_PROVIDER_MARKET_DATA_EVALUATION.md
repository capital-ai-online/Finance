# Multi-Provider Market Data Evaluation

Stand: 2026-08-02

## Ziel

Bewertung zusätzlicher Finanzdatenquellen für eine evidence-preserving, load-aware Multi-Provider-Architektur. Die Aufnahme in diese Matrix bedeutet **keine produktive Aktivierung**. Provider werden erst nach Lizenz-, Kosten-, Quota-, Datenschutz- und Contract-Prüfung in Produktion freigeschaltet.

## Bewertungsprinzip

Ein Market-Data-Router darf Provider nicht wie identische Webserver behandeln. Auswahlkriterien sind:

- Asset-/Instrumentabdeckung
- Aktualität und historische Tiefe
- REST/WebSocket/Flat-File-Fähigkeit
- Provider-/Exchange-Provenance
- Symbol-/Identifier-Qualität
- Rate Limits und Quotas
- regionale Verfügbarkeit
- Redistributierungs-/Business-Lizenz
- Eignung für Scoring vs. Referenz-/Makrodaten
- SLA/Resilience und Failover-Eignung

## Kandidatenmatrix

| Provider | Abdeckung | Stärken für CAPITAL-AI | Rolle im Router | Status |
|---|---|---|---|---|
| CoinGecko | Crypto | aggregierte Crypto-History/Snapshots | bevorzugte Crypto-Quelle | aktiv |
| Binance | Crypto Venue | Daily Klines, Quotes, Orderbook | Venue-Fallback | aktiv |
| Kraken | Crypto Venue | OHLC, Quotes, Orderbook | Venue-Fallback | aktiv |
| CoinAPI | Crypto Multi-Exchange | normalisierte Daten über viele Exchanges, OHLCV, Quotes, Trades, Order Books, regionale Endpoints | institutioneller Crypto-Aggregator / Quorum-Kandidat | candidate |
| Stooq | Stocks/Forex | einfache Historienquelle | History-Fallback | aktiv |
| Alpha Vantage | Stocks | Fundamentals + Marktzeitreihen | Fundamentals/Market Backup | aktiv |
| FMP | Stocks/Indices | Index-/Traditional-Market-Daten | Index/Traditional Provider | aktiv |
| Twelve Data | Stocks/Forex/ETFs/Funds/Commodities/Crypto | globale Multi-Asset-Abdeckung, REST und WebSocket | globaler Multi-Asset-Fallback | candidate |
| Finnhub | Stocks/Forex/Crypto/ETFs/Indices | Real-Time REST/WebSocket, Fundamentals, Estimates und alternative Daten | zweite Fundamentals-/Research-Quelle | candidate |
| Massive (ehem. Polygon.io) | Stocks/Options/Indices/Forex/Crypto/Futures | REST, WebSocket, Flat Files, detaillierte US-Markt-/Optionsdaten | US institutional market-data path | candidate |
| FRED | Macro/Rates | offizielle/kuratierte wirtschaftliche Zeitreihen via REST | Macro-/Rate-Evidence | candidate |
| ECB | EUR FX/Macro/Rates | offizielle EUR-Referenzkurse und Euro-Area-Daten | Reference/Macro Evidence | reference-only |

## Empfohlene Zieltopologie

### Crypto

```text
Crypto request
   |
   v
Adaptive Router
   +-- CoinGecko (aggregated preferred)
   +-- Binance (venue fallback)
   +-- Kraken (venue fallback)
   +-- CoinAPI (future normalized multi-exchange)
   |
Normalization + timestamp alignment
   |
Optional cross-provider consistency check
   |
Scoring Evidence Contract
```

CoinAPI ist besonders interessant, weil die offizielle Dokumentation OHLCV, Quotes, Trades, Order Books und Exchange-Metadaten über eine normalisierte API sowie regionale Endpoints beschreibt. Damit könnte CoinAPI später sowohl zusätzliche Redundanz als auch Quorum-/Cross-Venue-Evidence liefern.

## Stocks / Forex / Index

```text
Traditional request
   |
   v
Capability Router
   +-- Fundamentals: Alpha Vantage / Finnhub / FMP
   +-- History: Stooq / Twelve Data / FMP / Massive
   +-- Realtime: Twelve Data / Finnhub / Massive
   +-- Indices: FMP / Massive
   |
Field-level Provenance
   |
Scoring Lineage
```

Twelve Data ist für die globale Diversifizierung interessant, weil die offizielle Dokumentation mehr als 50 Länder und über eine Million Instrumente einschließlich Aktien, Forex, ETFs, Fonds, Commodities und Kryptowährungen nennt.

Finnhub eignet sich besonders als zweite fundamentale/research-orientierte Quelle. Die offizielle Produktbeschreibung nennt Echtzeit-REST/WebSocket für Aktien, Währungen und Crypto sowie Unternehmensfundamentaldaten, Estimates, ETFs/Funds/Indices und alternative Daten.

Massive bietet eine breite moderne Datenebene mit REST, WebSocket und Flat Files. Die Dokumentation führt Stocks, Options, Futures, Indices, Forex, Crypto, Economy und Alternative Data auf. Für U.S.-Optionsdaten beschreibt der Anbieter direkte OPRA-/Exchange-Abdeckung und regulatorische Lizenzanforderungen; dies ist langfristig relevant für eine Options-/Derivate-Erweiterung.

## Macro / Rates / Bonds

FRED sollte nicht als Execution-Market-Feed behandelt werden, ist aber sehr gut als Macro Evidence Layer geeignet. Die FRED API stellt REST-Zugriff auf FRED und ALFRED sowie Serien-/Release-/Category-Daten bereit.

Die ECB-Referenzkurse eignen sich für offizielle EUR-FX-/Makro-Referenzierung. Die ECB weist ausdrücklich darauf hin, dass ihre Referenzkurse Informationszwecken dienen und die Verwendung zu Transaktionszwecken nicht empfohlen wird. Sie dürfen deshalb nicht als ausführbarer FX-Preis im Scoring ausgegeben werden.

## Routing-Strategie

### Stufe 1 — Adaptive Failover

Bereits umsetzbar und in diesem PR begonnen:

- Governance-Priorität
- Provider Health
- Consecutive Failures
- Cooldown
- EWMA-Latenz
- explizite Provenance

### Stufe 2 — Hedged Reads

Für latency-sensitive Endpunkte kann nach einer kurzen Verzögerung ein zweiter Provider parallel gestartet werden. Das erste **qualitativ gültige** Ergebnis gewinnt. Hedged Reads dürfen nur bei Lizenz-/Quota-Freigabe genutzt werden, weil sie Requests vervielfachen.

### Stufe 3 — Quorum / Consensus

Für hochwertige Enterprise-Scores sollten kritische Felder optional aus mindestens zwei unabhängigen Quellen verglichen werden:

```text
Provider A value ----+
                     +--> tolerance check --> canonical observation
Provider B value ----+
```

Beispielregeln:

- Preisabweichung <= definierter Basis-Punkte-Toleranz
- gleiche Währung / gleiche Corporate-Action-Basis
- Zeitstempel innerhalb definierter Freshness Window
- bei Konflikt: `SOURCE_CONFLICT`, kein erfundener Mittelwert

### Stufe 4 — Cost-/Quota-aware Routing

Erst nach produktiver Provideraktivierung:

- Restquota
- Plan-/Lizenzklasse
- Assetklasse
- Datenlatenz
- SLA
- Kosten pro Request/Stream

Diese Faktoren dürfen niemals Provenance-, Freshness- oder Compliance-Gates überstimmen.

## Production Handoff für neue Provider

Für jeden Kandidaten separat:

1. Vertrag/Lizenz und Redistributierungsrechte prüfen
2. API-Key in Production Secret Store/Render Environment hinterlegen
3. Adapter + Normalizer implementieren
4. Symbol-/Identifier-Mapping testen
5. Provenance + Provider Health integrieren
6. Contract-/Golden-Tests ausführen
7. Rate-Limit-/Quota-Monitoring aktivieren
8. Rollback/Disable-Schalter verifizieren
9. Traceability/ADR/Compliance Evidence aktualisieren

## Offizielle Quellen der Evaluation

- Twelve Data Documentation: https://twelvedata.com/docs/introduction/quickstart
- Finnhub: https://www.finnhub.io/
- Massive Documentation: https://massive.com/docs
- Massive Stocks: https://massive.com/docs/rest/stocks
- CoinAPI Market Data Documentation: https://www.coinapi.io/products/market-data-api/docs/rest-api
- CoinAPI Endpoints/Regional Routing: https://www.coinapi.io/products/market-data-api/docs/rest-api/endpoints
- FRED API: https://fred.stlouisfed.org/docs/api/fred/overview.html
- ECB Euro FX Reference Rates: https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html
