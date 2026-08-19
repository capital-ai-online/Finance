# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Version:** 1.0.3  
**Status:** IN IMPLEMENTATION — Phase B Crypto list/top10 registry migration  
**Execution Branch:** `agent/sc2-crypto-list-top10-registry-consumers`  
**Baseline:** `main@5976e4d2eb1c0d11303322b027b8be42e261583a`  
**Historical Integration:** PR #418 stack merge; PR #421 first productive registry consumer landed after post-#422 revalidation  
**Start:** 2026-08-19  
**ADRs:** ADR-0087, ADR-0088, ADR-0089, ADR-0090

## Ziel

SC-2 konsolidiert die historisch gewachsenen Scoring-Pfade in **eine** kanonische Architektur. Dieses Work Package ist dem Screening/Scoring/Market-Data-SPT untergeordnet und erzeugt keine zweite Roadmap. Research-/AI-Fähigkeiten dürfen nur als Acquisition-/Evidence-Adapter in diese Architektur eintreten.

## Architektur-Invariante

```text
UAI Identity
   -> Evidence Acquisition / MarketDataGateway / ResearchEvidenceAdapter
          -> GeminiResearchTransport (optional shadow, server-only, default-off, free-tier-only)
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
| `/api/crypto/score` | verified, fail-closed, CanonicalScoreResult | **LANDED: erster Registry-Consumer** |
| `/api/crypto/list`, `/top10` | verified crypto + ranking | **aktueller Phase-B-Schritt: auf dieselbe Registry-Authority** |
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
- [x] erster produktiver Consumer `/api/crypto/score` auf `main`

#### Phase A first productive consumer — `/api/crypto/score`

- [x] Request-Symbol wird vor Modellexecution als UAI `crypto:<SYMBOL>` normalisiert
- [x] `ScoringModelRegistry` wählt ausschließlich den kanonischen Champion
- [x] Executor-Bindung fail-closed auf `verifiedCryptoTechnicalScoring.evaluateVerifiedCryptoTechnicalScore`
- [x] `verified-required` Evidence Policy und kanonischer Result-Contract werden vor Ausführung geprüft
- [x] keine Legacy-/Challenger-Fallbacks
- [x] bestehendes `model: technical-provenance` bleibt API-kompatibel
- [x] additive `modelRegistry`-Metadaten im Score-Result
- [x] Scoring-Lineage enthält UAI assetId + Registry modelId/version/alias/executor/Contracts
- [x] Score-Mathematik, Ranking und Eligibility unverändert
- [x] post-#422 PR-CI auf exaktem Head `c8764901`: CI #1815 PASS / Governance #1134 PASS
- [x] Human Merge PR #421 -> `main@5976e4d2eb1c0d11303322b027b8be42e261583a`

Evidence: `docs/evidence/sc-md/SC2_CRYPTO_SCORE_REGISTRY_CONSUMER_2026-08-19.md`.

### Phase A.5 — Research-/Extraction-/Evidence-Discovery Re-Entry Boundary

- [x] providerneutraler `ResearchEvidenceAdapter`-Contract
- [x] UAI-gebundener `ResearchEvidenceCandidate` mit `AI_DISCOVERED_EVIDENCE`
- [x] harte Invariante `scoreEligible=false` für Discovery + Source Validation
- [x] Source-Policy-Klassen und öffentliche HTTPS-/SSRF-nahe URL-Grenzen
- [x] `GeminiResearchEvidenceAdapter` + `GeminiResearchTransport` Interface
- [x] Search/URL-Context/Structured-Output Mapping
- [x] provider-owned Citation-/Source-Bindung verpflichtend
- [x] Function Calling deaktiviert
- [x] Regressionstests implementiert

Evidence: `docs/evidence/sc-md/SC2_GEMINI_RESEARCH_EVIDENCE_ADAPTER_2026-08-19.md`.

### Phase A.6 — Server-only Gemini Research Shadow Runtime

Owner-gated Aktivierungsstufe aus ADR-0088/ADR-0089; Zero-Cost-Policy konkretisiert durch ADR-0090.

- [x] REST `GeminiResearchTransport` gegen Interactions API
- [x] server-only; keine öffentliche Route / kein Startup-Traffic
- [x] Feature Flag `GEMINI_RESEARCH_SHADOW_ENABLED=false`
- [x] `GEMINI_API_KEY` über kanonische `finance-secrets.env`-Manifestliste
- [x] lokales RPM via bestehendem `RateLimitBudget`
- [x] tägliches Request-/Token-Shadow-Budget
- [x] bestehender `CircuitBreaker`
- [x] bestehende Supervisor Provider Health
- [x] kanonische, prompt-/secret-freie Audit-Telemetrie
- [x] `store=false` / `background=false`
- [x] provider-owned `url_citation`-Span-Bindung; kein Model-Source-JSON
- [x] Regressionstests implementiert

#### Phase A.6 Free-Tier-only Hardening

- [x] kanonischer `createGeminiResearchFreeTierRuntime()`
- [x] `paidBillingPermitted=false`
- [x] `gemini-2.5-flash` gepinnt (Free-Tier-Vertrag am 2026-08-19 verifiziert)
- [x] Modell-/Paid-Preis-Overrides aus kanonischem Entry-Point entfernt/ignoriert
- [x] lokale Input-/Output-/Search-Unit-Costs auf 0 erzwungen
- [x] `GEMINI_RESEARCH_FREE_TIER_ONLY=true`
- [x] `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false` sicherer Blueprint-Default / zweiter Kill-Switch
- [x] Free-Tier-Key muss aus Projekt ohne Billing-Verknüpfung stammen
- [x] lokales hartes Request-Cap 100/Tag; Blueprint Default 50/Tag
- [x] Canonical server index exponiert keinen Paid-Runtime-Factory
- [x] Free-Tier-Regressionstests implementiert
- [x] Owner bestätigt 2026-08-19: Free-Tier `GEMINI_API_KEY` ohne Billing liegt in `finance-secrets.env`
- [x] Render Service Attestation gesetzt: `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true`; `GEMINI_RESEARCH_FREE_TIER_ONLY=true`
- [x] Render Shadow Kill-Switch bleibt ausdrücklich `GEMINI_RESEARCH_SHADOW_ENABLED=false`
- [x] PR #416 CI #1790: TypeScript, komplette Unit-Suite, Production Build, CSP, Deployment Readiness und Docker PASS
- [x] Main-Sync PR #418: nach Merge von PR #419 erneut validiert; CI #1799 + Governance #1121 PASS; Human Merge `main@ca968b25`
- [ ] Shadow-Consumer gezielt verdrahten und Coverage/Latenz/Quota messen
- [ ] reale Source-Policy + Lizenzfreigaben je Domain/Field
- [ ] field-spezifische Promotion zu `ScoringEvidenceRef` — separat Owner-gated

Evidence:
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`

