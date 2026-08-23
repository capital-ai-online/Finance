# CV-1 — Crypto Score Command Center Evidence

**Status:** SOURCE IMPLEMENTED / EXECUTION VALIDATION PENDING  
**Stand:** 2026-08-23  
**Baseline:** `main@800b05261c1792fed5138a8125cf6a00b1f5af07`  
**Branch:** `feat/crypto-visualization-work-packages-2026-08-23`  
**Parent Work Package:** `docs/roadmaps/work-packages/CRYPTO_VISUALIZATION_OPTIMIZATION_2026-08-23.md`  
**Parent Authorities:** `docs/frontend/FRONTEND_ARCH.md`, ADR-0087, `SC-MD-SPT-0001`

## 1. Ziel

CV-1 ordnet die obere Darstellung des Enterprise Crypto Scorers neu, ohne Scoring-, Ranking-, Research- oder Evidence-Regeln in den Browser zu verschieben.

Die visuelle Priorität ist:

```text
Canonical Score
   ↓
Ranking / Eligibility
   ↓
Technical / Canonical Lens
Research Context Lens
Evidence Health Lens
   ↓
Research / Market Data / Factor Details
```

Der kanonische Score ist damit die einzige dominante Score-Zahl. Ranking, Research und Evidence bleiben sichtbar, erhalten aber eine getrennte Presentation-Authority.

## 2. Implementierter Scope

### 2.1 Canonical Score Hero

`src/features/crypto/ui/CryptoScoringEnterprise.tsx` enthält jetzt `#crypto-score-command-center` mit:

- `AuthorityBadge(CANONICAL_SCORE)`;
- größerem, goldfarbenem Canonical-Score-Gauge;
- expliziter `30 verifizierte 1D-Bars` Score-Basis;
- Feature-/Scoring-Contract;
- Backend-Modell-Lineage (`modelId`, `modelVersion`, `modelAlias`, `modelLifecycle`), soweit geliefert;
- Backend-Decision nur bei tatsächlich geliefertem Decision-Feld.

Der Gauge verwendet bewusst **keine** aus dem Score abgeleitete Buy-/Watch-/Reject-Farbe. CAPITAL-AI Gold kennzeichnet die kanonische Authority; eine Decision-Farbe wird nur aus einer vorhandenen Backend-Decision projiziert.

### 2.2 Entfernung der Frontend-Decision-Inferenz

Vor CV-1 konnte `scoreTier(score, decision)` bei fehlender Backend-Decision anhand lokaler Schwellen aus einem numerischen Score Präsentations-Tiers ableiten.

CV-1 entfernt diese Presentation-Reklassifizierung. Die aktuelle Funktion:

```text
decisionStyle(decision)
```

konsumiert nur eine explizite Backend-Decision. Es existiert keine lokale `score >= 80/65/50/35` Decision-Autorität mehr.

Damit gilt stärker als zuvor:

> Projection, not Redefinition.

### 2.3 Ranking bleibt sekundär

Der bisher als `Intelligent Score` dargestellte Wert wird als **Ranking Score** kenntlich gemacht und ausdrücklich mit

`sekundäre Ranking Projection · kein kanonischer Score`

beschrieben.

Ranking und `eligible_for_top10` verändern den Canonical Score nicht.

### 2.4 Drei getrennte Linsen

#### Technical / Canonical

- `CANONICAL_SCORE` Authority;
- serverseitiger Status;
- Evidence-Zeitstempel;
- explizite 30×1D-Scorebindung.

#### Research Context

- `RESEARCH` Authority;
- Sentiment, Momentum, Pattern, Regime und AI-Kurzanalyse ausdrücklich nur als Kontext;
- `ResearchOnlyBanner` mit `scoreEligible=false` und `executionEligible=false`.

#### Evidence Health

- Backend-Status als sichtbarer Zustand;
- `observedAt` / `retrievedAt`, soweit vorhanden;
- Coverage;
- Provider-Anzahl;
- Evidence-ID-Anzahl;
- Data Quality.

Es werden keine lokalen Freshness-Schwellen oder Evidence-Defaults erzeugt.

## 3. Backend-Lineage-Projektion

CV-1 nutzt vorhandene Felder aus `ScoringIntegrityMetadata`:

- `observedAt`;
- `retrievedAt`;
- `featureVersion`;
- `scoringVersion`;
- `modelId`;
- `modelVersion`;
- `modelAlias`;
- `modelLifecycle`;
- `providers`;
- `evidence`;
- `coverage`;
- `dataQuality`.

