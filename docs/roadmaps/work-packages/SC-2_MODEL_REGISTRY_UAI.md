# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Status:** IN IMPLEMENTATION — A1/A2 consolidation + Research Evidence re-entry boundary  
**Parent Branch:** `agent/a1-a2-scoring-consolidation`  
**Current Child Branch:** `agent/gemini-research-evidence-adapter`  
**Start:** 2026-08-19  
**ADRs:** ADR-0086, ADR-0087

## Ziel

SC-2 konsolidiert die historisch gewachsenen Scoring-Pfade in **eine** kanonische Architektur. Dieses Work Package ist dem Screening/Scoring/Market-Data-SPT untergeordnet und erzeugt keine zweite Roadmap. Research-/AI-Fähigkeiten dürfen nur als Acquisition-/Evidence-Adapter in diese Architektur eintreten.

## Architektur-Invariante

```text
UAI Identity
   -> Evidence Acquisition / MarketDataGateway / ResearchEvidenceAdapter
          -> AI_DISCOVERED_EVIDENCE (niemals direkt scoreEligible)
          -> Source Validation
          -> zukünftige field-spezifische Evidence Promotion
   -> Evidence + Data Quality Gate
   -> Feature Contract
   -> ScoringModelRegistry (canonical champion only)
   -> Domain Executor Adapter
   -> CanonicalScoreResult
   -> Ranking / Eligibility
   -> EventMesh / Traceability / Supervisor
```

Kein öffentlicher Score-Pfad darf langfristig Modellwahl, Evidence-Bypass oder Result-Semantik außerhalb dieser Kette besitzen. AI-/Research-Provider dürfen keine zweite Scoring- oder Provenance-Architektur erzeugen.

## A1 — Architecture Freeze & Parallel-Path Inventory

### Scope

- öffentliche und interne Score-Einstiegspunkte inventarisieren;
- Modellwahl, Evidence-Policy und Result-Contract je Pfad erfassen;
- Parallelpfade als `canonical`, `migration-required`, `research-only` oder `blocked` klassifizieren;
- keine neue Scoring-Engine außerhalb von `src/platform/Scoring`-Contracts und bestehenden Domain-Executoren zulassen.

### Initiale Befunde

| Pfad | heutige Rolle | Ziel |
|---|---|---|
| `/api/crypto/score` | verified, fail-closed, CanonicalScoreResult | erster Registry-Consumer |
| `/api/crypto/list`, `/top10` | verified crypto + ranking | auf denselben Registry/Dispatcher ziehen |
| `/api/crypto/analyze` | Agent + Market-Mix; kann Parallelscore erzeugen | Research/Enrichment; kein alternativer Canonical Score |
| `scoring.service.ts` Base/DeFi | Legacy Aggregator | Domain-Executor nur hinter Evidence/Registry oder retire |
| `cryptoScoringService.ts` | deterministische Engine im verified path | bleibt Executor, nicht Architektur |
| Meme direct score | separater Contract | Migration/Canonical adapter; bis dahin legacy |
| Raw Materials Orchestrator | AI + eigener Scoringpfad | Research von verifizierter Commodity-Evidence trennen |
| TraditionalAssetScoring | verified inputs, eigener Result-Contract | CanonicalResultAdapter |
| Commodity/Sovereign in `registryRoutes` | evidence-aware, route-lokale Executorlogik | Executor extrahieren + CanonicalResultAdapter |
| Individual Bond | Evidence nicht ausreichend | blocked / SCORE_NOT_COMPUTABLE |

Vollständige Baseline: `docs/evidence/sc-md/SC2_A1_A2_BASELINE_2026-08-19.md`.

## A2 — UAI + ScoringModelRegistry

### Phase A — Foundation

- [x] UAI Identity Contract `uai/1.0.0`
- [x] Adapter für `RegistryAsset` und `AssetCatalogCandidate`
- [x] immutable, Git-versionierte `ScoringModelRegistry`
- [x] Champion/Challenger/Legacy/Blocked Lifecycle-Metadaten
- [x] fail-closed Resolver bei fehlendem oder mehrdeutigem Champion
- [x] vorhandene verifizierte Model-Familien initial registriert
- [x] Unit-Tests für Identity, Routing, Bond-Gate und Ambiguität
- [ ] erster produktiver Consumer: `/api/crypto/score`

### Phase A.5 — Research-/Extraction-/Evidence-Discovery Re-Entry Boundary

ADR-0087 erlaubt die **dormant** Vorbereitung einer zukünftigen Gemini-Rückkehr, ohne ADR-0072 für Runtime/Keys/Dependencies aufzuheben.

