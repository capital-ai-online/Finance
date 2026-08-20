# ADR-0097 — Verified Asset Display & Progressive Hydration Boundary

**Authority ID:** `AUTH-ADR-VERIFIED-ASSET-DISPLAY-2026-08-20`  
**Status:** ACCEPTED-FOR-IMPLEMENTATION  
**Lifecycle:** accepted-for-implementation  
**Version:** 1.0.0  
**Date:** 2026-08-20  
**Priority:** P0 data availability / data integrity  
**Authority / Work Item:** Owner Chat-Priorität 2026-08-20 — „setze das Muster in der Architektur und behebe die Ursache“  
**Related:** ADR-0041, ADR-0034, ARCH-DATENQ-0001, SC2-GLOBAL-MULTI-ASSET-EXIT-2026-08-19

## 1. Kontext

Der öffentliche Asset-Katalog (`GET /api/registry/assets`) ist nach der eingeführten Datenintegritätsarchitektur absichtlich **metadata-only**. Bootstrap-Marktwerte aus `AssetRegistry` besitzen keine feldbezogene Provider-Provenance und werden daher nicht als verifizierte Marktbeobachtungen ausgegeben. Für `price`, `score`, `marketCap`, `volume24h` und ähnliche Felder liefert der Katalog deshalb `null`.

