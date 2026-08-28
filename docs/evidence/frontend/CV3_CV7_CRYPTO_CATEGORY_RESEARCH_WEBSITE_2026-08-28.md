# CV-3 / CV-7 — Crypto Category & Research Website Integration

**Date:** 2026-08-28  
**Branch:** `feat/crypto-cv3-cv7-website-2026-08-28`  
**Scope:** CV-3 Factor & Model Explorer + CV-7 Meme & DeFi Research Lenses  
**Authority:** presentation/read-only; productive score authority remains `ScoringModelRegistry -> ScoringDispatcher`.

## Ausgangslage

Der produktive Enterprise Crypto Scorer visualisierte Canonical Score, Ranking, generische Faktoren und Evidence. Die bereits vorhandenen Backend-Komponenten für kanonische Crypto-Klassifikation, Kategorieprofile sowie Meme-/DeFi-Research-Contracts wurden jedoch nicht als eigene Website-Linsen dargestellt.

## Umsetzung

1. `cryptoCategoryResearchViewModel.ts` projiziert ausschließlich bestehende Backend-Contracts:
   - `ClassificationService`;
   - `CRYPTO_CATEGORY_ANALYSIS_PROFILES` / `resolveCryptoAnalysisProfile`;
   - `CRYPTO_MEME_RESEARCH_MODEL_CONTRACT`;
   - `CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT`.
2. `CryptoCategoryResearchLenses.tsx` visualisiert:
   - Hauptkategorie, Unterkategorie, Tier und Classification Confidence;
   - source-defined Kategorieprofil und dessen Gewichtungs-/Penalty-Tools;
   - Hard Gates ohne clientseitige PASS/BLOCKED-Berechnung;
   - Meme-/DeFi-Challenger mit Correlation Groups, Feature-Quellen und Anti-Correlation Guards;
   - explizite Research-/Authority-Kennzeichnung.
3. Die bestehende Compatibility-Fassade `src/components/CryptoScoringEnterprise.tsx` komponiert den kanonischen Enterprise Scorer mit dem neuen Category Model Explorer. Die produktive Feature-Implementierung des bestehenden Scorers bleibt unberührt.
4. Tabs folgen dem WAI-ARIA Tabs Pattern mit `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, roving `tabIndex` sowie Left/Right/Home/End Keyboard Navigation.

## Datenintegrität / Security / Governance

- keine neue API oder externe Dependency;
- keine neuen Secrets oder Providerzugriffe;
- kein Browser-/Frontend-Re-Scoring;
- keine neue Model Registry, Dispatcher-, Eligibility-, Execution- oder Persistence-Authority;
- fehlende Profile/Gewichte bleiben explizit unavailable/pending und werden nicht durch 0/50/Defaultwerte ersetzt;
- Meme-Drift bleibt sichtbar: das ältere Category Profile ist weiterhin `PENDING_EVIDENCE`, während SC-3 `crypto-meme-integrity@0.3.0` als research-only Challenger bereitstellt. Die Präsentation verschmilzt diese beiden Authorities nicht.

## Regression Guards

`tests/unit/cryptoCategoryResearchViewModel.test.ts` deckt ab:

- AAVE -> DeFi-Profil + `crypto-defi-fundamental@0.3.0`;
- DOGE -> Meme-Klassifikation + research-only Meme Challenger bei weiterhin pending Category Profile;
- Unknown Asset -> generic / fail-closed / keine erfundenen Gewichte;
- `SCORING_DISPATCHER_ONLY` bleibt Score Authority.

## Validierungsstatus vor PR

- Branch wurde exakt vom zum Start aktuellen `main` erzeugt.
- Diff ist auf vier Implementierungsdateien plus diese Evidence begrenzt.
- Kein kostenverursachender GitHub-Build/Test vor PR ausgelöst.
- TypeScript/Unit/Production-Build sind vor PR nicht als PASS behauptet; nach PR sind die kanonischen CI-Gates auszuführen.
