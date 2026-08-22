# SC-2 P0 Multi-Class Integrity Evidence — 2026-08-21

**Authority:** `SC-MD-SPT-0001` → `SC-2_MODEL_REGISTRY_UAI` → ADR-0087  
**Branch:** `feature/fintech-orchestrator-p0-multiclass-integrity`  
**Baseline:** `main@6c90c04de8924b8783f23ab4789afa810e9ea3a8`  
**Scope:** P0-Härtung der bestehenden Single-Dispatcher-Scoring-Architektur; keine neue Scoring-, Daten-, Governance- oder Execution-Authority.

## 1. Ausgangslage

SC-2/C3 hat den globalen produktiven Multi-Asset-Exit bereits auf UAI, `ScoringModelRegistry`, `ScoringDispatcher`, Domain Executor Adapter und `CanonicalScoreResult` konsolidiert. Diese P0-Arbeit ersetzt C3 nicht. Sie schließt Integritäts- und Traceability-Lücken innerhalb derselben kanonischen Kette.

Priorität aus dem Chat-/Architektur-Precheck vom 2026-08-21:

1. produktive Modellautorität über Assetklassen eindeutig halten;
2. Meme-/DeFi-Evidence nicht als parallele produktive Scoring-Authority behandeln;
3. Caller-/Legacy-Felder aus Score-/Ranking-Autorität entfernen;
4. Replay-/Lineage-Nachweis für tatsächlich verwendete Features und Gewichte herstellen;
5. Evidence/DQ fail-closed und freshness-aware machen;
6. mindestens 24 reale Assets je Klasse/Unterkategorie als Verfügbarkeitsziel definieren, ohne No-Demo-Data-Verstöße.

## 2. Implementierter P0-Stand

### 2.1 Model Registry 1.1.0

- `crypto-technical-provenance@0.7.0` ist der einzige produktive Crypto-Champion.
- `crypto-meme-integrity@0.1.0` und `crypto-defi-fundamental@0.1.0` sind `challenger`, `research-only` und `scoreEligible=false`.
- doppelte Model-ID/Version wird abgewiesen;
- konkurrierende kanonische Champion-Scopes werden fail-closed abgewiesen;
- Challenger können nicht versehentlich scorefähig registriert werden;
- fehlender Champion liefert `SCORE_NOT_COMPUTABLE`, keinen Legacy-Fallback.

### 2.2 Single Dispatcher 1.1.0

Der vorhandene `ScoringDispatcher` bleibt einzige produktive Model-Execution-Grenze. P0 bindet zusätzliche Registry-/Result-Lineage, ohne einen zweiten Dispatcher zu erzeugen.

Runtime-Lineage umfasst mindestens:

- UAI `assetId`;
- Feature-Contract-Version;
- Dispatcher-Version;
- Model-Registry-Version;
- Model-ID und Model-Version;
- Alias/Lifecycle;
- Executor-Key;
- Result-Contract-Version.

### 2.3 Crypto Champion 0.7.0 — Faktorautorität

Kanonische Nominalgewichte enthalten nur:

- `trend`;
- `momentum`;
- `volatility_quality`;
- `breakout_quality`;
- `relative_strength`;
- `avg_daily_volume`;
- `supply_dynamics`;
- `data_quality_risk` als invertierten Risikofaktor.

`exchange_liquidity` und `regime_bonus` bleiben aus dem produktiven Score ausgeschlossen. Ein Legacy-Feld darf den `final_score` nicht beeinflussen. `regime_bonus` wird ausschließlich als rückwärtskompatibles Output-Feld mit Autorität `0` erhalten.

### 2.4 Caller-Classification besitzt keine Ranking-Autorität

Caller-/Request-Werte wie `classification.tier` oder `classification.confidence` dürfen weder Rank-Score noch Top-N-Eligibility erhöhen. Ranking nutzt nur die kanonisch freigegebenen Score-/DQ-Verträge.

### 2.5 Effektive Replay-Fingerprints

`effective-scoring-fingerprint/1.0.0` erzeugt deterministische SHA-256-Fingerprints für die tatsächlich scorefähige Auswertung.

