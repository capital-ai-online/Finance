# CAPITAL-AI Datenqualitätsschicht

## Document ID

ARCH-DATENQ-0001

## Bezug

ARCH-AUDIT-0002 (Enterprise FinTech Architecture Audit), Kapitel 10.1 („Datenqualitätsschicht"
im Architekturvergleich mit Referenzplattformen) und Kapitel 14.6 (12-Monats-Roadmap, J1
„Datenqualitätsschicht mit Herkunft, Versionierung und Lückenbehandlung für alle Datenpunkte").

## Version

1.0.0

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

---

## 1. Herkunfts-Pattern (Provenance)

Drei Felder, konsistent über die gesamte Codebasis verwendet:

| Feld | Werte | Bedeutung | Wo gesetzt |
|---|---|---|---|
| `dataSource` | `'live' \| 'fallback'` | Live-Marktdaten-Fetch erfolgreich vs. statischer Notfall-Snapshot (`FALLBACK_ASSETS`, `server.ts`) | `server.ts`, `fetchLiveMarketData()` |
| `scoreBasis` | `'market-data' \| 'heuristic' \| 'synthetic' \| undefined` | Womit der Score tatsächlich berechnet wurde — **outcome-basiert seit H1**, nicht nur typbasiert (fällt ein Aktien/Forex-Symbol ohne echte Datenquelle auf die Heuristik zurück, bleibt `scoreBasis` ehrlich `'heuristic'`, siehe `calculateAssetScore()`) | `server.ts`, `calculateAssetScore()` |
| `source` (Kurshistorie) | `'live' \| 'simulated'` | Ob `assetRegistry.getHistory()` echte historische Kurse (CoinGecko/Stooq) oder eine simulierte Reihe liefert | `src/lib/assetRegistry.ts`, `getHistory()` |

**Abdeckung nach Anlageklasse:**

| Klasse | `dataSource` (Preis) | `scoreBasis` (Score) | `source` (Historie) |
|---|---|---|---|
| Crypto (Standard) | ✅ live/fallback | ✅ `market-data` | ✅ live/simulated (CoinGecko) |
| Crypto (Meme) | ✅ live/fallback | ✅ `market-data` | ✅ live/simulated |
| DeFi | ✅ live/fallback | ✅ `market-data` | ✅ live/simulated |
| Rohstoffe | ✅ live/fallback | — (dedizierte Fachengine, siehe S6) | n/a |
| Aktien | ✅ live/fallback | ✅ `market-data`/`heuristic` (H1) | ✅ live/simulated (Stooq) |
| Forex | ✅ live/fallback | ✅ `market-data`/`heuristic` (H1) | ✅ live/simulated (Stooq, seit H1) |
| Indizes | ⚠️ **immer `fallback`** — keine Live-Kursquelle vorhanden (dokumentierte Lücke, siehe H1) | `heuristic` | ❌ nicht abgedeckt |
| Anleihen | ⚠️ **immer `fallback`** | `heuristic` | ❌ nicht abgedeckt |

Die Indizes/Anleihen-Lücke ist eine fehlende **Datenanbindung** (keine Live-Kursquelle
angebunden), keine fehlende Herkunftskennzeichnung — sie ist bereits ehrlich als `fallback`
markiert, nicht stillschweigend verborgen.

## 2. Lückenbehandlung (Gap Handling)

`renormalizeAndScore()` (`src/services/realMarketSignals.ts`) ist die kanonische
Lückenbehandlungs-Funktion: fehlt ein Eingangsfaktor für ein Symbol (keine reale Datenquelle),
wird er aus der gewichteten Summe ausgeschlossen und sein Gewichtsanteil proportional auf die
vorhandenen Faktoren umgelegt — **niemals geschätzt oder mit einem Platzhalterwert gefüllt**.
Verwendet von:

- `CryptoScoringService.scoreCrypto()` (S1/S2/S5)
- `TraditionalAssetScoringService.scoreTraditionalAsset()` (H1)

Jeder Aufruf liefert zusätzlich `usedFactors`/`missingFactors` zurück — die Lücke ist damit
nicht nur behandelt, sondern auch **sichtbar** (z. B. in den `reasoning[]`-Texten der
Scoring-Ergebnisse).

## 3. Geschlossene Lücke: das `pattern`-Feld (dieser Commit)

**Befund.** `getAssetPatternForSymbol()` (`server.ts`) wies **jedem** Symbol einen benannten
Chart-Pattern zu ("Bullish Engulfing", "Cup & Handle" usw.) — für sieben Symbole hartkodiert
(unabhängig vom tatsächlichen aktuellen Kursverlauf: BTC war *immer* "Bullish Engulfing"),
für alle anderen über einen Zeichen-Hash-Fallback. Keine dieser Zuweisungen basierte auf
echter Mustererkennung. Das Feld wurde ohne jede Herkunftskennzeichnung an Nutzer ausgeliefert
und in `ComplianceExporter.tsx` als „Technisches Muster" sowie in
`CryptoEnterpriseEvaluator.tsx` direkt angezeigt.

**Fix.** Das an Nutzer ausgelieferte `pattern`-Feld wird jetzt über
`computeDisplayTrendLabel()` (`server.ts`) berechnet: bei echter Kurshistorie
(`assetRegistry.getHistory()`, `source === 'live'`) eine reale, aus `scoreTrend()` abgeleitete
Trend-Einordnung (`classifyTrendLabel()`, `src/services/realMarketSignals.ts`) —
„Aufwärtstrend" / „Abwärtstrend" / „Seitwärtsbewegung". Ohne echte Historie: `undefined` statt
eines erfundenen Namens. Die UI-Fallback-Texte ("Konsolidierung", "Muster analysiert") wurden
durch eine ehrliche Formulierung ersetzt.

Die alte `getAssetPatternForSymbol()`-Funktion bleibt unverändert als **interner** Eingabewert
für den bestehenden Heuristik-Score-Pfad in `calculateAssetScore()` erhalten (Indizes/Anleihen
und Aktien/Forex ohne echte Datenquelle) — dort ist sie ein dokumentierter, bewusst als
`heuristic` gekennzeichneter Scoring-Baustein, kein an Nutzer ausgelieferter Datenpunkt. Eine
Änderung dort hätte das Regressionsrisiko unnötig erhöht, ohne den eigentlichen Befund
(unmarkiert ausgelieferte erfundene Daten) zu adressieren.

## 4. Bekannte, noch offene Lücken (nicht in diesem Commit behoben)

Diese Auflistung ist bewusst Teil des Dokuments statt stillschweigend ausgelassen zu werden:

- **News-Sentiment** (`src/features/news/newsRoutes.ts`, `classifyNewsSentiment()`): eine
  deterministische Schlüsselwort-Heuristik, keine NLP-/KI-Analyse. Die API-Antwort kennzeichnet
  aktuell nicht, dass `sentiment` heuristisch statt gemessen ist.
- **H1-Fundamentaldaten** (`server/stockFundamentals.ts`): `peRatio`/`dividendYieldPct`/
  `profitMarginPct` fließen mit einem internen `fetchedAt`-Zeitstempel in den Score ein, dieser
  Zeitstempel wird aber nicht bis zu einer eventuellen direkten Anzeige der Rohwerte
  durchgereicht (aktuell nur indirekt über den Score sichtbar).
- **`CryptoEnterpriseEvaluator.tsx`**: `score`/`expectedReturn`/`volatility` haben hartkodierte
  Fallback-Werte (`8.2`, `15`, `50`), falls `/api/registry/assets/:symbol` keine Daten liefert
  — ein eigenständiger, vom `pattern`-Fund unabhängiger Befund, bei der Durchsicht dieses
  Datenpunkts entdeckt. Nicht Bestandteil dieses Commits.

## Nicht Bestandteil dieses Dokuments

- **Versionierung von Korrekturen.** Eine echte Korrektur-Historie (z. B. "scoreBasis für AAPL
  wechselte am 2026-08-01 von `heuristic` zu `market-data`, protokolliert statt nur
  überschrieben") existiert nicht. `score_snapshots` (N1) erfasst tägliche Score-/Preis-
  Snapshots und liefert damit implizit eine Zeitreihe, aber keine explizite
  Korrektur-Protokollierung. Diese Scope-Entscheidung wurde bewusst getroffen (siehe
  AskUserQuestion in dieser Session) — eine echte Versionierungsinfrastruktur ist ein
  eigenständiges, größeres Vorhaben.
- **Behebung der in Abschnitt 4 gelisteten offenen Lücken.**

## Verwandte Dokumente

- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` (ARCH-AUDIT-0002), Kapitel 10.1, 14.6
- `docs/DATENSCHUTZ_PROTOKOLL.md` — No-Demo-Data-Policy
- `src/services/realMarketSignals.ts` — Lückenbehandlungs- und Trend-Klassifikationsprimitive
- `server/stockFundamentals.ts`, `src/services/traditionalAssetScoring.ts` — H1
