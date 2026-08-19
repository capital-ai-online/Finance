# SC-2 — Model Registry & Universal Asset Interface

**SPT:** `SC-MD-SPT-0001`  
**Version:** 1.0.7  
**Status:** IN IMPLEMENTATION — Phase C3 global multi-asset exit implemented, validation pending  
**Execution Branch:** `agent/sc2-global-multi-asset-exit`  
**Pull Request:** #435  
**Baseline:** `main@3ed2b2e9c9421bc979ca2487610a6a49a655e888`  
**Historical Integration:** PR #418 stack; #421 `/score`; #424 `/list` + `/top10`; #427 C1; #428 C2a; #430 C2b; all Human-merged after required main revalidation  
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
   -> ScoringDispatcher
   -> Domain Executor Adapter
   -> CanonicalScoreResult
   -> Ranking / Eligibility
   -> EventMesh / Traceability / Supervisor
```

Kein öffentlicher produktiver Score-Pfad darf Modellwahl, Evidence-Bypass oder Result-Semantik außerhalb dieser Kette besitzen. AI-/Research-Provider dürfen keine zweite Scoring- oder Provenance-Architektur erzeugen.

## A1 — Architecture Freeze & Parallel-Path Inventory

| Pfad | Rolle nach C3-Branch | Ziel |
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
- [x] Traditional stock/forex/index mit CanonicalResultAdapter — C3 Branch
- [x] Commodity/Sovereign Executor hinter Dispatcher gebunden — C3 Branch
- [x] Registry routes über UAI + Registry + Dispatcher — C3 Branch
- [x] Meme produktiv über Crypto-Champion/Dispatcher; Raw-Materials Structural Score research-only — C3 Branch
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

### C3 — Global Multi-Asset Exit — IMPLEMENTED, VALIDATION PENDING

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
- [x] PR #435 erst nach Abschluss der statischen Pre-PR-Arbeit für zwingende Repository-Validierung erstellt
- [x] PR-Creation-Race mit Merge von #432 erkannt und Branch verlustfrei auf `main@3ed2b2e9...` synchronisiert; `DOC-ADR-0091` erhalten
- [ ] Governance PASS auf finalem Head
- [ ] M10 Owner-Passkey `AUTHORIZE_PR_CI` auf exaktem PR-Head
- [ ] required CI PASS
- [ ] Post-CI Main-/Open-PR-Race-Check; #433 Registry-Einträge bei vorherigem Merge additiv reconciliieren
- [ ] Human/CODEOWNER Merge

**Global Phase C bleibt `IN IMPLEMENTATION`, bis C3 validiert und Human-gemerged ist.**

## Nicht-Ziele

- keine Änderung von Scoring-Gewichten;
- keine Änderung von Ranking-/Eligibility-Schwellen;
- kein `scoreImpact`-/`rankingImpact`-Flip;
- kein Market-Data-Provider-Routing-/executionPriceEligible-Flip;
- keine neuen synthetischen/LLM-basierten Finanzmerkmale;
- keine automatische Evidence-Promotion aus AI-Ausgaben;
- keine Gemini-Aufnahme in Anthropic/OpenAI-Agent-Routing;
- **keine kostenpflichtige Gemini-Nutzung**.

## Enterprise-/FinTech-Abgleich — verifiziert 2026-08-19

Die am 17.04.2026 veröffentlichte Federal Reserve/OCC/FDIC Revised Guidance on Model Risk Management (SR 26-2) dient als aktueller Enterprise-Benchmark für den deterministischen Modellbestand. Das relevante Engineering-Muster ist die Verbindung von intended model use, inventory, governance/controls, validation, Dokumentation und laufendem Monitoring. C3 reduziert die verbleibenden produktiven Multi-Asset-Modellexecution-Surfaces auf eine identifizierbare UAI-/Registry-/Dispatcher-Autorität und bindet Modell-ID, Version, Alias und Executor an die Runtime-Lineage.

NIST AI RMF 1.0 bleibt ergänzender freiwilliger Lifecycle-/Traceability-Benchmark; NIST weist aktuell darauf hin, dass AI RMF 1.0 überarbeitet wird. Eine spätere finale Revision wird nicht vorweggenommen.

## Main-Korrelation 2026-08-19

- PR #427 C1 Human-gemerged.
- PR #428 C2a Human-gemerged.
- PR #430 C2b Human-gemerged. Unmittelbar davor wurde PR #429 M10 Controlled Cutover gemerged; #430 wurde danach mit `main@00be77c3...` synchronisiert und enthielt gegen diese Basis weiterhin exakt die sieben C2b-Dateien.
- C3 startete von `main@2d8e482174e97601d4343249e50d208ccf6f6355` auf `agent/sc2-global-multi-asset-exit`.
- Beim statischen Pre-PR-Abgleich war C3 `6 ahead / 0 behind`, 22 Dateien. PR #432 und #433 hatten jeweils nur `docs/governance/document-registry.json` als direkten Overlap; keine Scoring-/Runtime-Datei.
- Während PR #435 angelegt wurde, merge-te #432 und verschob Main auf `3ed2b2e9c9421bc979ca2487610a6a49a655e888`. C3 wurde sofort als zweiparentiger Main-Sync reconciled; alle #432-Dateien und `DOC-ADR-0091` sind erhalten.
- PR #433 ist weiterhin additive M10-Closure-Parallel-Arbeit und muss bei vorherigem Merge vor C3-Merge-Readiness in der Document Registry berücksichtigt werden.
- Nach #429 gilt für neue kostenintensive PR-CI der M10 Passkey/WebAuthn `AUTHORIZE_PR_CI`-Pfad; Human Merge bleibt separat.
- Die durch PR #414 entstandene ADR-0086-Nummernkollision bleibt separates Governance-Remediation-Item; ADR-0087 ist die fachliche Single-Scoring-Architecture-Authority.

## Definition of Done SC-2

SC-2 ist erst `LANDED`, wenn alle produktiven Score-Einstiegspunkte über UAI + Registry + einen kanonischen Dispatcher laufen und kein paralleler Model-Selection-Pfad mehr einen extern sichtbaren produktiven Score erzeugen kann. Research-/AI-Provider dürfen nur über die kanonische Research/Evidence-Grenze einspeisen. Vor PR-Abschluss wird jeder ausführende Branch erneut gegen den aktuellen `main` verglichen und bei Korrelationen angepasst. Seit M10 Controlled Cutover muss kostenintensive PR-CI zusätzlich für den exakten aktuellen Head durch den Owner-Passkey-Pfad autorisiert werden.
