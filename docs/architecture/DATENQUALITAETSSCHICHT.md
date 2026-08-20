# CAPITAL-AI Datenqualitätsschicht

## Document ID

ARCH-DATENQ-0001

## Bezug

ARCH-AUDIT-0002 (Enterprise FinTech Architecture Audit), Kapitel 10.1 („Datenqualitätsschicht"
im Architekturvergleich mit Referenzplattformen) und Kapitel 14.6 (12-Monats-Roadmap, J1
„Datenqualitätsschicht mit Herkunft, Versionierung und Lückenbehandlung für alle Datenpunkte").

## Version

1.1.0

## Status

Aktiv

## Ausgangsbefund

> Bloomberg, FactSet, Refinitiv, S&P Capital IQ und Kaiko trennen durchgängig zwischen
> Datenerfassung, Datenqualitätssicherung und Auslieferung. Kennzeichnend sind eine
> Herkunftsangabe je Datenpunkt, Versionierung von Korrekturen und ein dokumentierter Umgang
> mit Lücken. CAPITAL-AI erfasst Daten, besitzt aber keine Datenqualitätsschicht.

Dieses Dokument schreibt fest, was seit diesem Befund bereits als **Herkunfts-** und
**Lückenbehandlungs-Pattern** entstanden ist, macht es zu einer benannten Konvention und hält
historische Entwicklungsschritte nachvollziehbar. Seit 2026-08-20 ergänzt ADR-0097 diese
Konvention um die kanonische Trennung zwischen metadata-only Asset-Katalog und verifizierter
Display-Evidence. **Versionierung von Korrekturen** ist weiterhin nicht Bestandteil dieses
Dokuments — siehe „Nicht Bestandteil" unten.

---

## 1. Herkunfts-Pattern (historische Compatibility-Sicht)

Die nachfolgenden Felder bleiben als historische bzw. Legacy-Compatibility-Sicht relevant:

| Feld | Werte | Bedeutung | Wo gesetzt |
|---|---|---|---|
| `dataSource` | `'live' \| 'fallback'` | Provider-beobachtete Zeile vs. Compatibility-/Registry-Fallback | Market-Data-Runtime |
| `scoreBasis` | `'market-data' \| 'heuristic' \| 'synthetic' \| undefined` | Herkunft historischer/Compatibility-Scorepfade | Legacy-/Compatibility-Code |
| `source` (Kurshistorie) | `'live' \| 'simulated'` | Herkunft älterer History-Contracts | `src/lib/assetRegistry.ts` |

**Wichtig seit ADR-0097:** `fallback` oder `simulated` ist **keine verifizierte öffentliche
Markt-Evidence**. Diese Werte dürfen nicht allein aufgrund ihrer Präsenz als aktuelle Preis-,
Fundamental- oder Scoringdaten an einen produktiven UI-Consumer ausgeliefert werden.

**Historische Abdeckung nach Anlageklasse:**

| Klasse | Compatibility-Preis | Score-/Evidence-Pfad | Historische Sicht |
|---|---|---|---|
| Crypto | live/fallback | kanonische Crypto-Evidence/Dispatcher | Legacy-History kann `simulated` kennen; Verified Display nicht |
| Aktien | live/fallback | Traditional Evidence/Dispatcher + Fundamentals | Verified Display verlangt Provider-Evidence |
| Forex | live/fallback | Traditional Evidence/Dispatcher | Verified Display verlangt Provider-Evidence |
| Indizes | live/fallback | FMP/Traditional Evidence/Dispatcher | provider-/mappingabhängig |
| Rohstoffe | live/fallback | Commodity Evidence/Dispatcher | provider-/mappingabhängig |
| Sovereign Benchmarks | Rendite-Evidence | Sovereign Evidence/Dispatcher | Einzelanleihen ohne Mapping fail-closed |

Die frühere Aussage, ein kompletter Live-Zustand solle sich über „mehrere 60s-Zyklen“ aufbauen,
ist seit ADR-0097 zu präzisieren: **Cache-TTL und Provider-Polling-Cadence sind getrennt.** Der
Compatibility-Cache kann weiterhin 60 Sekunden frisch sein; periodisches Provider-I/O wird
mindestens auf eine 90-Sekunden-Cadence begrenzt und auf tatsächlich provider-beobachtete Zeilen
beschränkt.

## 2. Lückenbehandlung (Gap Handling)

`renormalizeAndScore()` bzw. die kanonischen Domain-/Dispatcher-Verträge behandeln fehlende
Scoringfaktoren fail-closed bzw. durch dokumentierte Gewichtungsnormalisierung. Für die
Darstellung gilt zusätzlich:

- fehlende Markt-/Fundamental-Evidence wird nicht geschätzt;
- metadata-only Katalogwerte werden nicht als Marktwerte interpretiert;
- `PARTIAL` und `SOURCE_UNAVAILABLE` sind zulässige Zustände;
- `NOT_APPLICABLE` trennt fachlich nicht anwendbare Kennzahlen von fehlender Datenquelle;
- Bootstrap-, Demo- oder simulierte Werte dürfen keine verifizierte Display-Evidence ersetzen.

Scoring und Display bleiben getrennte Verträge. ADR-0087 / SC-2 C3 bleibt die Authority für
produktive Modellwahl und Scoring; ADR-0097 definiert nur die read-only Darstellungs-/Evidence-
Grenze.

## 3. Geschlossene Lücke: das `pattern`-Feld

**Befund.** Historisch wies `getAssetPatternForSymbol()` jedem Symbol einen benannten
Chart-Pattern zu, teilweise hartkodiert oder hashbasiert. Diese Zuweisungen waren keine echte
Mustererkennung.

**Fix.** Nutzerseitig ausgelieferte Trend-/Pattern-Darstellung verwendet nur reale History-
Evidence oder bleibt leer. Historische interne Heuristikpfade dürfen nicht als verifizierte
Display-Evidence interpretiert werden.

## 4. Bekannte und historische Lücken

- ~~**News-Sentiment:** heuristische Klassifikation ohne Kennzeichnung.~~ **Behoben 2026-08-15**
  durch `sentimentBasis: 'heuristic'`.
- ~~**H1-Fundamentaldaten-Provenance:** Rohwerte ohne durchgereichte Zeitstempel.~~ **Überholt.**
  `server/stockFundamentals.ts` führt feldbezogene `FinancialFieldProvenance[]`; ADR-0097 macht
  diese Daten über den Verified-Display-Contract direkt nutzbar.
- **`CryptoEnterpriseEvaluator.tsx`:** historischer Befund zu hartkodierten Fallback-Werten bleibt
  als separater Scope bestehen, sofern der aktuelle Codepfad ihn noch enthält. ADR-0097 autorisiert
  ausdrücklich keine solchen Fallbacks.

## 5. Nachtrag 2026-08-15 — P2-1 Bestandsaufnahme

Die P2-1-Bestandsaufnahme
`docs/evidence/p2-1/P2_1_SA_P07_DATA_QUALITY_LINEAGE_INVENTORY.md` hat historische Aussagen
korrigiert:

- Sovereign Benchmark Evidence existiert über `src/services/eodhdBondEvidence.ts` und die
  freigegebene Sovereign-Scoring-Grenze; Einzelanleihen ohne Mapping bleiben gesperrt.
- `server/stockFundamentals.ts` besitzt bereits feldbezogene Provenance mit `retrievedAt` und
  `observedAt`.
- News-Sentiment wird als heuristisch gekennzeichnet.

## 6. Nachtrag 2026-08-20 — Verified Asset Display als kanonische UI-Evidence-Grenze

ADR-0097 schließt die zentrale Vertragslücke zwischen Asset-Katalog und sichtbaren Finanzwerten.

### 6.1 Katalog vs. Observation

`GET /api/registry/assets` ist ein **Asset-Katalog**. Er darf Identität, Name, Klasse, Mapping-
und Contract-Metadaten liefern, aber Bootstrap-/Compatibility-Zahlen werden nicht automatisch als
verifizierte Finanzbeobachtung freigegeben.

Für per-Symbol-Darstellung gilt:

`GET /api/registry/assets/:symbol/verified-display`

mit Contract `verified-asset-display/1.0.0`.

Der Contract liefert, soweit fachlich verfügbar:

- Wert + Einheit;
- Provider;
- Evidence IDs;
- `observedAt` / `retrievedAt`;
- `READY | PARTIAL | SOURCE_UNAVAILABLE | NOT_APPLICABLE`;
- Aktien-Fundamentals mit Feld-Provenance;
- `executionPriceEligible=false`.

### 6.2 Aktien-Fundamentals

`server/stockFundamentals.ts` bleibt die kanonische Fundamentals-Grenze. Alpha Vantage bleibt
primäre Quelle; der bereits vorhandene FMP-Provider kann als Secondary-/Enrichment-Quelle für
P/E, EPS TTM, Debt-to-Equity, Dividendenrendite, Nettomarge und Free Cash Flow pro Aktie genutzt
werden. Es entsteht keine zweite Fundamentals-Authority.

### 6.3 Buffett Value Check

Der Buffett/Graham-Consumer ist fachlich **stock-only**. Seine Suche enthält nur Aktien; ein
extern/global ausgewähltes Nicht-Aktien-Symbol wird nicht als Buffett-Asset übernommen. Damit
werden Crypto, Forex, Rohstoffe, Indizes und Bonds nicht mehr in eine Unternehmensbewertung
gezogen.

### 6.4 Provider-Budget

Der Compatibility-Refresh enrichiert und persistiert nur provider-beobachtete `dataSource='live'`
Zeilen. Registry-Fallbackzeilen lösen kein zusätzliches Scoring-/History-/Fundamental-Fan-out aus.
Der Background-Provider-Refresh wird über die Runtime-Facade auf **90 Sekunden** gedrosselt;
frühere Aufrufe werden auf den nächsten zulässigen Zeitpunkt verschoben und koalesziert.

## Nicht Bestandteil dieses Dokuments

- **Versionierung von Korrekturen.** Eine explizite Korrektur-Historie über einzelne
  Datenänderungen bleibt ein eigenständiges Vorhaben.
- Vollständige Migration aller Legacy-Consumer von `/api/market-data`; ADR-0097 definiert das
  Muster, autorisiert aber kein ungezieltes Refactoring außerhalb seines Scopes.

## Verwandte Dokumente

- `docs/adr/ADR-0097-verified-asset-display-progressive-hydration.md`
- `docs/evidence/sc-md/SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`
- `docs/backend/BACKEND_ARCH.md`
- `docs/architecture/PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md`
- `docs/architecture/api/API_INTERFACE_INVENTORY.md`
- `docs/DATENSCHUTZ_PROTOKOLL.md` — No-Demo-Data-Policy
- `server/stockFundamentals.ts`
- `src/services/verifiedAssetDisplay.ts`