Der Effective-Feature-Fingerprint bindet:

- Fingerprint-Version;
- Model-Version;
- Feature-Contract-Version;
- Evidence-Contract-Version;
- sortierte Feature-Menge mit `PRESENT|MISSING` und Inversionssemantik.

Der Effective-Weight-Fingerprint bindet zusätzlich:

- Nominal-Weights-Version;
- die nach Missing Evidence tatsächlich wirksamen, deterministisch renormalisierten Gewichte.

Damit kann eine Contract-/Weight-Revision nicht denselben Replay-Fingerprint behalten, nur weil die aktuell beobachteten Zahlen zufällig identisch geblieben sind.

### 2.6 Market Evidence / DQ 1.0.0

Das assetklassenneutrale Evidence-Envelope trennt Identity von Evidence und kennt explizite Zustände `VERIFIED`, `STALE`, `UNAVAILABLE`, `INVALID`, `CONFLICTING`, `NOT_APPLICABLE`.

`VERIFIED` ist nur admissible, wenn:

- Asset-, Provider-, Capability- und Field-Identität nicht leer sind;
- `observedAt`, `retrievedAt` und `freshness.evaluatedAt` valide Zeitstempel sind;
- ein nicht-leerer `evidenceRef` vorliegt;
- `ageMs` und `maxAgeMs` endlich und nicht negativ sind;
- `ageMs <= maxAgeMs` gilt.

Als `VERIFIED` markierte, tatsächlich veraltete Evidence wird fail-closed abgewiesen. Damit bleibt die neue P0-Schicht konsistent mit der bestehenden `DataQualityService`-Freshness-Semantik.

### 2.7 No-Demo Universe SLA 1.0.0

Verfügbarkeitsziel:

- mindestens 24 reale, deduplizierte und evidence-admitted Assets pro Top-Level-Assetklasse;
- Zielwert 24 auch pro ausgewiesener Unterkategorie.

Die SLA erzeugt niemals Symbole, Filler-Assets oder interpolierte Beobachtungen. Bei Nichterfüllung wird der reale Zustand ausgewiesen:

- `INSUFFICIENT_REAL_UNIVERSE`;
- `PROVIDER_DEGRADED`;
- `EVIDENCE_INSUFFICIENT`.

`hardMinimum=false` bedeutet: Die fachliche Zielgröße darf die No-Demo-Data-/Evidence-Regeln nicht überstimmen. P1 muss die reale Discovery-/Admission-Kette so erweitern, dass das Ziel durch echte Providerabdeckung erreicht wird.

## 3. Regressionen / Negative Controls

Die P0-Tests decken mindestens ab:

- nur Crypto Champion 0.7.0 wird produktiv aufgelöst;
- Meme/DeFi bleiben nicht scorefähige Challenger;
- konkurrierende Champion-Scopes werden abgewiesen;
- Legacy-Faktoren ändern den finalen Crypto-Score nicht;
- Fingerprints sind unabhängig von Object-Key-Reihenfolge;
- Missing Evidence ändert Effective-Feature-/Weight-Fingerprint und Effective Weights;
- Model-Version ändert Replay-Fingerprints;
- Evidence-Contract-Revision ändert Feature- und Weight-Fingerprint;
- Nominal-Weights-Version ändert den Weight-Fingerprint;
- Caller-Tier/-Confidence ändern Ranking/Eligibility nicht;
- `VERIFIED` ohne Provenance wird abgewiesen;
- `VERIFIED` mit überschrittener Freshness wird abgewiesen;
- 23 reale Assets bleiben 23 und melden `INSUFFICIENT_REAL_UNIVERSE`;
- 24 reale zugelassene Assets melden `AVAILABLE`.

## 4. Best-Practice-/State-of-the-Art-Abgleich

Primäre Benchmarks des Prechecks:

- Federal Reserve / OCC / FDIC, **Revised Guidance on Model Risk Management (SR 26-2 / OCC Bulletin 2026-13), 17.04.2026**: risikobasiertes Modellinventar, intended use, Governance, Validierung, Dokumentation und laufendes Monitoring;
- **NIST AI RMF 1.0** als ergänzender Lifecycle-/Traceability-/TEVV-Benchmark.

