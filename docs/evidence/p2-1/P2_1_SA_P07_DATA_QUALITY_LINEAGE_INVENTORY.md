# P2-1 — Datenqualitätsmetriken: Read-only Bestandsaufnahme (SA-P07 Vorstufe)

Status: **READ-ONLY INVENTORY COMPLETE** — reine Bestandsaufnahme, keine Code-Änderung, kein
Provider Quality Contract implementiert. P2-1-Exit-Kriterium („feldbezogene Qualität/Lineage
messbar", `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` Abschnitt 6) ist **weiterhin nicht
erreicht** — diese Bestandsaufnahme ist die geforderte Vorstufe dazu.
Datum: 2026-08-15
Roadmap-Bindung: P2-1 (Datenqualitätsmetriken), Bindung `DOC/M5/M9`, Systemadministrator-Prototyp
`SA-P07 Provider Quality Contract`
Authority: `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` Abschnitt 6
Executor: Claude-Code-Sitzung (Owner-Anweisung „starte mit p2-1", AskUserQuestion-Antwort
„Read-only Bestandsaufnahme zuerst")

## 0. Ausgangslage

`docs/architecture/DATENQUALITAETSSCHICHT.md` dokumentiert ein einfaches, älteres
Provenance-Muster (`dataSource: 'live'|'fallback'`, `scoreBasis: 'market-data'|'heuristic'|
'synthetic'`, `source: 'live'|'simulated'` für Historie). Vor dieser Bestandsaufnahme war nicht
bekannt, dass daneben bereits eine deutlich umfangreichere, neuere Provenance-/Lineage-/
Provider-Health-Infrastruktur existiert, die in keinem der bestehenden Architekturdokumente
zusammenhängend beschrieben ist. Diese Sitzung liest den tatsächlichen Code (direkt + über einen
Recherche-Agenten, Ergebnisse stichprobenartig gegengeprüft) und legt fest, was real vorhanden ist,
bevor irgendein neuer Code für SA-P07 geschrieben wird.

## 1. Kernprimitive

| Primitiv | Datei:Zeilen | Form |
|---|---|---|
| `FinancialFieldProvenance` / `TraditionalScoringLineage` / `buildFinancialEvidenceId()` / `buildTraditionalScoringLineage()` | `src/types/financialProvenance.ts:1-58` | Je Feld: `field, provider (Stooq\|AlphaVantage\|FMP\|TwelveData\|EODHD), sourcePath, retrievedAt, observedAt?, unit?, value?, derivedFrom?`. `FinancialAssetClass` ist typseitig auf `'stock'\|'forex'\|'index'` beschränkt — Krypto/Anleihen/Rohstoffe sind in diesem Typ nicht repräsentierbar. |
| `ProviderHealthRecord` / `recordProviderHealth()` / `getProviderHealth()` | `src/platform/Supervisor/providerHealth.ts:1-73` | Schlüssel `provider:capability`, In-Memory-`Map` (Prozesslaufzeit, nicht persistent). Felder: `state (healthy\|degraded\|unavailable), diagnosticCode?, payloadUsable?, lastSuccessAt, lastFailureAt, lastObservedAt, consecutiveFailures, cacheMode?, circuitOpenUntil?, message?`. |
| `VerifiedFieldProvenance` / `ScoringEvidenceRef` / `CanonicalScoreResult` / `evaluateDataQualityGate()` | `src/services/cryptoSnapshotProvider.ts`, `src/types/scoringIntegrity.ts`, `src/services/scoringIntegrity.ts` | Strukturell ähnlich zu Familie A, aber ein **eigener, unabhängiger Typ** — `provider` ist auf `'CoinGecko'` beschränkt, kein `unit`/`derivedFrom`. Bindet Scoring über ein binäres READY/nicht-READY-Gate (Coverage ≥ 0.5, Mindest-Historienpunkte, Max-Alter). |

## 2. Abdeckung nach Anlageklasse/Domäne

### 2.1 Aktien
| Mechanismus | Provenance | Provider Health | Lineage/Evidence-ID | Lückenbehandlung | Datei:Zeile |
|---|---|---|---|---|---|
| Quote (kanonisch) | eigener `VerifiedTraditionalQuote`-Typ, nicht `FinancialFieldProvenance` | `TwelveData:traditional-quote` | Gateway-generierte `evidenceId` | fail-open zu `SOURCE_UNAVAILABLE`/`STALE_EVIDENCE` | `src/services/traditionalQuoteEvidence.ts:79-128` |
| Quote (Schatten, Alpaca) | eigener `AlpacaShadowObservation`-Typ | `Alpaca:traditional-quote-shadow` | handgebautes Format `quote:alpaca:{feed}:{symbol}:{ts}` | Schatten-only, überschreibt nie kanonischen Preis/Score | `src/services/alpacaShadowProvider.ts:1-205` |
| Technische Faktoren (Trend/Momentum/Breakout/Vol/RSI) | `FinancialFieldProvenance[]` | `Stooq:stock-history` | `buildTraditionalScoringLineage()` | `renormalizeAndScore()` — fehlender Faktor ausgeschlossen, Gewicht proportional umgelegt | `src/services/traditionalAssetScoring.ts:87-277` |
| Technische Faktoren, Fallback | `FinancialFieldProvenance[]`, `provider: TwelveData\|EODHD` | `TwelveData:stock-history`, `EODHD:stock-history` | dieselbe Lineage | Rangfolge-Fallback über mehrere Provider | `src/services/traditionalHistoryFallback.ts:1-53` |
| Fundamentaldaten (`peRatio`, `dividendYieldPct`, `profitMarginPct`) | `FinancialFieldProvenance[]` je Feld, `observedAt` aus `LatestQuarter` | `AlphaVantage:stock-fundamentals` | speist dieselbe Lineage | Feld wird bei Nicht-Finite einfach weggelassen, kein Fallback-Wert | `server/stockFundamentals.ts:63-101` |

**Korrektur gegenüber `DATENQUALITAETSSCHICHT.md` §4:** der dort als offen gelistete Punkt „H1-Fundamentaldaten: `fetchedAt`-Zeitstempel wird nicht bis zu einer direkten Anzeige der Rohwerte durchgereicht" ist **überholt** — `server/stockFundamentals.ts:72-89` liefert bereits ein vollständiges, exportiertes `FinancialFieldProvenance[]` je Feld inkl. `retrievedAt`/`observedAt`.

### 2.2 Forex
Gleiche Mechanik wie Aktien, ohne Fundamentaldaten. Gleicher `FinancialFieldProvenance`/Lineage-Pfad (`traditionalAssetScoring.ts`, `traditionalHistoryFallback.ts`), kein Alpaca-Schatten (aktienspezifisch).

### 2.3 Indizes
| Mechanismus | Provenance | Provider Health | Lineage/Evidence-ID | Lückenbehandlung | Datei:Zeile |
|---|---|---|---|---|---|
| Quote | FMP über Gateway | `FMP:index-quote` | Gateway-generiert | `SOURCE_UNAVAILABLE`/`STALE_EVIDENCE`, kein erfundener Preis | `src/services/traditionalQuoteEvidence.ts:130-202` |
| Roh-Cache Quote/Historie | keine | `FMP:index-quote`, `FMP:index-history` | keine | 60s-Cooldown, Cache-TTL | `server/fmpIndices.ts:43-121` |
| Historien-Evidence (FMP primär, TwelveData Kandidat) | eigener Typ, `evidenceIds: index:fmp:{sym}:{date}` | **kein direkter `recordProviderHealth`-Aufruf in dieser Datei** (an Adapter delegiert) | eigenes Format, **abweichend** von `buildFinancialEvidenceId` | Provider-Prioritäts-Fallback, fail-closed bei Identitäts-Mismatch/Staleness | `src/services/indexMarketEvidence.ts:31-94` |
| Technische Faktoren | `FinancialFieldProvenance[]` | keine direkt | speist `buildTraditionalScoringLineage()`, Evidence-IDs als `financial:fmp:{SYM}:{field}` | `renormalizeAndScore` | `src/services/indexMarketEvidence.ts:96-118` |

**Befund:** Für dieselben zugrunde liegenden FMP/TwelveData-Indexdaten existieren **zwei unterschiedliche Evidence-ID-Formate** (`index:fmp:GSPC:2026-08-01` vs. `financial:fmp:GSPC:trend`), ohne dass etwas beide verknüpft.

### 2.4 Krypto
Läuft komplett parallel zu Familie A: `VerifiedFieldProvenance` + `ScoringEvidenceRef` + `evaluateDataQualityGate()` (`src/services/cryptoSnapshotProvider.ts`, `src/types/scoringIntegrity.ts`, `src/services/verifiedCryptoTechnicalScoring.ts:1-247`). Provider-Health-Keys: `CoinGecko:crypto-snapshot`, `{provider}:crypto-history`, `CoinAPI\|TwelveData\|EODHD:crypto-spot-price` (Konsens, `src/services/cryptoSpotConsensus.ts`), `Kraken:crypto-exchange-liquidity` (`src/services/krakenSpotMarketEvidence.ts`, kein Anschluss an `buildFinancialEvidenceId`). Gemeinsamer Nenner mit Familie A ist ausschließlich `recordProviderHealth`/`getProviderHealth`.

Besonderheit: `data_quality_risk` (`verifiedCryptoTechnicalScoring.ts:172`, hartkodiert `0.15`/`0.05` je nach `history.degraded`) fließt als **Scoring-Faktor** in den gewichteten Score ein statt als Provenance-/Health-Metadatum separat gehalten zu werden — architektonisch anders als bei Aktien/Forex/Index, wo `missingFactors`/`reasoning[]` getrennt vom eigentlichen Score bleiben.

### 2.5 Anleihen — Befund F1: Engine existiert, Routing-Tabelle weiß es nicht
| Mechanismus | Provenance | Lineage/Evidence-ID | Datei:Zeile |
|---|---|---|---|
| Rendite-Historie (EODHD `*.GBOND`) | eigener `BondEvidenceResult`, `evidenceIds: bond:eodhd:{sym}:{date}` | nicht über `buildFinancialEvidenceId` | `src/services/eodhdBondEvidence.ts:1-87` |
| Sovereign-Benchmark-Rendite-Scoring | `ScoringEvidenceRef[]`, ADR-0033-freigegebener Contract `sovereign-benchmark-yield-scoring/1.0.0` (`approvedAt: 2026-08-02`) | Passthrough `evidenceIds` | `src/services/sovereignBenchmarkEvidenceScoring.ts:1-60+`, verdrahtet in `src/features/registry/registryRoutes.ts:37,126,209` |

**Zwei Diskrepanzen, beide verifiziert:**
1. `DATENQUALITAETSSCHICHT.md:57` behauptet Anleihen-Historie sei „❌ nicht abgedeckt" — überholt, `eodhdBondEvidence.ts` liefert real evidenzbasierte Historie, ein dediziertes Scoring existiert.
2. `src/platform/Supervisor/supervisor.ts:36` — **verifiziert per direktem Read**: `bond: { engineId: 'heuristic_fallback', label: 'Kein dediziertes Anleihen-Scoring implementiert', hasDedicatedEngine: false }`. Das widerspricht der tatsächlich verdrahteten, ADR-0033-freigegebenen `sovereignBenchmarkEvidenceScoring.ts`. `getSupervisorStatus()` ist damit die aktuell einzige quasi-öffentliche „Datenqualität je Anlageklasse"-Übersicht im System und meldet für Anleihen eine falsche Aussage. **Dies ist eine Code-Zeile, keine Dokumentation — außerhalb des read-only-Scopes dieser Bestandsaufnahme; explizit als Befund markiert, nicht behoben.**

Einzel-Anleihen-Scoring ist bewusst ausgeschlossen (`individualBondScoringEligible: false`, `sovereignBenchmarkEvidenceScoring.ts:35`) — nur Benchmark-/Zinsniveau-Score, kein Instrument-Score.

### 2.6 Rohstoffe
Gleiches Muster wie Anleihen: `CommodityMarketEvidence` (`src/services/commodityMarketEvidence.ts:1-209`, `TwelveData:commodity-history`, Fuzzy-Namensauflösung mit 0.66-Schwelle, fail-closed bei Mehrdeutigkeit) → `commodityEvidenceScoring.ts` (ADR-0033, `commodity-evidence-scoring/1.0.0`, `approvedAt: 2026-08-02`), verdrahtet in `src/routes/rawMaterialsRoutes.ts:16`. Hier stimmt `supervisor.ts:32` (`hasDedicatedEngine: true`) mit dem realen Code überein — nur die Anleihen-Zeile ist falsch.

### 2.7 Makro/FRED
`MacroEvidenceSeries` (FRED: DGS2/DGS10/FEDFUNDS/CPIAUCSL; ECB EUR-Referenzkurs), `FRED:macro-series`/`ECB:macro-series`, fail-closed bei leerem/fehlerhaftem Payload (`src/services/macroRateEvidence.ts:63-144`). Zinskurven-Risikoregime (`macroRiskRegime.ts:1-153`) nutzt bewusst einen **eigenen** Capability-Key `FRED:macro-risk-regime` statt `FRED:macro-series` — dokumentierte Designentscheidung (Zeilen 44-47), damit „HTTP erfolgreich" und „Regime-Evidence nutzbar" nicht zu einem Signal verschmelzen. `executionPriceEligible: false` ist an mehreren Stellen hart typisiert — Makrodaten sind nie ein handelbarer Preis.

### 2.8 News-Sentiment — Lücke bestätigt weiterhin offen
`classifyNewsSentiment()` (`src/features/news/newsRoutes.ts:17,45`) ist eine deterministische Schlüsselwort-Heuristik. **Selbst verifiziert per Grep:** keine einzige Referenz auf `recordProviderHealth` oder `FinancialFieldProvenance` in dieser Datei. Weder alte noch neue Provenance-Generation deckt dieses Feld ab; die API kennzeichnet `sentiment` nicht als heuristisch. Einziger seit `DATENQUALITAETSSCHICHT.md` unverändert offener Punkt aus dessen Abschnitt 4.

## 3. Provider-Health-Katalog (alle beobachteten `provider:capability`-Paare)

TwelveData:traditional-quote · FMP:index-quote · FMP:index-history · Alpaca:traditional-quote-shadow
· Kraken:crypto-exchange-liquidity · Stooq:stock-history/forex-history · TwelveData:stock-history/
forex-history · EODHD:stock-history/forex-history · AlphaVantage:stock-fundamentals ·
CoinGecko:crypto-snapshot · {provider}:crypto-history · CoinAPI/TwelveData/EODHD:crypto-spot-price ·
FRED:macro-series · ECB:macro-series · FRED:macro-risk-regime · EODHD:bond-history ·
TwelveData:commodity-history.

Alle Datensätze leben in einer einzigen In-Prozess-`Map` (`providerHealth.ts:27`) — keine
Persistenz, keine Aggregation über mehrere Instanzen; ein Neustart verliert die Historie.
`consecutiveFailures` wird nur bei `state:'healthy'` zurückgesetzt — ein `degraded`-Zustand
resettet den Zähler eines vorherigen `unavailable`-Streaks nicht.

## 4. Verhältnis `renormalizeAndScore()` zu Provenance

`renormalizeAndScore()` (`src/services/realMarketSignals.ts`) kennt keine Provenance — es rechnet
rein auf `values`/`weights`. Sein Ergebnis (`usedFactors`) filtert **danach** das bereits gebaute
`FinancialFieldProvenance[]`-Array, das wiederum in `buildTraditionalScoringLineage()` einfließt
(`traditionalAssetScoring.ts:236-277`). Die Verbindung ist einseitig und nachgelagert: Renormalisierung
entscheidet, Provenance-Filterung folgt — nicht umgekehrt. Dieselbe Funktion wird unabhängig
voneinander auch von `cryptoScoringService.ts`, `memeCoinScoringService.ts`,
`commodityEvidenceScoring.ts` und `sovereignBenchmarkEvidenceScoring.ts` genutzt — der einzige
wirklich geteilte Lückenbehandlungs-Baustein über alle Anlageklassen hinweg, obwohl die
Provenance-/Evidence-Typen um sein Ergebnis herum je Domäne unterschiedlich sind.

`classifyTrendLabel()` ist noch unabhängiger: es speist ausschließlich das nutzerseitige
`pattern`-Feld über `computeDisplayTrendLabel()` (`server.ts`) und berührt weder Provenance noch
Lineage noch Health.

## 5. Gibt es bereits einen vereinten Qualitäts-/Health-Report?

**Nein.** Geprüft:

- `src/agents/adminDiagnosticsAgent.ts:46-54` (`readProviderHealth()`) ist ein reiner,
  capability-gegateter Passthrough zu `getProviderHealth()` — keine Anreicherung mit
  Feld-Provenance.
- `src/platform/Compliance/runtimeEvidence.ts:1-52` wandelt `ProviderHealthRecord[]` in
  Compliance-Findings (ISO A.8.6/A.8.16) — meldet nur nicht-`healthy` Provider; ein vollständig
  gesunder Provider-Bestand erzeugt null Findings und ist damit in diesem Scanner unsichtbar.
  Keine Provenance-/Lineage-Daten enthalten.
- `src/platform/Supervisor/supervisor.ts` `getSupervisorStatus()` aggregiert
  `providerHealth`/`marketDataRouting`/`marketIntegrity`/`screeningSla`/`scoreConfidence`/
  `aiGovernance` — kommt einem vereinten Status am nächsten, enthält aber **keine
  feld-/anlageklassenspezifische Provenance oder Lineage**.

**Schlussfolgerung für SA-P07:** Aktuell kann ein Operator entweder Provider-Health (Supervisor/
AdminDiagnosticsAgent/RuntimeEvidence) **oder** Feld-Provenance/Lineage (je Scoring-Service-Rückgabewert)
einsehen — nie beides zusammen in einem Artefakt. Genau diese Verknüpfung wäre der Kern eines
„Provider Quality Contract"-Prototyps.

## 6. Getrennte Systeme (bestätigt)

1. **Generationsbruch:** das alte `dataSource`/`scoreBasis`/`source`-Muster
   (`DATENQUALITAETSSCHICHT.md`, `server.ts`/`src/lib/assetRegistry.ts`) und das neue
   `FinancialFieldProvenance`/`ProviderHealthRecord`-System sind **strukturell nicht verbunden** —
   kein gemeinsamer Typ, keine Konvertierungsfunktion.
2. **Drei parallele Provenance-/Evidence-Typfamilien** innerhalb der „neuen" Generation, die nur
   über `recordProviderHealth`/`getProviderHealth` zusammenlaufen:
   - **A** — `FinancialFieldProvenance`/`TraditionalScoringLineage` (Aktien/Forex/Index, typseitig
     auf diese drei beschränkt).
   - **B** — `VerifiedFieldProvenance`/`ScoringEvidenceRef`/`CanonicalScoreResult` (Krypto, sowie
     wiederverwendet für Rohstoffe/Anleihen-Scoring).
   - **C** — sechs handgebaute, domänenspezifische Evidence-Taschen mit je eigenem
     ID-Schema (`bond:eodhd:...`, `commodity:twelvedata:...`, `macro:fred:...`, `index:fmp:...`,
     `kraken:spot-ticker:...`, `quote:alpaca:...`) statt einheitlich über `buildFinancialEvidenceId()`
     (Format `financial:{provider}:{assetId}:{field}`), das nur von `traditionalAssetScoring.ts`
     und transitiv `indexMarketEvidence.ts` tatsächlich aufgerufen wird.

## 7. Zusammengefasste Befunde/Diskrepanzen

| # | Befund | Art | Ort | Status |
|---|---|---|---|---|
| F1 | Anleihen-Routing-Tabelle im Supervisor ist falsch (`hasDedicatedEngine: false` trotz real verdrahtetem, ADR-0033-freigegebenem Scoring) | Code, veraltet | `src/platform/Supervisor/supervisor.ts:36` | **nicht behoben** — außerhalb read-only-Scope, zur Owner-Entscheidung markiert |
| F2 | `DATENQUALITAETSSCHICHT.md` §1-Tabelle veraltet für Anleihen (Historie als „nicht abgedeckt" gelistet) | Dokumentation, veraltet | `docs/architecture/DATENQUALITAETSSCHICHT.md:57` | Nachtrag in diesem Dokument ergänzt (siehe unten) |
| F3 | `DATENQUALITAETSSCHICHT.md` §4-Punkt zu H1-Fundamentaldaten-Zeitstempel ist überholt (bereits gelöst) | Dokumentation, veraltet | `docs/architecture/DATENQUALITAETSSCHICHT.md:118-121` | Nachtrag ergänzt |
| F4 | News-Sentiment ohne jede Provenance-/Health-Kennzeichnung | echte offene Lücke | `src/features/news/newsRoutes.ts` | weiterhin offen, unverändert seit `DATENQUALITAETSSCHICHT.md` |
| F5 | Zwei Evidence-ID-Schemata für dieselben Index-Rohdaten | Inkonsistenz | `src/services/indexMarketEvidence.ts` | dokumentiert, nicht behoben |
| F6 | Sechs ad-hoc Evidence-ID-Formate statt einheitlichem `buildFinancialEvidenceId()` | Inkonsistenz | Familie C (§6) | dokumentiert, nicht behoben |
| F7 | Provider-Health-Store In-Memory, nicht persistent, keine Multi-Instanz-Aggregation | Architektur-Grenze | `providerHealth.ts:27` | vom Supervisor selbst bereits offengelegt (Kommentar Zeile 289) |
| F8 | `consecutiveFailures` resettet nicht bei `degraded`, nur bei `healthy` | mögliche Feinheit für künftige Alarmschwellen | `providerHealth.ts:57` | dokumentiert, keine Bewertung ob Bug oder Absicht |
| F9 | Krypto-`data_quality_risk` ist ein Scoring-Faktor, kein separates Qualitäts-Metadatum (anders als bei Aktien/Forex/Index) | Architektur-Inkonsistenz zwischen Domänen | `verifiedCryptoTechnicalScoring.ts:172` | dokumentiert, nicht bewertet ob zu vereinheitlichen |

## 8. Nicht Bestandteil dieser Untersuchung

- Keine Code-Änderung an `supervisor.ts` (F1) — reine Lesearbeit, wie vom Owner für diesen ersten
  Schritt gewählt.
- Keine Definition eines formalen `SA-P07 Provider Quality Contract` — dieses Dokument ist die
  Faktenbasis dafür, nicht der Contract selbst.
- Keine Bewertung, ob die drei Provenance-Familien (§6) vereinheitlicht werden sollen — das ist eine
  Architekturentscheidung für den nächsten Schritt, nicht Teil einer read-only Bestandsaufnahme.
- `src/services/marketDataConsensus.ts`, der TwelveData-Adapter hinter `fetchExternalHistory`, und
  einzelne weitere Blattdateien wurden nicht vollständig gelesen (nur über Konsumenten referenziert)
  — bei Bedarf für einen konkreten SA-P07-Entwurf gezielt nachlesen.

## 9. Empfehlung für den nächsten Schritt

Basierend auf dieser Bestandsaufnahme ergeben sich für den eigentlichen `SA-P07 Provider Quality
Contract` mehrere unabhängig wählbare, nicht sich gegenseitig ausschließende Optionen — keine davon
wurde bereits begonnen:

1. **F1 beheben** (`supervisor.ts:36` korrigieren) — kleinster Schritt, reine Faktenkorrektur, kein
   neues Konzept nötig.
2. **News-Sentiment-Kennzeichnung** (F4) — die im ursprünglichen `AskUserQuestion` als dritte Option
   angebotene, engste Lücke.
3. **Vereinter Qualitäts-Report** (§5) — `getSupervisorStatus()` um feld-/anlageklassenbezogene
   Provenance-Zusammenfassung erweitern, ohne die drei bestehenden Typfamilien zu verschmelzen.
4. **Evidence-ID-Vereinheitlichung** (F5/F6) — alle Domänen auf `buildFinancialEvidenceId()`
   umstellen.

Owner-Entscheidung erforderlich, welche(r) Punkt(e) als nächstes bearbeitet werden soll(en).

## Verwandte Dokumente

- `docs/architecture/DATENQUALITAETSSCHICHT.md` — älteres Provenance-Muster, teilweise veraltet (F2/F3)
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` Abschnitt 6, P2-1
- `src/types/financialProvenance.ts`, `src/platform/Supervisor/providerHealth.ts`,
  `src/types/scoringIntegrity.ts`, `src/services/cryptoSnapshotProvider.ts`
