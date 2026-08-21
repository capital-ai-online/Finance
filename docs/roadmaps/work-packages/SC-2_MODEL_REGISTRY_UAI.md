# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Version:** 1.0.10  
**Status:** C3 LANDED — P0 VALIDATED — P1 UNIVERSE AVAILABILITY VALIDATED  
**Execution Branch:** `feature/fintech-orchestrator-p0-multiclass-integrity`  
**Pull Request:** #475 — Ready for Review  
**Baseline:** `main@6c90c04de8924b8783f23ab4789afa810e9ea3a8`  
**Validated application head:** `779ec87fa7b214c37387ed0a8c30abfe02809eb0`  
**Historical Integration:** PR #418 stack; #421 `/score`; #424 `/list` + `/top10`; #427 C1; #428 C2a; #430 C2b; #435 C3 global multi-asset exit; all Human-merged after required main revalidation  
**Start:** 2026-08-19  
**P0-Revalidation:** 2026-08-21  
**P1-Validation:** 2026-08-21  
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
   -> ScoringDispatcher
   -> Domain Executor Adapter
   -> CanonicalScoreResult
   -> Ranking / Eligibility
   -> EventMesh / Traceability / Supervisor
```

Kein öffentlicher produktiver Score-Pfad darf Modellwahl, Evidence-Bypass oder Result-Semantik außerhalb dieser Kette besitzen. AI-/Research-Provider dürfen keine zweite Scoring- oder Provenance-Architektur erzeugen.

## A1 — Architecture Freeze & Parallel-Path Inventory

| Pfad | Rolle nach C3 | Ziel |
|---|---|---|
| `/api/crypto/score`, `/list`, `/top10` | Dispatcher | kanonisch |
| `/api/crypto/analyze` | Research/Enrichment-only | keine Score-Wirkung |
| `DeFiOrchestration` | konsumiert `/api/crypto/score` | kanonisch |
| Market-Data Crypto/Stock/Forex/Index/Commodity/Bond | globaler Evidence-Adapter -> Dispatcher | kanonisch |
| `cryptoScoringService.ts` | verified Domain Engine | Executor hinter Dispatcher |
| Meme public score | Crypto champion via Dispatcher | kein separater produktiver Meme-Score |
| Raw Materials Orchestrator | strukturelles Research/Sandbox, `scoreEligible=false` | nicht-produktiv |
| Raw Materials `/verified-score` | Commodity Evidence -> Dispatcher | kanonisch |
| TraditionalAssetScoring | Domain Engine + CanonicalResultAdapter | Dispatcher-only produktiv |
| Commodity/Sovereign | Domain Evidence Engines | Dispatcher-only produktiv |
| Registry verified-score/batch/context | Evidence Acquisition -> Dispatcher | kanonisch |
| Individual Bond | Evidence/Model nicht freigegeben | blocked / `SCORE_NOT_COMPUTABLE` |
| `server.application.ts` historische Multi-Asset-Modelzweige | durch C3-Guards produktiv unerreichbar | non-authoritative compatibility dead code |

Vollständige Baseline: `docs/evidence/sc-md/SC2_A1_A2_BASELINE_2026-08-19.md`. C3 Evidence: `docs/evidence/sc-md/SC2_GLOBAL_MULTI_ASSET_EXIT_2026-08-19.md`.

## A2 — UAI + ScoringModelRegistry

### Phase A — Foundation

- [x] UAI Identity Contract `uai/1.0.0`
- [x] Adapter für `RegistryAsset` und `AssetCatalogCandidate`
- [x] immutable, Git-versionierte `ScoringModelRegistry`
- [x] Champion/Challenger/Legacy/Blocked Lifecycle-Metadaten
- [x] fail-closed Resolver bei fehlendem oder mehrdeutigem Champion
- [x] vorhandene verifizierte Model-Familien initial registriert
- [x] `/api/crypto/score` erster produktiver Registry-Consumer — PR #421

### Phase A.5 — Research-/Extraction-/Evidence-Discovery Re-Entry Boundary

- [x] providerneutraler `ResearchEvidenceAdapter`-Contract
- [x] UAI-gebundener `ResearchEvidenceCandidate` mit `AI_DISCOVERED_EVIDENCE`
- [x] harte Invariante `scoreEligible=false` für Discovery + Source Validation
- [x] Source-Policy-Klassen und öffentliche HTTPS-/SSRF-nahe URL-Grenzen
- [x] Gemini Adapter/Transport Interface + provider-owned Citation Binding
- [x] Function Calling deaktiviert
- [x] Regressionstests implementiert

Evidence: `docs/evidence/sc-md/SC2_GEMINI_RESEARCH_EVIDENCE_ADAPTER_2026-08-19.md`.

### Phase A.6 — Server-only Gemini Research Shadow Runtime

- [x] server-only Gemini Research Transport
- [x] `GEMINI_RESEARCH_SHADOW_ENABLED=false`
- [x] Free-Tier-only / Paid Mode verboten
- [x] Rate-/Request-/Token-Budgets + CircuitBreaker + Provider Health
- [x] prompt-/secret-freie Audit-Telemetrie
- [x] `store=false` / `background=false`
- [x] `gemini-2.5-flash` gepinnt
- [x] Render Free-Tier-Attestation gesetzt; Shadow Kill-Switch bleibt `false`
- [ ] Shadow-Consumer gezielt verdrahten und Coverage/Latenz/Quota messen
- [ ] reale Source-Policy + Lizenzfreigaben je Domain/Field
- [ ] field-spezifische Promotion zu `ScoringEvidenceRef` — separat Owner-gated

Evidence:
- `docs/evidence/sc-md/SC2_GEMINI_SHADOW_TRANSPORT_2026-08-19.md`
- `docs/evidence/sc-md/SC2_GEMINI_FREE_TIER_ONLY_2026-08-19.md`

Runbook: `docs/runbooks/GEMINI_RESEARCH_SHADOW.md`.

## Phase B — Consumer Migration

- [x] `/api/crypto/score` über UAI + Registry — PR #421
- [x] `/api/crypto/list` + `/api/crypto/top10` — PR #424
- [x] Traditional stock/forex/index mit CanonicalResultAdapter — C3
- [x] Commodity/Sovereign Executor hinter Dispatcher gebunden — C3
- [x] Registry routes über UAI + Registry + Dispatcher — C3
- [x] Meme produktiv über Crypto-Champion/Dispatcher; Raw-Materials Structural Score research-only — C3
- [x] `/api/crypto/analyze` Research-/Enrichment-only — PR #427

## Phase C — Single Dispatcher Exit

### C1 — Standard-Crypto Router/UI Dispatcher Exit — LANDED

- [x] `ScoringDispatcher` als kanonische Model-Execution-Grenze
- [x] UAI + Registry + Executor-/Evidence-/Result-Contract-Check
- [x] `/api/crypto/score`, `/list`, `/top10` dispatcher-only
- [x] `/api/crypto/analyze` ohne Score/Rank/Eligibility/Value Corridor
- [x] `DeFiOrchestration` konsumiert kanonischen API-Score
- [x] Human Merge PR #427

Evidence: `docs/evidence/sc-md/SC2_CANONICAL_SCORING_DISPATCHER_2026-08-19.md`.

### C2 — Composition Root / Legacy Standard-Crypto Exit — LANDED

#### C2a — Operational Exit — LANDED

- [x] Standard-Crypto Market-Data-Score ausschließlich Dispatcher
- [x] fehlende verified Evidence -> `score=null`
- [x] Legacy Standard-Crypto GET/POST vor historischem Handler abgefangen
- [x] `/api/charts-scoring` `simulation-only`, `scoreEligible=false`, `productionScoring=false`
- [x] Human Merge PR #428

Evidence: `docs/evidence/sc-md/SC2_COMPOSITION_ROOT_CRYPTO_EXIT_2026-08-19.md`.

#### C2b — Physical Legacy Cleanup — LANDED

- [x] Cold-Start-Fallback hinter kanonischer Enrichment-Grenze
- [x] Standard-Crypto Base/DeFi-/Heuristik-Zweig physisch aus `server.application.ts` entfernt
- [x] duplizierten lokalen `/api/charts-scoring` Handler entfernt
- [x] C2b Regressionstest
- [x] PR #429 M10 Controlled Cutover vor #430 korreliert; #430 danach mit neuem Main synchronisiert
- [x] Human Merge PR #430 -> `main@2d8e482174e97601d4343249e50d208ccf6f6355`

Evidence: `docs/evidence/sc-md/SC2_PHYSICAL_LEGACY_CRYPTO_CLEANUP_2026-08-19.md`.

### C3 — Global Multi-Asset Exit — LANDED

- [x] Traditional/Commodity/Sovereign/Meme/Raw-Materials produktive Adapter in Dispatcher gebunden bzw. Research-only retired
- [x] Registry productive scoring routes importieren keine Traditional/Commodity/Sovereign Scoring Engine direkt
- [x] alle neu migrierten extern sichtbaren produktiven Score-Resultate `CanonicalScoreResult`
- [x] Meme public scoring fällt nicht mehr zum separaten Legacy-Modell durch
- [x] Raw-Materials Structural Score ausdrücklich `canonical=false`, `scoreEligible=false`
- [x] `/api/charts-scoring` bleibt ausdrücklich nicht-produktive Simulation
- [x] Market-Data-Composition interceptet alle scorable Klassen vor Legacy-Model-Selection
- [x] repo-weite Traceability enthält UAI assetId + modelId/version/alias/executor
- [x] repo-weiter struktureller Test beweist Single-Dispatcher-Reachability-Invariante
- [x] bestehende C2 Runtime-/Composition-Tests auf globale C3-Semantik aktualisiert
- [x] Governance/required CI auf finalem PR-Head abgeschlossen
- [x] M10 Owner-Passkey `AUTHORIZE_PR_CI` auf finalem PR-Head erfolgt
- [x] finaler Main-/Open-PR-Race-Check abgeschlossen
- [x] Human Merge PR #435

**Global Phase C ist mit PR #435 LANDED.** Die produktive Execution-Authority bleibt ein einzelner `ScoringDispatcher`.

## Phase D — P0 Multi-Class Integrity Hardening — VALIDATED

**Priorität:** P0 aus dem Scoring-Architektur-Precheck vom 2026-08-21.  
**Evidence:** `docs/evidence/sc-md/SC2_P0_MULTICLASS_INTEGRITY_2026-08-21.md`.

- [x] Crypto Champion auf `crypto-technical-provenance@0.7.0` versioniert
- [x] Meme-/DeFi-Modelle ausschließlich als `challenger`, `research-only`, `scoreEligible=false`
- [x] `exchange_liquidity` und `regime_bonus` aus produktiver Crypto-Faktorautorität entfernt
- [x] Caller-Classification aus Rank-Score-/Top-N-Autorität entfernt
- [x] `scoring-integrity/1.1.0` um effektive Feature-/Weight-Lineage erweitert
- [x] deterministische SHA-256 Effective-Feature-/Weight-Fingerprints implementiert
- [x] Evidence-Contract-Version in Feature-/Weight-Fingerprint gebunden
- [x] Nominal-Weights-Version in Effective-Weight-Fingerprint gebunden
- [x] `market-evidence-dq/1.0.0` als assetklassenneutrales Evidence-/Freshness-Envelope ergänzt
- [x] `VERIFIED` ohne Provenance oder innerhalb des Labels bereits veraltete Evidence fail-closed
- [x] `universe-sla/1.0.0` mit realem 24-Asset-Ziel je Klasse/Unterkategorie und No-Demo-Semantik ergänzt
- [x] fokussierte P0-Negativ-/Replay-Regressionen ergänzt
- [x] ADR-0087 innerhalb bestehender Authority revalidiert; keine neue ADR erzeugt
- [x] P0-Evidence dokumentiert
- [x] TypeScript PASS auf P0-Head `3af223c8ec7115f838ff0ec21188c7927fb5da8b`
- [x] vollständige Unit-Suite PASS auf P0-Head
- [x] Production Build/CSP/Deployment Readiness PASS auf P0-Head
- [x] finalen `main` vor Draft PR geladen und Branch als 0 behind bestätigt
- [x] Draft PR #475 nach erfolgreichem Main-Sync erstellt

## Phase E — P1 Universe Availability — VALIDATED

**Priorität:** expliziter P1-Folgeauftrag vom 2026-08-21.  
**Evidence:** `docs/evidence/sc-md/SC2_P1_UNIVERSE_AVAILABILITY_2026-08-21.md`.

- [x] `universe-availability-projection/1.0.0` als read-only Runtime Projection implementiert
- [x] ausschließlich bestehende Katalogidentitäten und reale Runtime-Evidence als Eingänge
- [x] `READY` + Provider + Evidence-ID + bestehende Screening-Eligibility als Availability-Gate
- [x] Top-Level-Ziel 24 je Assetklasse über `universe-sla/1.0.0`
- [x] Ziel 24 je bestehender Unterkategorie (`subtype`, ersatzweise `instrumentKind`)
- [x] `screeningBatchGovernance` um nicht-autorisierende Universe-Projection ergänzt
- [x] `UniverseBestWorst` um reale SLA-Anzeige je Klasse/Unterkategorie ergänzt
- [x] bestehendes 50-Symbol-Batch-Limit erkannt und durch sequenzielle Batches `<=50` eingehalten
- [x] Kandidatenscope bleibt maximal 24 je Assetklasse; keine Filler/Synthetic/Demo-Daten
- [x] erster P1-Lauf: TypeScript PASS
- [x] erster P1-Lauf: Unit-Suite PASS — 283 Testdateien / 1713 Tests PASS, 2 skipped
- [x] Production-Build-Ursache auf serverseitigen Scoring-Barrel im Browsergraphen eingegrenzt
- [x] Browser-/Server-Importgrenze ohne Polyfill/neue Dependency korrigiert
- [x] Regressionstest gegen erneuten `platform/Scoring`-Barrel-/`node:crypto`-Leakage ergänzt
- [x] finaler P1 Klasse-C-Lauf auf Application-Head `779ec87fa7b214c37387ed0a8c30abfe02809eb0`: TypeScript PASS
- [x] finaler P1 Klasse-C-Lauf: vollständige Unit-Suite PASS
- [x] finaler P1 Klasse-C-Lauf: Production Build PASS
- [x] finaler P1 Klasse-C-Lauf: CSP PASS
- [x] finaler P1 Klasse-C-Lauf: Deployment Readiness PASS
- [x] Workflow Run #2199 / `32528148989`: PASS
- [x] finaler Current-Main-/Open-PR-Race-Check nach grünem P1-CI: PASS
- [x] PR #475 nach erfolgreichem Pflicht-Gate auf Ready for Review gesetzt

## Change Boundaries / Nicht-Ziele

- C3 selbst änderte keine Scoring-Gewichte; P0 enthält **eine explizit versionierte Crypto-0.7.0-Modelländerung**, die nicht symmetrisch belegbare Legacy-Faktoren aus der kanonischen Faktorautorität entfernt.
- P1 ändert keine Scoring-Gewichte, Ranking-/Eligibility-Schwellen oder Model-Selection.
- kein `scoreImpact`-/`rankingImpact`-Flip;
- kein Market-Data-Provider-Routing-/executionPriceEligible-Flip;
- keine neuen synthetischen/LLM-basierten Finanzmerkmale;
- keine automatische Evidence-Promotion aus AI-Ausgaben;
- keine neue Scoring-, Dispatcher-, Governance-, Discovery- oder Provenance-Architektur;
- P1 erhöht die Zahl der vorgesehenen 24 Kandidaten je Assetklasse nicht; die Batch-Korrektur verhindert nur serverseitiges Abschneiden nach 50 Symbolen;
- keine zusätzliche Datenbank, persistente Availability-Historie oder periodischer Provider-Warmup;
- keine Browser-Polyfills für serverseitiges `node:crypto`.

## Enterprise-/FinTech-Abgleich — revalidiert 2026-08-21

Die am 17.04.2026 veröffentlichte Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management (SR 26-2 / OCC Bulletin 2026-13) dient weiterhin als aktueller Enterprise-Benchmark für den deterministischen Modellbestand. Das relevante Engineering-Muster ist die Verbindung von intended model use, inventory, governance/controls, validation, Dokumentation und laufendem Monitoring. P0 stärkt insbesondere Model Inventory/Champion Authority, Evidence-Qualität, revisionssensitive Lineage und reproduzierbare effektive Gewichte.

NIST AI RMF 1.0 bleibt ergänzender freiwilliger Lifecycle-/Traceability-/TEVV-Benchmark. Etablierte OSS-Muster aus MLflow Model Registry, OpenLineage und Feast wurden geprüft; ein Runtime-Einbau wurde für P0 verworfen, weil die vorhandene Git-gesteuerte Registry-/Evidence-/Lineage-Architektur bereits dieselbe fachliche Rolle erfüllt und zusätzliche Komponenten Duplikation, Dependencies und Betriebsaufwand erzeugen würden.

P1 orientiert die Availability-Auswertung an real beobachteter Runtime-Evidence statt an bloßer Katalogpräsenz. Ein zusätzlicher SLO-/Telemetry-Stack wurde verworfen; die bestehende Screening-Governance und der vorhandene UI-Evaluationspfad werden wiederverwendet.

## Main-Korrelation

### 2026-08-19 — C3

- PR #427 C1 Human-gemerged.
- PR #428 C2a Human-gemerged.
- PR #430 C2b Human-gemerged.
- C3 wurde mehrfach mit zwischenzeitlichen Main-Merges reconciled und schließlich via PR #435 Human-gemerged.
- ADR-0087 bleibt die fachliche Single-Scoring-Architecture-Authority.

### 2026-08-21 — P0 Multi-Class Integrity

- P0-Branch wurde von `main@6c90c04de8924b8783f23ab4789afa810e9ea3a8` übernommen.
- Draft PR #475 wurde erst nach erneutem Main-Load und 0-behind-Check erstellt.
- P0-Head `3af223c8ec7115f838ff0ec21188c7927fb5da8b` bestand TypeScript, vollständige Unit-Suite, Production Build, CSP und Deployment Readiness.

### 2026-08-21 — P1 Universe Availability

- vor P1 erneut `main@6c90c04de8924b8783f23ab4789afa810e9ea3a8` geladen; Branch 24 ahead / 0 behind.
- offene PRs #471 und #474 geprüft; kein direkter Dateioverlap mit P1.
- erster P1-Head `42691ac327e02645677e9b6cfb0fd3fb34572c42`: TypeScript und vollständige Unit-Suite PASS.
- erster P1 Production Build identifizierte ausschließlich eine Browser-/Server-Importgrenze über den Scoring-Barrel; fachliche P1-Tests blieben grün.
- Application-Fix-Head `779ec87fa7b214c37387ed0a8c30abfe02809eb0`: finaler Klasse-C-Lauf #2199 vollständig PASS einschließlich Production Build, CSP und Deployment Readiness.
- nach finalem CI erneut `main@6c90c04de8924b8783f23ab4789afa810e9ea3a8` geladen: Branch 26 ahead / 0 behind, Merge-Base exakt `main`.
- PR #471 und #474 erneut dateibasiert korreliert; kein direkter Dateioverlap mit P0/P1.
- keine Git-, semantischen oder architektonischen Konflikte festgestellt; kein Rebase/Merge erforderlich.

## Definition of Done SC-2 P0/P1

SC-2 besitzt seit C3 genau einen produktiven UAI-/Registry-/Dispatcher-Exit. P0 und P1 sind technisch validiert:

1. produktive Modell- und Faktorautorität bleibt eindeutig und versioniert;
2. Challenger besitzen keine implizite Score-Wirkung;
3. Evidence-/Freshness-Gates bleiben fail-closed;
4. effektive Feature-/Weight-Semantik ist reproduzierbar und revisionssensitiv in der Lineage gebunden;
5. Universe Availability zählt ausschließlich reale, zugelassene UAI-Identitäten;
6. Top-Level- und bestehende Unterkategorie-SLAs weisen den realen Zustand gegen Ziel 24 aus;
7. der UI-/Batch-Pfad überschreitet die serverseitige 50-Symbol-Grenze nicht still;
8. Browser-/Server-Importgrenzen werden ohne Polyfill-Leakage eingehalten;
9. TypeScript, vollständige Unit-Suite, Production Build, CSP und Deployment Readiness sind auf dem finalen Application-Head PASS;
10. Branch wurde nach finalem CI erneut mit aktuellem `main` und offenen Parallel-PRs korreliert;
11. PR #475 ist Ready for Review; Merge bleibt ausschließlich Human/CODEOWNER-gated.