Runbook: `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`.

### Phase B — Consumer Migration

- [x] `/api/crypto/score` über UAI + Registry-Resolution; bestehender verified Executor bleibt unverändert
- [x] `/api/crypto/list` + `/api/crypto/top10` über dieselbe Registry-Resolution — **Implementation auf aktuellem Execution Branch; PR/CI/Human Merge noch offen**
- [ ] Traditional stock/forex/index mit CanonicalResultAdapter
- [ ] Commodity/Sovereign Executor aus `registryRoutes` extrahieren
- [ ] Registry routes über UAI + Registry-Resolution
- [ ] Meme/Raw-Materials direkte Modellwahl hinter kanonische Adapter setzen oder retire
- [ ] `/api/crypto/analyze` auf Research-/Enrichment-Semantik begrenzen; Research Evidence ausschließlich über `ResearchEvidenceAdapter`

#### Phase B Crypto list/top10 migration

- [x] `assetRegistry`-Assets werden mit UAI-Quelle `registry` normalisiert
- [x] `/list` führt Registry-Resolution vor verified Scoring aus
- [x] `/top10` führt Registry-Resolution vor verified Scoring aus
- [x] inkompatible Registry-Auflösung ruft keinen Scoring-Executor auf
- [x] `/list` hält auch Registry-Fehler im vollständigen `CanonicalScoreResult`-Envelope
- [x] `/top10` schließt nicht auflösbare Assets vor Ranking/Eligibility aus
- [x] UAI assetId + Model Registry Metadata in erfolgreiche `/list`-/`/top10`-Responses und Lineage aufgenommen
- [x] Score-Mathematik, Ranking/Eligibility, Provider- und Evidence-Gates unverändert
- [ ] PR-CI auf exaktem Branch-Head
- [ ] Human Merge + finaler Main-Abgleich

