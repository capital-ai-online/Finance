# CV-0 — Crypto Visualization Authority Contract Evidence

**Stand:** 2026-08-23  
**Status:** IMPLEMENTED ON FEATURE BRANCH / HOSTED CI NOT STARTED  
**Branch:** `feat/crypto-visualization-work-packages-2026-08-23`  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Parent Authorities:** `docs/frontend/FRONTEND_ARCH.md`, `docs/frontend/design-tokens.json`, ADR-0087, ADR-0099, ADR-0100, `SC-MD-SPT-0001`

## 1. Ziel

CV-0 etabliert ausschließlich eine **read-only Presentation Projection** zwischen bestehenden Backend-/Platform-Contracts und der Crypto-UI. Es entsteht keine neue Scoring-, Evidence-, MarketData-, Ranking-, Pattern-, Regime- oder Execution-Authority.

Die UI unterscheidet vier Visual-Authority-Klassen:

- `CANONICAL_SCORE`
- `RESEARCH`
- `EVIDENCE_ONLY`
- `MARKET_DATA`

Diese Werte sind Darstellungsmetadaten. Sie wählen kein Modell, berechnen keinen Score und verändern keine serverseitige Eligibility.

## 2. Implementierte Bausteine

### Shared UI

- `src/shared/ui/AuthorityBadge.tsx`
- `src/shared/ui/FreshnessBadge.tsx`
- `src/shared/ui/EvidenceStateIndicator.tsx`
- `src/shared/ui/ResearchOnlyBanner.tsx`

Die Komponenten nutzen ausschließlich bestehende semantische Design-Tokens. Es wurden keine lokalen Branding-Hexwerte und keine neue Farb-Authority eingeführt.

`AuthorityBadge` kennzeichnet Authority zusätzlich zu Farbe mit Text und Icon. `ResearchOnlyBanner` zeigt explizit und screenreader-lesbar:

```text
Score-eligible: nein
Execution-eligible: nein
```

### Crypto Presentation View Model

`src/features/crypto/ui/cryptoVisualizationViewModel.ts` definiert eine reine Projection mit:

- `authority`
- `status`
- `observedAt`
- `retrievedAt`
- Provider-Referenzen
- Evidence-IDs
- optionalem `scoreEligible`
- optionalem `executionEligible`
- unverändertem `value`

Missing Values bleiben `null`/`undefined`. Die Projection erzeugt weder `0`, `50`, PASS noch einen lokalen Freshness-Status.

Für die aktuell ausdrücklich nicht autorisierenden Parent-Contracts gilt ein Presentation-Consistency-Guard:

- `RESEARCH` akzeptiert nur `scoreEligible=false` und `executionEligible=false`;
- `EVIDENCE_ONLY` akzeptiert nur `scoreEligible=false` und `executionEligible=false`.

Der Guard autorisiert nichts neu; er verhindert lediglich, dass eine UI-Projektion einem vorhandenen non-authorizing Contract widerspricht.

## 3. Produktive UI-Anbindung

### Enterprise Binance Quick Analysis

`src/features/crypto/ui/EnterpriseBinanceQuickAnalysis.tsx` trennt jetzt sichtbar:

- Binance Spot Input → `MARKET_DATA`
- AI-Kurzanalyse → `RESEARCH`
- Research Output → `ResearchOnlyBanner`
- `marketData.asOf` → `FreshnessBadge`, ohne clientseitige Freshness-Klassifikation

Damit kann ein Research-Text nicht mehr wie ein kanonischer Score dargestellt werden.

### Verified 4h Market Bars

`src/features/crypto/ui/EnterpriseAsset4hChart.tsx` projiziert die vorhandene `MarketDataHistoryGateway`-Antwort über `createCryptoVisualizationMetric(...)` als `MARKET_DATA`.

Verwendet werden ausschließlich vorhandene Contract-Felder:

- `qualityState`
- letzter gelieferter Bar-Timestamp als `observedAt`
- `receivedAt` als `retrievedAt`
- `provider`
- `evidenceId`
- `reason/error`

Bei `0` Bars wird der Backend-Zustand jetzt explizit dargestellt. Der frühere statische Text `4H · verified` wurde entfernt, weil er vor einem tatsächlichen Resultat eine stärkere Aussage suggerieren konnte als der Contract lieferte.

## 4. Regression Gates

Neu: `tests/unit/cryptoVisualizationContract.test.ts`

Abgedeckt werden:

1. Missing canonical values bleiben `null`.
2. Research darf keine Score-/Execution-Eligibility behaupten.
3. Evidence-only bleibt non-authorizing.
4. MarketData muss keine nicht gelieferten Eligibility-Felder erfinden.
5. View Model und Metric Collections sind read-only/frozen.
6. Authority-Primitives verwenden bestehende semantische Tokens und keine lokalen Hexwerte.
7. FreshnessBadge verwendet kein `Date.now()` und berechnet keinen eigenen Freshness-Status.
8. Quick Analysis und 4h Chart konsumieren die neuen Authority-/Freshness-Primitives.
9. Der alte statische `4H · verified`-Badge ist im 4h-Chart nicht mehr zulässig.

## 5. Bewusst nicht Teil von CV-0

- keine Änderung von `ScoringModelRegistry` oder `ScoringDispatcher`;
- keine Änderung von Meme-/DeFi-Modellgewichten oder Hard Gates;
- keine OHLCV-Contract-Erweiterung;
- keine neue Chart-Library;
- keine Render-/Supabase-/Stripe-Mutation;
- keine Live-Execution-Freischaltung;
- kein Pull Request und keine kostenpflichtige Hosted-CI-Ausführung.

Die visuelle Einbindung des `CANONICAL_SCORE`-Badges in den dominanten Score-Hero gehört zu **CV-1 — Crypto Score Command Center**. CV-0 liefert dafür die getestete primitive und Projection-Grenze.

## 6. Validierungsstatus

Repository-/Connector-basiert verifiziert:

- Branch-Basis entspricht `main@800b05261c1792fed5138a8125cf6a00b1f5af07`.
- Zum Implementierungsstart existierten keine offenen Pull Requests.
- Keine Backend-, Dependency-, Workflow- oder Deployment-Datei ist Teil des CV-0-Scopes.

Noch **nicht** behauptet:

- TypeScript PASS
- Unit Suite PASS
- Production Build PASS
- Hosted `build-and-test` PASS

Diese Nachweise bleiben bis zu einem ausführbaren lokalen Pre-PR-Lauf bzw. einem später ausdrücklich autorisierten PR/Hosted-CI-Lauf offen.
