# ADR-0021: Aktivierung zusätzlicher externer Market-Data-Provider

* **Status:** ACCEPTED
* **Datum:** 2026-08-02
* **Autor:** CAPITAL-AI Architecture

## Kontext

CAPITAL-AI verwendet seit ADR-0020 eine adaptive, provenance-erhaltende Multi-Provider-Routing-Schicht. Die bestehende produktive Provider-Landschaft soll um drei bereits serverseitig konfigurierte Quellen erweitert werden, um Single-Provider-Abhängigkeiten weiter zu reduzieren und die Asset-Abdeckung zu erhöhen.

Verfügbare serverseitige Environment-Variablen:

- `COIN_API_KEY` — CoinAPI
- `EODHD_API_KEY` — EODHD
- `TWELVEDATA_API_KEY` — Twelve Data

Die Schlüssel dürfen ausschließlich im Backend verwendet und niemals an Client-/Browser-Code übertragen werden.

## Entscheidung

Die drei Provider werden als aktive, adaptergestützte Datenquellen in die bestehende Market-Data-Routing-Architektur aufgenommen.

### CoinAPI

Einsatzschwerpunkt: Crypto.

- OHLCV-Historie über die CoinAPI REST Market Data API
- Referenz-/Spotpreise über Exchange Rates
- Authentifizierung per `X-CoinAPI-Key`
- Provider-/Symbol-ID wird Bestandteil der Provenance
- CoinAPI-Referenzpreise dürfen nicht als venue-spezifischer Execution Price dargestellt werden

### Twelve Data

Einsatzschwerpunkt: Multi-Asset.

- `time_series` für Stocks, Forex, Crypto und unterstützte weitere Instrumente
- `/price` für Referenz-/Spotpreise
- Authentifizierung serverseitig über den empfohlenen Authorization-Header
- Exchange-, MIC-, Currency- und Timezone-Metadaten werden soweit verfügbar erhalten
- Null-/Rate-Limit-/Entitlement-Antworten führen fail-closed zu Provider-Fallback

### EODHD

Einsatzschwerpunkt: EOD-/Historical-Redundanz.

- End-of-Day Historie für unterstützte Stocks, Forex und Crypto
- `api_token` ausschließlich in serverseitigen Requests
- Symbol-/Exchange-Semantik wird explizit in Provenance erhalten
- EOD-Werte dürfen bei Echtzeit-Quorumprüfungen nicht als zeitgleiche Ausführungspreise behandelt werden

## Routing-Prinzip

Die Provider werden nicht per Round-Robin ausgetauscht. Die bestehende Routerlogik berücksichtigt Governance-Priorität, beobachtete Fehler, Cooldowns und Latenz. Freshness, Provenance, Lizenz-/Entitlement-Regeln und Source-Conflict-Gates haben Vorrang vor reiner Verfügbarkeit.

## Quorum und Konflikte

Für kritische Preisfelder wird der bestehende `marketDataConsensus`-Contract verwendet. Mehrere unabhängige Quellen dürfen nur dann einen kanonischen Referenzwert erzeugen, wenn:

- genügend unabhängige Provider vorliegen,
- Einheit/Währung übereinstimmt,
- Observation-Time-Skew innerhalb der zulässigen Grenze liegt,
- die Abweichung innerhalb der definierten Basis-Punkte-Toleranz liegt.

Andernfalls wird `SOURCE_CONFLICT` bzw. `INSUFFICIENT_SOURCES` ausgegeben; es wird kein künstlicher Mittelwert erzeugt.

## Konsequenzen

Positiv:

- geringere Abhängigkeit von einzelnen Marktquellen,
- breitere Crypto-/Stock-/Forex-Abdeckung,
- zusätzliche unabhängige Evidence für Scoring und Plausibilisierung,
- bessere Runtime-Resilience und Provider-Observability.

Risiken/Controls:

- Quotas und Vertrags-/Redistributionsrechte bleiben provider- und planabhängig,
- EOD- und Echtzeitdaten dürfen semantisch nicht vermischt werden,
- Symbol-Mappings werden nur dort aktiviert, wo sie deterministisch sind,
- fehlende oder widersprüchliche Daten bleiben fail-closed.

## Verifikation

- Unit-/Contract-Tests mit gemockten Providerantworten
- TypeScript-Check
- Production Build
- bestehendes SCA/CVE-Gate
- Deployment-Readiness-Gates

## Referenzdokumentation

- CoinAPI REST API: https://www.coinapi.io/products/market-data-api/docs/rest-api
- EODHD Historical API: https://eodhd.com/financial-apis/api-for-historical-data-and-volumes
- Twelve Data API: https://twelvedata.com/docs/advanced
