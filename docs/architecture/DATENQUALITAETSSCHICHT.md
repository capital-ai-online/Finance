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
**Lückenbehandlungs-Pattern** entstanden ist (verstreut über D1, S1/S2/S5, S6, H1 und diesen
Commit), macht es zu einer benannten, verbindlichen Konvention, und dokumentiert einen
konkret geschlossenen Datenpunkt-Lücke. **Versionierung von Korrekturen** ist bewusst NICHT
Bestandteil dieses Dokuments — siehe „Nicht Bestandteil" unten.

> **Current-state alignment 2026-08-20:** Abschnitt 6 richtet die heutige Datenqualitätsprojektion
> auf ADR-0032 und `SC-MD-SPT-0001` v1.1.0 aus. Die zugehörige Implementation-/Consumer-
> Revalidation liegt in `docs/adr/evidence/ADR-0032-REVALIDATION-2026-08-20-VERIFIED-DISPLAY.md`.
> Historische `fallback`-/`simulated`-Felder in den Abschnitten 1–5 sind Compatibility-/
> Entwicklungshistorie und dürfen nicht als aktuelle verifizierte UI-Evidence interpretiert werden.

---

## 1. Herkunfts-Pattern (Provenance)

Drei Felder, konsistent über die historische Codebasis verwendet:

| Feld | Werte | Bedeutung | Wo gesetzt |
|---|---|---|---|
| `dataSource` | `'live' \| 'fallback'` | Live-Marktdaten-Fetch erfolgreich vs. statischer Notfall-Snapshot (`FALLBACK_ASSETS`, historische Compatibility-Sicht) | Market-Data Compatibility Runtime |
| `scoreBasis` | `'market-data' \| 'heuristic' \| 'synthetic' \| undefined` | Womit ein historischer/Compatibility-Score tatsächlich berechnet wurde | Legacy-/Compatibility-Scoring |
| `source` (Kurshistorie) | `'live' \| 'simulated'` | Ob ältere History-Contracts echte historische Kurse oder eine simulierte Reihe liefern | `src/lib/assetRegistry.ts`, `getHistory()` |

**Historische Abdeckung nach Anlageklasse:**

| Klasse | `dataSource` (Preis) | `scoreBasis` (Score) | `source` (Historie) |
|---|---|---|---|
| Crypto (Standard) | ✅ live/fallback | ✅ `market-data` | ✅ live/simulated (CoinGecko) |
| Crypto (Meme) | ✅ live/fallback | ✅ `market-data` | ✅ live/simulated |
| DeFi | ✅ live/fallback | ✅ `market-data` | ✅ live/simulated |
| Rohstoffe | ✅ live/fallback | — (dedizierte Fachengine, siehe S6) | n/a |
| Aktien | ✅ live/fallback | ✅ `market-data`/`heuristic` (H1) | ✅ live/simulated (Stooq) |
| Forex | ✅ live/fallback | ✅ `market-data`/`heuristic` (H1) | ✅ live/simulated (Stooq, seit H1) |
| Indizes | ✅ live/fallback (seit J1-Folge, FMP) | ✅ `market-data`/`heuristic` | ✅ live (FMP, `server/fmpIndices.ts`) — schrittweise befüllt, rate-limit-bewusst |
| Anleihen | ⚠️ historische Compatibility-Zeile `fallback` | historischer `heuristic`-Pfad | siehe Nachtrag Abschnitt 5 / heutige Sovereign-Evidence |

**Nachtrag (J1-Folge, 2026-08-01):** die Indizes-Lücke unten wurde geschlossen, nachdem der
Nutzer einen eigenen FMP-API-Key bereitgestellt hat (`FMP_API_KEY`, `server/fmpIndices.ts`).
FMPs Batch-Quote-Endpunkte erfordern einen Ultimate/Enterprise-Plan (nicht vorhanden) — Quotes
und Historie werden daher einzeln je Symbol mit Cache + globalem Cooldown abgerufen (identisches
Muster wie `server/stockFundamentals.ts`, H1). Die damalige Formulierung eines Aufbaus „über
mehrere 60s-Zyklen“ beschreibt den historischen Runtime-Stand; die aktuelle Provider-Polling-
Cadence wird in Abschnitt 6 präzisiert.

## 2. Lückenbehandlung (Gap Handling)