Etablierte Open-Source-Muster wurden vor Eigenentwicklung geprüft:

| Lösung | Relevanter Fit | Bewertung für diesen P0-Scope |
|---|---|---|
| MLflow Model Registry | Versionen, Aliases/Champion, Lineage, kontrollierte Promotion | fachlich passend, aber zusätzliche Runtime-/Ops-Abhängigkeit und Duplikation der bereits vorhandenen Git-gesteuerten Registry; nicht übernehmen |
| OpenLineage | offener Lineage-Standard | sinnvoll bei späterer systemübergreifender Pipeline-Lineage; für die lokale deterministische Score-Lineage aktuell unnötiger Integrationsaufwand; nicht übernehmen |
| Feast | Feature Registry / Feature Store | relevant bei zentralem Online-/Offline-Feature-Serving; im aktuellen Evidence-/Feature-Contract-Scope würde es eine zusätzliche Daten-/Serving-Schicht erzeugen; nicht übernehmen |

Ergebnis: Wiederverwendung der vorhandenen CAPITAL-AI-Registry-/Dispatcher-/Evidence-Verträge ist für P0 risikoärmer und architekturkompatibler als die Einführung eines zusätzlichen MLOps-Stacks.

## 5. Security, Compliance und Datenintegrität

- keine neue externe Trust Boundary;
- keine Secrets, Credentials oder produktive Plattformmutation;
- keine neue Supabase-/Render-/Stripe-Mutation;
- kein synthetisches Evidence-Fallback;
- keine automatische Challenger-Promotion;
- keine Caller-basierte Model-/Ranking-Autorität;
- veraltete `VERIFIED`-Evidence wird fail-closed;
- Replay-Lineage ist versionssensitiv;
- 24-Asset-Ziel darf keine No-Demo-Data-Regel überstimmen.

## 6. Offener nächster Schritt — P1

P1 ist **nicht** die Einführung eines neuen Orchestrators oder Dispatchers. P1 verdrahtet `UniverseSla` in die bestehende Asset-Discovery-/Evidence-Admission-/UI-Kette und misst je Assetklasse/Unterkategorie die reale Verfügbarkeit.

Dabei gelten weiterhin:

1. exakt eine UAI-/Registry-/Dispatcher-Authority;
2. Provider-/Catalog-Daten werden nicht automatisch zu Score-Evidence;
3. Meme/DeFi werden nur über echte, freigegebene Evidence-Contracts erweitert;
4. fehlende 24er-Abdeckung wird transparent als Gap ausgewiesen, nicht künstlich aufgefüllt;
5. bevor P1 produktive Provider-/Runtime-Surfaces verändert, erfolgt erneut ein eigener Main-/Best-Practice-/Korrelation-Precheck.

## 7. Validierungsstatus

- statischer Architektur-/Code-Review: **PASS**;
- zusätzliche P0-Negativkontrollen für Fingerprint-Versionen und stale `VERIFIED`-Evidence: **implementiert**;
- isolierter TypeScript-Compile der beiden neu gehärteten Contract-Module plus Runtime-Negativcheck für Versionsbindung/Freshness in der lokalen ChatGPT-Sandbox: **PASS**;
- repositoryweiter TypeScript-Check und Vitest-Suite: **vor PR nicht ausführbar, da der GitHub-Connector keinen lokalen privaten Repository-Checkout materialisiert; nicht als PASS behauptet**;
- finaler Main-Load/Korrelationscheck: **PASS — `main@6c90c04de8924b8783f23ab4789afa810e9ea3a8`, Branch 21 ahead / 0 behind vor diesem Evidence-Status-Commit**;
- offene PRs #471 und #474: **kein direkter Dateioverlap mit dem P0-Scoring-Scope**;
- Pull Request: **noch nicht erstellt**;
- kostenverursachende GitHub-CI: gemäß Projektregel erst nach PR-Erstellung.
