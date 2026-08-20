# ADR-0097 — Verified Asset Display & Progressive Hydration Boundary

**Authority ID:** `AUTH-ADR-VERIFIED-ASSET-DISPLAY-2026-08-20`  
**Status:** ACCEPTED-FOR-IMPLEMENTATION  
**Lifecycle:** accepted-for-implementation  
**Version:** 1.1.0  
**Date:** 2026-08-20  
**Priority:** P0 data availability / data integrity  
**Authority / Work Item:** Owner Chat-Priorität 2026-08-20 — „setze das Muster in der Architektur und behebe die Ursache“ + Folgepriorität „Dokumente konsolidieren, Buffett nur Aktien, Work Claim ersetzen, Background Refresh 90 Sekunden“  
**Related:** ADR-0041, ADR-0034, ADR-0087, ARCH-DATENQ-0001, SC2-GLOBAL-MULTI-ASSET-EXIT-2026-08-19

## 1. Kontext

Der öffentliche Asset-Katalog (`GET /api/registry/assets`) ist nach der eingeführten Datenintegritätsarchitektur absichtlich **metadata-only**. Bootstrap-Marktwerte aus `AssetRegistry` besitzen keine feldbezogene Provider-Provenance und werden daher nicht als verifizierte Marktbeobachtungen ausgegeben. Für `price`, `score`, `marketCap`, `volume24h` und ähnliche Felder liefert der Katalog deshalb `null`.