Evidence-IDs werden rückwärtskompatibel aus `id` oder `evidenceId` gelesen. Die UI erzeugt keine neue Model Registry und entscheidet keine Model Selection.

## 4. CV-0-Integration

CV-1 verwendet die in CV-0 eingeführten Shared-Primitives:

- `AuthorityBadge`;
- `FreshnessBadge`;
- `EvidenceStateIndicator`;
- `ResearchOnlyBanner`;
- `CryptoVisualizationMetric` / `createCryptoVisualizationMetric`.

Die Shared-Primitives wurden nur rückwärtskompatibel erweitert:

- `AuthorityBadge.compact` als Darstellungsalias;
- `EvidenceStateIndicator.state` als Alias zu `status`;
- `ResearchOnlyBanner.title` / `description` für erklärenden Research-Kontext.

Die Eligibility-Invariante des Research-Banners bleibt unverändert auf `false`.

## 5. Bestehende Invarianten erhalten

CV-1 verändert nicht:

- `/api/crypto/score` als Crypto-Score-Consumer;
- `/verified-score` für bestehende Traditional-Asset-Pfade;
- Asset-Suche;
- Multi-Asset-Auswahl;
- `SCORE_TEMPORAL_BASIS`;
- einzige score-bound Timeframe-Option `1 Tag`;
- `lookbackBars=30` / `barInterval=1d`;
- Trade-Setup-Datenquelle;
- `EnterpriseAnalysisPanels`;
- MarketData-/Research-Endpoints;
- ScoringModelRegistry oder ScoringDispatcher;
- Backend-Gewichte, Gates, Eligibility oder Ranking-Berechnung.

## 6. Neue statische Regression

Neu:

`tests/unit/cryptoScoreCommandCenter.test.ts`

Der Test prüft source-basiert:

1. Canonical Score ist die führende Command-Center-Authority.
2. Ranking ist explizit sekundär und nicht kanonisch.
3. Modell-/Freshness-Lineage wird aus Backend-Feldern projiziert.
4. Technical, Research und Evidence bleiben getrennte Linsen.
5. `scoreTier` und lokale `score >= 80/65/50/35` Decision-Schwellen sind abwesend.
6. Asset-Suche und 30×1D-Bindung bleiben vorhanden.
7. Quick Analysis folgt erst nach dem Command Center.

## 7. Accessibility / Responsive

Source-seitig umgesetzt:

- Authority wird durch Text + Icon + Farbe kommuniziert;
- Canonical Score Gauge besitzt ein textuelles `aria-label`;
- Research-only Eligibility bleibt per ARIA wahrnehmbar;
- Grid bricht mobil auf eine Spalte um;
- vorhandene 44px-Minimum-Targets der Suche/Timeframes bleiben erhalten;
- kein horizontales Scrollen wird durch feste Desktop-Spalten erzwungen.

Noch nicht als Live-PASS behauptet:

- axe;
- Keyboard-/Screenreader-Smoke;
- 360–430px Browser-Rendering;
- Lighthouse.

## 8. OSS-/Dependency-Entscheidung

Für CV-1 wurde **keine neue Dependency** eingeführt.

Bestehende Mittel reichen aus:

- React 19;
- Recharts 3.9;
- bestehende semantic design tokens;
- CV-0 Shared-Primitives.

Eine zusätzliche Chart-/Dashboard-Library würde für CV-1 nur Dependency- und Bundle-Komplexität erzeugen und ist nicht gerechtfertigt.

## 9. Validation State

| Nachweis | Zustand |
|---|---|
| Main-Sync vor CV-1 | PASS — `main@800b05261...`, Branch 0 behind |
| Source-/Contract-Review | DONE |
| CV-1 Implementation | DONE auf Feature-Branch |
| statischer Regressionstest im Source | IMPLEMENTED |
| TypeScript real ausgeführt | **PENDING** |
| Unit Suite real ausgeführt | **PENDING** |
| Production Build | **PENDING** |
| Lighthouse / axe | **PENDING** |
| Hosted PR CI | **PENDING — kein PR erstellt** |

`PENDING` wird bewusst nicht als PASS interpretiert.

## 10. Nächster Schritt

Nach CV-1 folgt gemäß bestehendem Work Package:

- CV-2 Contract-/Financial-Chart-Spike **oder**
- CV-3 Factor & Model Explorer,

wobei vor der nächsten Welle erneut `main` und offene PR-Korrelation geprüft werden müssen.