Evidence: `docs/evidence/sc-md/SC2_CRYPTO_LIST_TOP10_REGISTRY_CONSUMERS_2026-08-19.md`.

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
- kein Market-Data-Provider-Routing-/executionPriceEligible-Flip;
- keine neuen synthetischen/LLM-basierten Finanzmerkmale;
- keine automatische Evidence-Promotion aus AI-Ausgaben;
- keine Gemini-Aufnahme in das Anthropic/OpenAI-Agent-Routing;
- keine öffentliche Gemini-Research-Route in Phase A.6;
- **keine kostenpflichtige Gemini-Nutzung**.

## Enterprise-/FinTech-Abgleich — verifiziert 2026-08-19

Die Registry übernimmt zentrale Versionierung, kontrollierte Deployment-Aliase, nachvollziehbare Modellmetadaten und fail-closed Promotion. Nach `/score` verschiebt der aktuelle Phase-B-Schritt auch für `/list` und `/top10` die tatsächliche Modellautorität aus den Routes in dieselbe Registry und schreibt die Auswahl in die Scoring-Lineage.

Das folgt dem am 17.04.2026 veröffentlichten Federal Reserve/OCC/FDIC Model-Risk-Governance-Muster (SR 26-2): risikobasierte Model Use, Model Inventory, Dokumentation, Governance/Controls, Validierung und laufendes Monitoring werden als zusammenhängender Lifecycle behandelt. Die Guidance fokussiert traditionelle statistische/quantitative und nicht-generative/nicht-agentische AI-Modelle. Sie wird hier als technischer Enterprise-Benchmark genutzt; daraus wird keine konkrete aufsichtsrechtliche Einstufung von CAPITAL-AI abgeleitet.

NIST AI RMF 1.0 bleibt ergänzender freiwilliger Benchmark für Governance, Inventory, Traceability und Lifecycle-Risikomanagement. NIST weist aktuell darauf hin, dass AI RMF 1.0 überarbeitet wird; SC-2 unterstellt keine bereits finale Nachfolgeversion.

UAI/Evidence-Trennung verhindert weiterhin, dass Asset-Katalogdaten oder AI-Outputs stillschweigend zu Finanz-Evidence werden. Gemini bleibt vor dem Evidence Gate und default-off. Produktive Score-Wirkung erfordert weiterhin separat versionierte und reviewbare Evidence-/Feature-Contracts. Outcome-/Walk-Forward-Validierung bleibt SC-8.

## Main-Korrelation 2026-08-19

PR #421 wurde nach dem vorherigen Merge von PR #422 erneut gegen `main@3ed1d6063394a65e9bdc0b46629929ebfc9ff067` validiert. Der Revalidation-Head `c8764901` bestand CI #1815 und Governance #1134 und wurde Human-gemerged. Aktuelle SC-2-Baseline ist damit `main@5976e4d2eb1c0d11303322b027b8be42e261583a`.

Der aktuelle Execution-Branch `agent/sc2-crypto-list-top10-registry-consumers` wurde frisch von diesem Commit erstellt.

Open-PR-Korrelation bei Branch-Start:

- PR #423: ausschließlich `docs/evidence/m10/M10_SHADOW_ASSURANCE_PROBE_2_2026-08-19.md`; kein Pfad-Overlap.
- PR #414: Privacy/Legal/Runtime-Scope; kein Pfad-Overlap mit den hier beanspruchten SC-2-Dateien.

Korrelationsentscheidungen:

- `ADR-0086` bleibt Governance Authority; SC-2 verwendet `ADR-0087`–`ADR-0090`.
- M10 Shadow Assurance bleibt fachlich getrennt von Scoring Model Selection.
- `/list` und `/top10` verwenden denselben Resolver/Executor-Vertrag wie `/score`, erzeugen aber noch **keinen** Phase-C-Dispatcher.
- Registry-Fehler bleiben fail-closed; Top10 kann bei fehlender Model-Autorisierung kein Asset aufnehmen.
- Vor PR-Abschluss wird der Branch erneut gegen den dann aktuellen `main` korreliert.

## Definition of Done SC-2

SC-2 ist erst `LANDED`, wenn alle produktiven Score-Einstiegspunkte über UAI + Registry laufen und kein paralleler Model-Selection-Pfad mehr einen extern sichtbaren Score erzeugen kann. Research-/AI-Provider dürfen nur über die kanonische Research/Evidence-Grenze einspeisen. Vor PR-Abschluss wird jeder ausführende Branch erneut gegen den aktuellen `main` verglichen und bei Korrelationen angepasst.