`renormalizeAndScore()` (`src/services/realMarketSignals.ts`) ist die kanonische
Lückenbehandlungs-Funktion für die dort angebundenen Faktorpfade: fehlt ein Eingangsfaktor für ein
Symbol (keine reale Datenquelle), wird er aus der gewichteten Summe ausgeschlossen und sein
Gewichtsanteil proportional auf die vorhandenen Faktoren umgelegt — **niemals geschätzt oder mit
einem Platzhalterwert gefüllt**.

Jeder Aufruf liefert zusätzlich `usedFactors`/`missingFactors` zurück — die Lücke ist damit nicht
nur behandelt, sondern auch sichtbar. Für aktuelle produktive Modellwahl/Scoring bleibt
ADR-0087 / SC-2 C3 maßgeblich. Die ADR-0032-Revalidation verändert diese Authority nicht.

## 3. Geschlossene Lücke: das `pattern`-Feld

**Befund.** `getAssetPatternForSymbol()` wies historisch jedem Symbol einen benannten
Chart-Pattern zu — teilweise hartkodiert, teilweise hashbasiert. Keine dieser Zuweisungen basierte
auf echter Mustererkennung. Das Feld wurde ohne ausreichende Herkunftskennzeichnung an Nutzer
ausgeliefert.

**Fix.** Das an Nutzer ausgelieferte `pattern`-/Trend-Feld wird nur aus echter Kurshistorie
abgeleitet oder bleibt ohne echte History-Evidence leer. Historische interne Heuristikbausteine
sind keine verifizierte UI-Evidence.

## 4. Bekannte, noch offene Lücken (historische Liste)

Diese Auflistung wird zur Traceability erhalten; spätere Korrekturen sind markiert:

- ~~**News-Sentiment** (`src/features/news/newsRoutes.ts`, `classifyNewsSentiment()`): eine
  deterministische Schlüsselwort-Heuristik ohne Kennzeichnung.~~ **Behoben 2026-08-15** durch
  `sentimentBasis: 'heuristic'`.
- ~~**H1-Fundamentaldaten:** Rohwerte ohne durchgereichte Provenance-Zeitstempel.~~ **Überholt / geschlossen.**
  `server/stockFundamentals.ts` führt `FinancialFieldProvenance[]`; der ADR-0032-
  Revalidation-Pfad nutzt diese Provenance für die direkte verifizierte Display-Hydration.
- **`CryptoEnterpriseEvaluator.tsx`:** historischer Befund zu hartkodierten Fallback-Werten.
  Falls ein entsprechender Legacy-Pfad noch existiert, bleibt er ein separater Remediation-Scope;
  ADR-0032 und SC-MD-SPT-0001 autorisieren keine solchen Fallbacks.

## 5. Nachtrag 2026-08-15 — P2-1 Bestandsaufnahme deckt zwei veraltete Aussagen auf

Im Rahmen der Roadmap-Priorität P2-1 (Datenqualitätsmetriken) wurde eine vollständige read-only
Bestandsaufnahme der Provenance-/Lineage-/Provider-Health-Infrastruktur durchgeführt:
`docs/evidence/p2-1/P2_1_SA_P07_DATA_QUALITY_LINEAGE_INVENTORY.md`. Zwei Aussagen dieses Dokuments
wurden dadurch als veraltet identifiziert:

- **Abschnitt 1, Anleihen-Zeile:** „Historie ❌ nicht abgedeckt" ist überholt. `src/services/
  eodhdBondEvidence.ts` liefert seit ADR-0033 real evidenzbasierte Rendite-Historie
  (EODHD `*.GBOND`); Einzelanleihen bleiben ohne freigegebenes Mapping nicht score-/displayfähig.
- **Abschnitt 4, H1-Fundamentaldaten-Zeitstempel:** überholt. `server/stockFundamentals.ts`
  exportiert `FinancialFieldProvenance[]` je Fundamentaldaten-Feld inklusive
  `retrievedAt`/`observedAt`.

## 6. Current-State Alignment 2026-08-20 — ADR-0032 Revalidation / SC-MD-SPT

ADR-0032 trennt bereits Katalog und verifizierte Market Evidence. Die Revalidation vom 2026-08-20
schließt die Consumer-/Darstellungslücke, ohne eine zweite Architekturentscheidung einzuführen.

### 6.1 Drei getrennte Ebenen

```text
Asset Catalog (metadata-only)
        |
        v
Verified Observation / Display Evidence
        |
        v
UI / Research Consumer