- [x] providerneutraler `ResearchEvidenceAdapter`-Contract
- [x] UAI-gebundener `ResearchEvidenceCandidate` mit `AI_DISCOVERED_EVIDENCE`
- [x] harte Invariante `scoreEligible=false` für Discovery + Source Validation
- [x] Source-Policy-Klassen (`regulated-primary`, `official-primary`, `provider-primary`, `secondary`, `unknown`)
- [x] öffentliche HTTPS-/SSRF-nahe URL-Grenzen
- [x] dormant `GeminiResearchEvidenceAdapter` + `GeminiResearchTransport` Interface
- [x] Search/URL-Context/Structured-Output Mapping vorbereitet
- [x] Citation-/Source-Bindung verpflichtend; unsourced Claims werden verworfen
- [x] Function Calling in Re-Entry Phase 1 deaktiviert
- [x] Regressionstests implementiert
- [ ] Tests in CI/lokal ausführen und PASS-Evidence erfassen
- [ ] echter Gemini Transport — **Owner-gated, separate Aktivierungsstufe**
- [ ] `@google/genai`/Secret/Feature-Flag/Telemetry — **nicht Teil dieser Foundation**
- [ ] reale Source-Policy + Lizenzfreigaben je Domain/Field
- [ ] field-spezifische Promotion zu `ScoringEvidenceRef` — separat Owner-gated

Evidence: `docs/evidence/sc-md/SC2_GEMINI_RESEARCH_EVIDENCE_ADAPTER_2026-08-19.md`.

### Phase B — Consumer Migration

- [ ] `/api/crypto/list`, `/score`, `/top10` über Registry-Resolution
- [ ] Traditional stock/forex/index mit CanonicalResultAdapter
- [ ] Commodity/Sovereign Executor aus `registryRoutes` extrahieren
- [ ] Registry routes über UAI + Registry-Resolution
- [ ] Meme/Raw-Materials direkte Modellwahl hinter kanonische Adapter setzen oder retire
- [ ] `/api/crypto/analyze` auf Research-/Enrichment-Semantik begrenzen; Research Evidence ggf. ausschließlich über `ResearchEvidenceAdapter`

### Phase C — Single Dispatcher Exit

- [ ] ein kanonischer Scoring Dispatcher als einziger Modellexecution-Einstieg
- [ ] keine Route importiert produktive Scoring-Engines direkt, außer Dispatcher/Executor-Adapter
- [ ] alle extern sichtbaren Score-Resultate `CanonicalScoreResult`
- [ ] Legacy model-selection/fallback paths entfernt
- [ ] Traceability enthält UAI assetId + modelId/version/alias

## Nicht-Ziele dieses Work Packages

- keine Änderung von Scoring-Gewichten;
- keine Änderung von Ranking-/Eligibility-Schwellen;
- kein `scoreImpact`-/`rankingImpact`-Flip;
- kein Provider-Routing-/executionPriceEligible-Flip;
- **keine Gemini Runtime-Reaktivierung in Phase A.5**; ADR-0072 bleibt für SDK/Key/Runtime wirksam;
- keine neuen synthetischen/LLM-basierten Finanzmerkmale;
- keine automatische Evidence-Promotion aus AI-Ausgaben.

## Enterprise-/FinTech-Abgleich

Die Registry übernimmt die für Enterprise Model Governance wesentlichen Prinzipien: zentrale Versionierung, kontrollierte Deployment-Aliase (`champion`/`challenger`), nachvollziehbare Modellmetadaten und fail-closed Promotion. Die UAI-/Evidence-Trennung verhindert, dass Asset-Katalogdaten oder AI-Outputs stillschweigend zu Finanz-Evidence werden. Der Research-Evidence-Contract ergänzt diese Trennung um eine explizite Trust Boundary: AI kann Quellen entdecken und Claims extrahieren, aber Source Authority und Score-Evidence entstehen erst in separaten, reviewbaren Policy-/Feature-Gates. Outcome-/Walk-Forward-Validierung bleibt SC-8 und wird über die Registry-Versionen korrelierbar.

## Definition of Done SC-2

SC-2 ist erst `LANDED`, wenn alle produktiven Score-Einstiegspunkte über UAI + Registry laufen und kein paralleler Model-Selection-Pfad mehr einen extern sichtbaren Score erzeugen kann. Research-/AI-Provider dürfen nur über die kanonische Research/Evidence-Grenze einspeisen. Vor PR-Abschluss wird jeder ausführende Branch erneut gegen den aktuellen `main` verglichen und bei Korrelationen angepasst.