Mehrere historische UI-Consumer wurden vor dieser Trennung gebaut. Insbesondere `BuffetValueCheck.tsx` interpretierte den Katalog weiterhin als Markt-Datensatz. Der frühere Null-Safety-Fix (PR #259) verhinderte nur einen Runtime-Absturz und stellte Nullwerte als „Nicht verfügbar“ dar; er verband die UI nicht mit dem verifizierten Evidence-Layer.

Zusätzlich zeigte die Render-Produktion am 2026-08-20 eine Provider-Sättigung bei breiter/eifriger Datenbeschaffung:

- `CryptoHistoryProvider`: TwelveData/EODHD Circuit Breaker mehrfach offen;
- `CryptoSnapshotProvider`: CoinGecko `HTTP 429`.

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
UI / Research Consumer
```

Die produktive Scoring-Authority aus ADR-0087 / SC-2 C3 bleibt unverändert: der Display-Contract führt **keine** Modellwahl, kein Ranking und keine Scoring-Berechnung ein.

### 2.1 Progressive statt eager Hydration

Der Display-Contract wird **pro ausgewähltem Symbol** geladen. Es gibt in diesem Boundary bewusst keinen „hydrate all catalog assets“-Endpunkt.

Regeln:

1. Katalogabruf lädt nur Symbol, Name, Assetklasse und Metadaten.
2. Provider-I/O startet erst für das aktuell sichtbare/ausgewählte Asset.
3. UI kann besuchte Werte clientseitig cachen, darf ungeöffnete Assets aber nicht vorab massenhaft abrufen.
4. Provider Rate Limits, Circuit Breaker, Cache und Last-Known-Good bleiben in den bestehenden Adaptern/Gateways maßgeblich.
5. Fehlende Daten erzeugen `PARTIAL` oder `SOURCE_UNAVAILABLE`, niemals Bootstrap-/Demo-Ersatzwerte.

### 2.2 Assetklassen des Display-Contracts

| Assetklasse | Display-Wert | Bestehender Evidence-Pfad | Buffett/Graham |
|---|---|---|---|
| Crypto | Preis, 24h, Market Cap, Volumen soweit vorhanden | CoinGecko Snapshot; Spot-Consensus nur bei fehlendem Snapshot-Preis | `NOT_APPLICABLE` |
| Stock | Marktpreis + Fundamentals | Traditional Quote + Alpha Vantage/FMP Fundamentals | `READY/PARTIAL` |
| Forex | Marktpreis | Traditional Quote | `NOT_APPLICABLE` |
| Index | Indexwert | FMP/TwelveData Traditional Quote | `NOT_APPLICABLE` |
| Commodity | letzter verifizierter Research-Schlusswert | TwelveData Commodity Evidence | `NOT_APPLICABLE` |
| Sovereign Benchmark | Renditewert | EODHD `*.GBOND` Evidence | `NOT_APPLICABLE` |
| Einzelanleihe ohne freigegebenes Mapping | kein Wert | fail-closed | `NOT_APPLICABLE` |

Der Display-Contract bleibt multi-asset, weil er eine allgemeine Research-/Darstellungsgrenze ist. Der **Buffett Value Check ist davon getrennt stock-only**.

Der Display-Contract ist **nicht execution-price-eligible**. Er dient Darstellung, Research und erklärbarer Analyse.

### 2.3 Neuer interner Read-Endpunkt

`GET /api/registry/assets/:symbol/verified-display`

- read-only;
- per Symbol;
- liefert `verified-asset-display/1.0.0`;
- kein Batch-/Full-Catalog-Hydration-Pfad;
- keine Änderung der Semantik von `/api/registry/assets`, `/verified-score`, `/verified-scores`, `/verified-context` oder `/verified-quote`.

## 3. Aktien-Fundamentals

`server/stockFundamentals.ts` bleibt die kanonische serverseitige Fundamentals-Grenze und wird erweitert:

1. **Alpha Vantage OVERVIEW** bleibt primäre Fundamentals-Quelle.
2. **FMP Ratios/TTM** dient als bereits im System vorhandene Secondary-/Enrichment-Quelle.
3. Relevante Felder: P/E, Dividendenrendite, Nettomarge, Debt-to-Equity, EPS TTM, Free Cash Flow per Share.
4. Jedes übernommene Feld erhält Provider, Source Path und Retrieval-/Observation-Zeitstempel soweit verfügbar.
5. Kein Feld wird aus dem Aktienkurs approximiert.

Die vorhandene Provider-Inventarisierung wird deshalb so konsolidiert, dass FMP nicht nur als Index-/Market-Data-Provider, sondern auch als Fundamentals-Enrichment für den bestehenden `stockFundamentals`-Boundary dokumentiert ist. Diese Nutzung erzeugt **keine zweite Fundamentals-Authority**.

## 4. Buffett/Graham-Semantik

Der Buffett Value Check wird fachlich und in seiner **Such-/Auswahlanzeige auf Unternehmensaktien begrenzt**.

- Der Registry-Katalog darf weiterhin alle Assetklassen enthalten.
- `BuffetValueCheck` filtert daraus ausschließlich `type === 'stock'`.
- Ein global ausgewähltes Nicht-Aktien-Symbol wird nicht in den Buffett-Selector übernommen; bevorzugter Fallback ist `AAPL`, ansonsten die erste verfügbare Aktie.
- Der Backend-Display-Contract bleibt multi-asset und kann von anderen fachlich passenden UI-Consumern wiederverwendet werden.

### 4.1 Entfernte implizite Ersatzwerte

Nicht mehr zulässig:

- `EPS = price * 0.07` als stiller Fundamental-Fallback;
- `EPS = 3.5` bei fehlender Evidenz;
- Score-Fallback `7.5`;
- fehlendes Debt-to-Equity oder P/E automatisch als „bestanden“ zu behandeln;
- Crypto/Forex/Commodity/Index/Bond im Buffett-Selector oder durch dieselbe Unternehmensbewertung zu führen.

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

## 6. Provider-Budget und Background Refresh

Die Provider-Sättigung wird zusätzlich an der bestehenden Market-Data-Orchestrierungsgrenze begrenzt:

1. Der periodische Compatibility-Refresh enrichiert, scored und persistiert nur noch tatsächlich provider-beobachtete `dataSource='live'`-Zeilen.
2. Angehängte Registry-Fallback-/Katalogzeilen bleiben für Legacy-Kompatibilität verfügbar, lösen aber keine zusätzlichen Evidence-/History-/Scoring-Aufrufe aus.
3. Der CoinGecko-Top-50-Pfad des periodischen Legacy-Refreshs wird auf das konfigurierte Core-Universum begrenzt; Long-Tail-Symbole bleiben on-demand.
4. **Provider-I/O des Background Refreshs wird auf mindestens 90 Sekunden gedrosselt.** Der bestehende Runtime-Facade erzwingt die 90-Sekunden-Cadence auch dann, wenn ein Legacy-Caller früher erneut `backgroundRefresh()` aufruft. Frühe Aufrufe werden auf den nächsten zulässigen Zeitpunkt verschoben und koalesziert.
5. Der 60-Sekunden-Cache-TTL für vorhandene Marktdaten ist davon getrennt: Cache-Freshness und Provider-Polling-Cadence sind unterschiedliche Verträge.

## 7. Security, Compliance und Datenintegrität

- keine Provider-Secrets im Browser;
- keine Client-seitigen Direktaufrufe keyed Provider;
- kein Rückgriff auf `AssetRegistry`-Bootstrapwerte für verifizierte Darstellung;
- keine erfundenen Markt-/Fundamentalwerte;
- `executionPriceEligible=false` bleibt bindend;
- Provider-Mappings bleiben allow-listed bzw. provider-verifiziert;
- Einzelanleihen ohne freigegebenes Benchmark-Mapping bleiben fail-closed;
- Rate Limit des Display-Endpunkts begrenzt UI-getriebene Provider-Aufrufe;
- Scoring-/Ranking-Verträge werden durch diesen Display-Contract nicht verändert.

## 8. Wiederverwendung statt Parallelarchitektur

Wiederverwendet werden:

- `traditionalQuoteEvidence.ts`;
- `cryptoSnapshotProvider.ts`;
- `cryptoSpotConsensus.ts`;
- `commodityMarketEvidence.ts`;
- `sovereignBondProviderMapping.ts`;
- `eodhdBondEvidence.ts`;
- `stockFundamentals.ts`;
- bestehende Provider Health / Rate-Limit / Circuit-Breaker-Strukturen;
- `marketDataRuntimeFacade.ts` und `marketDataCompatibilityFacade.ts`;
- Asset Search Catalog als Metadata Authority.

Keine neue Marktdatenbank, kein neuer Scoring-Dispatcher und kein zusätzlicher externer Framework-Stack werden eingeführt.

## 9. Dokumentkorrelation und Konsolidierung

Der Contract wurde gegen die vorhandenen Architektur-/API-/Frontend-Dokumente geprüft. Folgende Dokumente benötigen denselben Änderungsstand und werden mit ADR-0097 konsolidiert:

| Dokument | Vorherige Aussage / Gap | Konsolidierte Aussage |
|---|---|---|
| `docs/architecture/DATENQUALITAETSSCHICHT.md` | historische `live/fallback`-Darstellung und bereits überholte Fundamentals-Lücke | Verified Display ist die öffentliche Evidence-Darstellungsgrenze; Bootstrap-/simulierte Werte sind keine verifizierte UI-Evidence |
| `docs/backend/BACKEND_ARCH.md` | simulierte Dynamic Fallbacks und nur `/api/market-data` in der Route Matrix | fail-closed Verified Display, metadata-only Registry, 60s Cache-TTL getrennt von 90s Provider-Refresh |
| `docs/architecture/PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md` | angehängte Registry-Fallbacks wurden als Teil des allgemeinen Enrichment-Pfads beschrieben | nur provider-beobachtete Live-Zeilen werden enrichiert/persistiert |
| `docs/architecture/api/API_INTERFACE_INVENTORY.md` | FMP primär als Index-/Market-Data-Provider beschrieben | FMP zusätzlich als bestehendes Fundamentals-Enrichment in `stockFundamentals.ts` dokumentiert |
| `docs/frontend/COMPONENT_INVENTORY.md` / `FRONTEND_ARCH.md` | Buffett als allgemeiner Graham/DCF-Calculator beschrieben | Buffett ist stock-only und konsumiert Verified Asset Display |

### Nicht zu ändern

- ADR-0087 und `SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`: Scoring bleibt Dispatcher-only; der neue Display-Contract ist ein read-only Daten-/Darstellungs-Contract und keine zweite Scoring-Architektur.
- `/api/registry/assets`: bleibt metadata-only.
- `/verified-score`, `/verified-scores`, `/verified-context`, `/verified-quote`: Semantik bleibt unverändert.

## 10. Work-Claim-Lifecycle

Der historische Claim `BUFFETT-VALUE-CHECK-NULL-PRICE-FIX-2026-08-14` gehört zu PR #259 und wird `suspended`, nicht exklusiv und archivierungsbereit markiert. Er wird durch `VERIFIED-ASSET-DISPLAY-HYDRATION-2026-08-20` ersetzt.

Es wird **kein neuer Archivpfad erfunden**, solange das Repository keinen kanonischen `.ai/work-claims/archive`-Namespace definiert. Damit bleibt die Koordinationslogik des aktuellen Work-Claim-Validators erhalten: genau ein neu hinzugefügter aktiver Claim mit `schemaVersion: 1.0.0`.

## 11. Konsequenzen

### Positiv

- Asset-Katalog bleibt integer und provenance-sicher;
- sichtbare Werte werden tatsächlich aus Evidence hydratisiert;
- Buffett zeigt ausschließlich Aktien und reale Fundamentals statt pauschaler Ersatzwerte;
- Provider-Last wächst mit Benutzerinteraktion statt Kataloggröße;
- periodisches Provider-I/O wird zusätzlich auf eine 90-Sekunden-Cadence begrenzt;
- ein einheitlicher Display-Contract kann sukzessive von weiteren fachlich passenden UI-Komponenten wiederverwendet werden.

### Einschränkungen

- „alle Assets“ bedeutet nicht „für jedes Symbol muss ein Wert erfunden werden“: fehlt ein freigegebenes Provider-Mapping oder ist ein Provider nicht verfügbar, bleibt der Status transparent `SOURCE_UNAVAILABLE`;
- CoinGecko-/TwelveData-/EODHD-/FMP-/Alpha-Vantage-Verfügbarkeit und Vertrags-/Lizenzbedingungen bleiben externe Betriebsabhängigkeiten;
- 90 Sekunden Background-Cadence ersetzt keine provider-spezifischen Rate-Limit-Budgets/Circuit Breaker; diese bleiben zusätzliche Schutzschichten.

## 12. Validierungs-Gates

Vor Merge sind mindestens zu prüfen:

- TypeScript;
- Unit-/Contract-Tests für Display Boundary, Buffett Stock-only und Null-/Fallback-Regeln;
- Unit-Test für 90-Sekunden-Background-Cadence/Koaleszierung;
- Dokument-/Registry-Konsistenz;
- Diff-Scope;
- aktueller `main`-Sync und Korrelation zu zwischenzeitlich gemergten Änderungen;
- Render-Runtime nach Deployment: keine neue 429-/Circuit-Breaker-Spitze durch Display-/Refresh-Aufrufe;
- Buffett: Nicht-Aktien erscheinen nicht in Suche/Selector; Aktien zeigen verifizierte oder transparent fehlende Fundamentals.

Kostenverursachende vollständige GitHub-CI wird gemäß Projekt-Governance erst nach PR-Erstellung und Owner-Gate gestartet.