Mehrere historische UI-Consumer wurden vor dieser Trennung gebaut. Insbesondere `BuffetValueCheck.tsx` interpretierte den Katalog weiterhin als Markt-Datensatz. Der frühere Null-Safety-Fix (PR #259) verhinderte nur einen Runtime-Absturz und stellte Nullwerte als „Nicht verfügbar“ dar; er verband die UI nicht mit dem verifizierten Evidence-Layer.

Zusätzlich zeigt die Render-Produktion am 2026-08-20 eine Provider-Sättigung bei breiter/eifriger Datenbeschaffung:

- `CryptoHistoryProvider`: TwelveData/EODHD Circuit Breaker mehrfach offen;
- `CryptoSnapshotProvider`: CoinGecko `HTTP 429`;
- betroffener Render-Service: `Finance`, Frankfurt, Produktion auf `main@73d27b7a586722d968a972b07a8e73a10f777782`.

Eine Lösung, die beim Öffnen einer Ansicht sofort den gesamten Katalog hydratisiert, würde diesen Zustand verschärfen.

## 2. Entscheidung

CAPITAL-AI führt den versionierten Contract **`verified-asset-display/1.0.0`** als read-only Integrationsgrenze zwischen Asset-Katalog und UI-Darstellung ein.

```text
Asset Catalog (metadata only)
        |
        | selected symbol
        v
Verified Asset Display
        |
        +--> Crypto Evidence
        +--> Traditional Quote Evidence
        +--> Stock Fundamentals
        +--> Commodity Evidence
        +--> Sovereign Yield Evidence
        |
        v
Field-level value + provider + evidence + timestamps + status
        |
        v
UI / Buffett Value Check
```

### 2.1 Progressive statt eager Hydration

Der Display-Contract wird **pro ausgewähltem Symbol** geladen. Es gibt in diesem Boundary bewusst keinen „hydrate all catalog assets“-Endpunkt.

Regeln:

1. Katalogabruf lädt nur Symbol, Name, Assetklasse und Metadaten.
2. Provider-I/O startet erst für das aktuell sichtbare/ausgewählte Asset.
3. UI kann besuchte Werte clientseitig cachen, darf ungeöffnete Assets aber nicht vorab massenhaft abrufen.
4. Provider Rate Limits, Circuit Breaker, Cache und Last-Known-Good bleiben in den bestehenden Adaptern/Gateways maßgeblich.
5. Fehlende Daten erzeugen `PARTIAL` oder `SOURCE_UNAVAILABLE`, niemals Bootstrap-/Demo-Ersatzwerte.

### 2.2 Assetklassen

| Assetklasse | Display-Wert | Bestehender Evidence-Pfad | Buffett/Graham |
|---|---|---|---|
| Crypto | Preis, 24h, Market Cap, Volumen soweit vorhanden | CoinGecko Snapshot; Spot-Consensus nur bei fehlendem Snapshot-Preis | `NOT_APPLICABLE` |
| Stock | Marktpreis + Fundamentals | Traditional Quote + Alpha Vantage/FMP Fundamentals | `READY/PARTIAL` |
| Forex | Marktpreis | Traditional Quote | `NOT_APPLICABLE` |
| Index | Indexwert | FMP/TwelveData Traditional Quote | `NOT_APPLICABLE` |
| Commodity | letzter verifizierter Research-Schlusswert | TwelveData Commodity Evidence | `NOT_APPLICABLE` |
| Sovereign Benchmark | Renditewert | EODHD `*.GBOND` Evidence | `NOT_APPLICABLE` |
| Einzelanleihe ohne freigegebenes Mapping | kein Wert | fail-closed | `NOT_APPLICABLE` |

Der Display-Contract ist **nicht execution-price-eligible**. Er dient Darstellung, Research und erklärbarer Analyse.

## 3. Aktien-Fundamentals

`server/stockFundamentals.ts` bleibt die kanonische serverseitige Fundamentals-Grenze und wird erweitert:

1. **Alpha Vantage OVERVIEW** bleibt primäre Fundamentals-Quelle.
2. **FMP `ratios-ttm`** dient als bereits im System vorhandene Secondary-/Enrichment-Quelle.
3. Relevante Felder: P/E, Dividendenrendite, Nettomarge, Debt-to-Equity, EPS TTM, Free Cash Flow per Share.
4. Jedes übernommene Feld erhält Provider, Source Path und Retrieval-/Observation-Zeitstempel soweit verfügbar.
5. Kein Feld wird aus dem Aktienkurs approximiert.

Maßgebliche Provider-Dokumentation:

- Alpha Vantage Fundamental Data / Company Overview: `https://www.alphavantage.co/documentation/`
- Financial Modeling Prep Stable API / Ratios TTM: `https://site.financialmodelingprep.com/developer/docs/stable`

## 4. Buffett/Graham-Semantik

Der Buffett Value Check wird fachlich auf **Unternehmensaktien** begrenzt.

### 4.1 Entfernte implizite Ersatzwerte

Nicht mehr zulässig:

- `EPS = price * 0.07` als stiller Fundamental-Fallback;
- `EPS = 3.5` bei fehlender Evidenz;
- Score-Fallback `7.5`;
- fehlendes Debt-to-Equity oder P/E automatisch als „bestanden“ zu behandeln;
- Crypto/Forex/Commodity/Index/Bond durch dieselbe Unternehmensbewertung zu führen.

### 4.2 Modellannahmen bleiben möglich, aber sichtbar

Wachstum, Diskontsatz, Terminal-Multiple sowie vom Nutzer manuell überschriebene EPS-/Preiswerte sind **Szenarioannahmen**. Sie bleiben im UI als solche gekennzeichnet und dürfen nicht mit Provider-Evidence vermischt werden.

DCF verwendet verifiziertes Free Cash Flow per Share bevorzugt. Fehlt FCF, kann EPS nur als explizit sichtbarer Modell-Proxy verwendet werden; es wird nicht systemseitig erfunden.

## 5. Datenstatus

Der Contract unterscheidet:

- `READY`: primärer Display-Wert ist verifiziert verfügbar;
- `PARTIAL`: nur ein Teil der fachlich erwartbaren Evidence liegt vor;
- `SOURCE_UNAVAILABLE`: keine zulässige Quelle konnte einen Wert liefern;
- `NOT_APPLICABLE`: ein Modell/Feld ist für diese Assetklasse fachlich nicht anwendbar.

Damit wird „fehlender Providerwert“ von „fachlich nicht existierend“ getrennt.

## 6. Security, Compliance und Datenintegrität

- keine Provider-Secrets im Browser;
- keine Client-seitigen Direktaufrufe keyed Provider;
- kein Rückgriff auf `AssetRegistry`-Bootstrapwerte für verifizierte Darstellung;
- keine erfundenen Markt-/Fundamentalwerte;
- `executionPriceEligible=false` bleibt bindend;
- Provider-Mappings bleiben allow-listed bzw. provider-verifiziert;
- Einzelanleihen ohne freigegebenes Benchmark-Mapping bleiben fail-closed;
- Rate Limit des Display-Endpunkts begrenzt UI-getriebene Provider-Aufrufe;
- Scoring-/Ranking-Verträge werden durch diesen Display-Contract nicht verändert.

## 7. Wiederverwendung statt Parallelarchitektur

Wiederverwendet werden:

- `traditionalQuoteEvidence.ts`;
- `cryptoSnapshotProvider.ts`;
- `cryptoSpotConsensus.ts`;
- `commodityMarketEvidence.ts`;
- `sovereignBondProviderMapping.ts`;
- `eodhdBondEvidence.ts`;
- `stockFundamentals.ts`;
- bestehende Provider Health / Rate-Limit / Circuit-Breaker-Strukturen;
- Asset Search Catalog als Metadata Authority.

Keine neue Marktdatenbank, kein neuer Scoring-Dispatcher und kein zusätzlicher externer Framework-Stack werden eingeführt.

## 8. Konsequenzen

### Positiv

- Asset-Katalog bleibt integer und provenance-sicher;
- sichtbare Werte werden tatsächlich aus Evidence hydratisiert;
- Buffett zeigt bei Aktien reale Fundamentals statt pauschaler Ersatzwerte;
- nicht anwendbare Assetklassen werden korrekt gekennzeichnet;
- Provider-Last wächst mit Benutzerinteraktion statt Kataloggröße;
- ein einheitlicher Display-Contract kann sukzessive von weiteren UI-Komponenten wiederverwendet werden.

### Einschränkungen

- „alle Assets“ bedeutet nicht „für jedes Symbol muss ein Wert erfunden werden“: fehlt ein freigegebenes Provider-Mapping oder ist ein Provider nicht verfügbar, bleibt der Status transparent `SOURCE_UNAVAILABLE`;
- CoinGecko-/TwelveData-/EODHD-/FMP-/Alpha-Vantage-Verfügbarkeit und Vertrags-/Lizenzbedingungen bleiben externe Betriebsabhängigkeiten;
- Provider-Sättigung aus bestehenden globalen Refresh-/History-Prozessen wird durch progressive UI-Hydration nicht automatisch vollständig beseitigt und bleibt separat zu beobachten.

## 9. Validierungs-Gates

Vor Merge sind mindestens zu prüfen:

- TypeScript;
- Unit-/Contract-Tests für Display Boundary und Buffett Null-/Fallback-Regeln;
- Diff-Scope;
- aktueller `main`-Sync;
- Render-Runtime nach Deployment: keine neue 429-/Circuit-Breaker-Spitze durch Display-Aufrufe;
- Buffett bei Stock: Preis/EPS/Fundamentals sichtbar oder transparenter `PARTIAL`-Status;
- Buffett bei Nicht-Stock: `NOT_APPLICABLE`, keine Fundamentalbewertung.

Kostenverursachende vollständige GitHub-CI wird gemäß Projekt-Governance erst nach PR-Erstellung und Owner-Gate gestartet.
