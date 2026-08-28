# CV-3 / CV-7 — Crypto Category & Research Website Integration

**Date:** 2026-08-28  
**Branch:** `feat/crypto-cv3-cv7-meme-sc3-integration-2026-08-28`  
**Scope:** CV-3 Factor & Model Explorer + CV-7 Meme & DeFi Research Lenses + SC-3 Meme profile correlation  
**Authority:** presentation/read-only; productive score authority remains `ScoringModelRegistry -> ScoringDispatcher`.

## Ausgangslage

Der produktive Enterprise Crypto Scorer visualisierte Canonical Score, Ranking, generische Faktoren und Evidence. Die bereits vorhandenen Backend-Komponenten für kanonische Crypto-Klassifikation, Kategorieprofile sowie Meme-/DeFi-Research-Contracts wurden jedoch nicht als eigene Website-Linsen dargestellt.

## Umsetzung

1. `cryptoCategoryResearchViewModel.ts` projiziert ausschließlich bestehende Backend-Contracts:
   - `ClassificationService`;
   - `resolveCryptoAnalysisProfile` für die kanonische Kategoriebindung;
   - `resolveEffectiveCryptoCategoryAnalysisProfile` für wirksame, supersession-fähige Kategorieprofile;
   - `CRYPTO_MEME_RESEARCH_MODEL_CONTRACT`;
   - `CRYPTO_DEFI_RESEARCH_MODEL_CONTRACT`.
2. `CryptoCategoryResearchLenses.tsx` visualisiert:
   - Hauptkategorie, Unterkategorie, Tier und Classification Confidence;
   - source-defined effektives Kategorieprofil und dessen Gewichtungs-/Penalty-Tools;
   - Hard Gates ohne clientseitige PASS/BLOCKED-Berechnung;
   - Meme-/DeFi-Challenger mit Correlation Groups, Feature-Quellen und Anti-Correlation Guards;
   - explizite Research-/Authority-Kennzeichnung.
3. Die bestehende Compatibility-Fassade `src/components/CryptoScoringEnterprise.tsx` komponiert den kanonischen Enterprise Scorer mit dem neuen Category Model Explorer. Die produktive Feature-Implementierung des bestehenden Scorers bleibt unberührt.
4. Tabs folgen dem WAI-ARIA Tabs Pattern mit `tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`, roving `tabIndex` sowie Left/Right/Home/End Keyboard Navigation.
5. Die SC-3 Meme-Supersession hebt das effektive Meme-Kategorieprofil auf `SOURCE_DEFINED` und projiziert die SC-3-Top-Level-Faktoren sowie Hard-Gate-Identitäten, ohne das historische FT-0-Artefakt umzuschreiben oder produktives Scoring zu autorisieren.

## Datenintegrität / Security / Governance

- keine neue API oder externe Dependency;
- keine neuen Secrets oder Providerzugriffe;
- kein Browser-/Frontend-Re-Scoring;
- keine neue Model Registry, Dispatcher-, Eligibility-, Execution- oder Persistence-Authority;
- fehlende Profile/Gewichte bleiben explizit unavailable/pending und werden nicht durch 0/50/Defaultwerte ersetzt;
- Meme wird wirksam über die explizite SC-3-Supersession aufgelöst; das historische FT-0-`PENDING_EVIDENCE` bleibt nur als nachvollziehbarer Vorgänger erhalten;
- `crypto-meme-integrity@0.3.0` bleibt `lifecycle=challenger`, `scoreEligible=false` und research-only.

## Regression Guards

`tests/unit/cryptoCategoryResearchViewModel.test.ts` deckt ab:

- AAVE -> DeFi-Profil + `crypto-defi-fundamental@0.3.0`;
- DOGE -> effektives SC-3 Meme-Profil `SOURCE_DEFINED`, sechs Top-Level-Faktoren, Hard Gates und research-only Meme Challenger;
- Unknown Asset -> generic / fail-closed / keine erfundenen Gewichte;
- `SCORING_DISPATCHER_ONLY` bleibt Score Authority.

`tests/unit/fintechCoreCryptoCategoryProfileResolver.test.ts` sichert zusätzlich die resolver-seitige Meme-Supersession und unveränderte Unknown-Fail-Closed-Semantik.

## Validierungsstatus vor PR

- Integrationsbranch wurde direkt vom aktuellen `main@c4134a0f3a14b850a9e084b86ca96dd90c0b51b1` erzeugt.
- Die seit den beiden Ursprungsbranches neu gemergten Main-Änderungen wurden auf Datei-, Architektur-, Security- und Governance-Korrelation geprüft; kein Crypto-/CV-Dateikonflikt wurde festgestellt.
- Kein kostenverursachender GitHub-Build/Test vor PR ausgelöst.
- TypeScript/Unit/Production-Build sind vor PR nicht als PASS behauptet; nach PR sind die kanonischen Class-C-CI-Gates auszuführen.