Canonical Scoring bleibt separat unter ADR-0087 / ScoringDispatcher.
```

- `GET /api/registry/assets` ist **Katalog-/Metadata-Quelle** und darf ungeprüfte Bootstrap-
  Zahlen nicht als verifizierte Marktwerte freigeben.
- `GET /api/registry/assets/:symbol/verified-display` liefert den read-only Contract
  `verified-asset-display/1.0.0` mit Wert, Provider, Evidence IDs, Zeitstempeln und Status.
- Fehlende Daten bleiben `PARTIAL` oder `SOURCE_UNAVAILABLE`; fachlich unpassende Metriken werden
  `NOT_APPLICABLE` statt mit Ersatzwerten gefüllt.
- Der Display-Contract ist `executionPriceEligible=false`.
- Für Consumer mit eigenem Feature-/Quota-Contract liegt das Entitlement-Gate vor kostenrelevantem
  Provider-I/O; Buffett folgt ADR-0034.

### 6.2 Fundamentals

`server/stockFundamentals.ts` bleibt die bestehende Fundamentals-Grenze. Alpha Vantage ist der
primäre Fundamentals-Pfad; das bereits integrierte FMP kann als bounded Secondary-/Enrichment-
Quelle für vorhandene Aktien-Fundamental-Felder genutzt werden. Feld-Provenance bleibt erhalten.

### 6.3 Buffett Value Check

Der Buffett/Graham-Consumer ist **stock-only**. Seine Such-/Auswahlliste enthält ausschließlich
Aktien. Ein global ausgewähltes Crypto-/Forex-/Commodity-/Index-/Bond-Symbol wird nicht in die
Buffett-Auswahl übernommen. Synthetic EPS-/Score-/„fehlende Kennzahl = PASS“-Fallbacks sind nicht
zulässig. Die kanonische Sub-Chain in SC-MD-SPT-0001 verlangt zusätzlich die serverseitige
ADR-0034-Autorisierung vor der Verified-Display-Hydration.

### 6.4 Background Provider Refresh

Cache-Freshness und Provider-Polling sind getrennte Verträge:

- Compatibility-Cache-TTL: weiterhin 60 Sekunden;
- tatsächliches periodisches Provider-I/O: **mindestens 90 Sekunden**;
- frühe Background-Aufrufe werden verschoben und koalesziert;
- auch ein zwischenzeitlicher Foreground-Provider-Refresh verschiebt den nächsten zulässigen
  Background-Zeitpunkt;
- nur provider-beobachtete `dataSource='live'`-Zeilen werden im periodischen Compatibility-Pfad
  enrichiert/persistiert; angehängte Registry-Fallbackzeilen lösen kein zusätzliches
  Evidence-/History-/Scoring-Fan-out aus.

Diese Regeln sind Runtime-Implementierung unter ADR-0041 / ESS-0016 und ADR-0083 / ADR-0075;
SC-MD-SPT-0001 ordnet sie in die homogene Wertschöpfungskette ein.

Damit supersediert Abschnitt 6 jede historische Lesart der Abschnitte 1–5, nach der
`fallback`/`simulated` als verifizierte öffentliche Finanzdaten oder 60 Sekunden als zwingende
Provider-Polling-Cadence verstanden werden könnten.

## Nicht Bestandteil dieses Dokuments

- **Versionierung von Korrekturen.** Eine echte Korrektur-Historie existiert nicht als eigener
  revisionsfähiger Contract. Das bleibt ein eigenständiges Vorhaben.
- Vollständige Migration aller Legacy-Consumer. SC-MD-SPT-0001 und die ADR-0032-Revalidation
  definieren das Muster, autorisieren aber kein ungezieltes Refactoring außerhalb des jeweiligen
  Arbeitspakets.

## Verwandte Dokumente

- `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`
- `docs/adr/resolved/ADR-0032-asset-catalog-market-evidence-separation.md`
- `docs/adr/evidence/ADR-0032-REVALIDATION-2026-08-20-VERIFIED-DISPLAY.md`
- `docs/adr/ADR-0034-central-subscription-entitlements-and-buffett-access.md`
- `docs/adr/ADR-0041-enterprise-market-data-provider-and-mcp-architecture.md`
- `docs/adr/ADR-0083-server-runtime-architecture-consolidation.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/evidence/sc-md/SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`
- `docs/backend/BACKEND_ARCH.md`
- `docs/architecture/PHASE-3.4.6-MARKET-DATA-COMPATIBILITY-FACADE.md`
- `docs/architecture/api/API_INTERFACE_INVENTORY.md`
- `docs/DATENSCHUTZ_PROTOKOLL.md` — No-Demo-Data-Policy
- `src/services/realMarketSignals.ts`
- `server/stockFundamentals.ts`
- `src/services/verifiedAssetDisplay.ts`
