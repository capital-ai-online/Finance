# SC-2 Commodity P3-A — Shadow Runtime & Observability Evidence

**Datum:** 2026-08-26  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` → P3-A  
**Parent Authority:** ADR-0087 / ADR-0101  
**Branch:** `feat/commodity-p3a-shadow-observability-2026-08-26`  
**Basis:** `main@1a3d26bac1155954a3ab1cde0b72fac5e8351091`  
**Work Claim:** `COMMODITY-P3A-SHADOW-OBSERVABILITY-2026-08-26`

## 1. Ziel und Scope

P3-A soll reale Provider-/Model-Qualität vor einer späteren Commodity-Challenger-Promotion messbar machen, ohne Shadow-Ergebnisse in produktives Scoring, Ranking, Eligibility, Trading oder Execution einfließen zu lassen.

Dieser Slice implementiert die **Observability Foundation**:

1. bounded Provider-Runtime-Observations an der bestehenden `ResearchEvidenceProviderHttp`-Grenze;
2. Availability/Error/P95-Latency/Circuit-/Rate-Budget-Aggregation;
3. source-backed Commodity Shadow Observations über bereits governte `CommodityResearchFeatureSnapshot`s;
4. erneute deterministische Challenger-Evaluation und Registry-Bindung direkt an der Shadow-Grenze;
5. Feature-/DQ-/Evidence-/Fingerprint-Drift;
6. optionalen read-only Champion-Comparator;
7. sanitisierte kanonische `TelemetryRecord`-Evidence mit ADR-Referenz;
8. explizite Authority- und Regression-Gates.

Der P3-A Exit ist **nicht** erfüllt, solange keine definierte reale Beobachtungsperiode mit ausreichenden Samples und ohne ungeklärte P0/P1-Integrity-Findings vorliegt.

## 2. Wiederverwendete Architektur

| Bestehende Authority | Wiederverwendung in P3-A |
|---|---|
| `ProviderMatrix` | governte Provider-/Capability-Identität und Policies |
| `ResearchEvidenceProviderHttp` | einzige gemeinsame HTTP-Transportgrenze für offizielle Research-Evidence |
| `RateLimitBudget` | lokales Provider-/Capability-Budget |
| `CircuitBreaker` | CLOSED/OPEN/HALF_OPEN State |
| `ProviderHealth` | aktueller Supervisor-Zustand bleibt unverändert bestehen |
| `TelemetryRecord` | kanonischer operativer Telemetrievertrag |
| `CommodityResearchFeatureSnapshot` | source-backed Feature-/Freshness-/Coverage-Evidence |
| `CommodityCategoryResearchEvaluation` | wird im Observer deterministisch neu aus dem Snapshot erzeugt |
| `ScoringModelRegistry` | Challenger-Lifecycle/`scoreEligible=false` wird read-only erneut gebunden; Registry wird nicht mutiert |
| `ScoringDispatcher` | produktive Score-Authority; wird durch P3-A nicht umgangen oder erweitert |

Keine zweite Registry, kein zweiter Dispatcher, kein zweiter allgemeiner DQ-Service und kein neues Observability-SDK wurden eingeführt.

## 3. Provider Runtime Observability

`src/platform/MarketData/providerRuntimeObservability.ts` führt `provider-runtime-observability/1.0.0` ein.

Ein Sample enthält ausschließlich:

- Provider-ID;
- Capability;
- Observation-Zeitpunkt;
- Outcome;
- Dauer in Millisekunden;
- `payloadUsable` als technisches Boolean-Metadatum;
- Circuit-State;
- optionalen HTTP-Status;
- lokales Rate-Budget Remaining/Reset.

Explizit **nicht** gespeichert werden:

- URL oder Request-Pfad;
- Query/Parameter;
- Response-/Provider-Payload;
- API-Key/Secret;
- Provider-Rohdaten.

Der Ledger ist auf 2.000 Samples pro Prozess begrenzt. Aus den Samples werden Sample Count, Availability Rate, Error Rate, P95-Latency, Rate-Limit Events, Circuit-Open Events und letzter Budget-/Circuit-State berechnet.

`ResearchEvidenceProviderHttp` schreibt genau ein Runtime-Sample pro Ergebniszustand. Dadurch erhalten alle dort angebundenen Commodity-HTTP-Quellen dieselbe technische Beobachtungsgrenze, ohne provider-spezifische Parallelimplementierung.

## 4. Commodity Shadow Observation

`src/platform/Scoring/CommodityShadowObservability.ts` führt `commodity-shadow-observability/1.0.0` ein.

Der Observer akzeptiert ausschließlich:

- einen bereits klassifizierten `CommodityResearchFeatureSnapshot`;
- optional explizite Provider↔Feature-Bindings;
- optional einen bereits vorliegenden Canonical-Champion-Comparator.

**Caller-supplied Evaluation State wird absichtlich nicht akzeptiert.** Der Observer führt `evaluateCommodityCategoryResearchSnapshot()` selbst erneut aus und liest anschließend den zugehörigen Challenger-Descriptor aus der bestehenden `ScoringModelRegistry`. Damit können Status, Modellversion, Feature-Contract, Executor-Key, Lifecycle oder Fingerprints nicht als frei vertrauenswürdige Caller-Felder eingeschleust werden.

Feature-Contract-, Domain-/Instrument-Kind-, Registry- oder Authority-Verletzungen blockieren fail-closed. Provider↔Feature-Bindings müssen explizit sein; unbekannte Feature-Keys werden abgelehnt.

### Authority-Invarianten

Jede Shadow Observation ist unveränderlich:

- `canonical=false`;
- `scoreEligible=false`;
- `rankingEligible=false`;
- `executionEligible=false`;
- `registryMutationPerformed=false`.

### Challenger Score Stability

ADR-0101 hält die Kategorie-Challenger weiterhin bei:

- `researchCompositeScore=null`;
- `weightHypothesis.executable=false`.

Daher wäre eine numerische Challenger-Score-Drift in P3-A erfunden. Der Contract liefert stattdessen:

`NOT_APPLICABLE_UNTIL_EXECUTABLE_WEIGHTS`, `score=null`, `delta=null`.

Der bestehende Commodity-Champion kann optional read-only als Comparator mitgeführt werden. Sein Score-Delta sowie optional Feature-/Weight-Fingerprint-Wechsel sind reine Observation-Evidence.

## 5. Drift / Lineage

Zwischen zwei Beobachtungen desselben Asset/Challenger-Modells werden gemessen:

- Research-Status-Wechsel;
- Coverage-Delta;
- Required-Coverage-Delta;
- DQ-Delta;
- Anzahl geänderter Feature-Status;
- effective-feature-fingerprint change;
- evidence-fingerprint change;
- optional Champion Score-/Feature-/Weight-Fingerprint-Drift.

Der P3-A Evidence Fingerprint bindet ausschließlich Observation-Evidence content-addressed. Er ersetzt weder den bestehenden `effectiveFeatureFingerprint`/`effectiveWeightFingerprint` noch P2-B Dataset-/P2-C Promotion-Fingerprints.

## 6. Provider Freshness / Coverage

Provider Freshness wird **nicht** aus Transport-HTTP-Status abgeleitet. Sie wird ausschließlich aus den feldspezifisch klassifizierten Feature-Status des `CommodityResearchFeatureSnapshot` berechnet.

Providerzuordnung ist explizit über `CommodityShadowProviderBinding.featureKeys`. Es gibt keine Symbolheuristik und keine automatische Zuordnung eines generischen `commodity-benchmark` zu einem Kategorie-Challenger.

Damit bleiben:

- Provider-Laufzeitqualität (Transport) und
- Evidence-Freshness/Coverage (Feature Contract)

getrennte Messdimensionen.

## 7. Telemetry / Audit / Traceability

Jede Shadow-Beobachtung erzeugt einen `TelemetryRecord`:

- `stage=scoring-analysis`;
- `eventName=commodity.shadow.observation.completed`;
- `assetClass=commodity`;
- `auditReference=ADR-0101/P3-A`.

Die Attribute enthalten Modell-/Registry-/Contract-/Coverage-/Fingerprint-/Status-Metadaten, jedoch keine Provider-Rohwerte oder Secrets.

Die Enterprise Traceability Matrix wird **nicht** zur Laufzeit beschrieben. P3-A erzeugt operative Observation-/Audit-Evidence; ETM bleibt ein separat generierter Traceability-Prozess.

## 8. Budget / Rate Limit

P3-A führt keine zusätzlichen API-Aufrufe ein. Es beobachtet die bereits existierenden lokalen `RateLimitBudget`-Entscheidungen und persistiert pro Sample nur `remaining` und `resetAt`.

Damit gilt:

- vorhandene keyed-API-Budgets bleiben Authority;
- Observability erzeugt keinen eigenen Traffic;
- ein lokal abgelehnter Request wird als `RATE_LIMITED` beobachtet;
- ein offener Circuit wird ohne Provideraufruf als `CIRCUIT_OPEN` beobachtet.

## 9. Open-Source-/State-of-the-Art-Abgleich

Geprüft wurden OpenTelemetry JS und Prometheus `client_js` als etablierte Apache-2.0-Optionen. Beide sind grundsätzlich geeignete spätere Export-/Metrics-Schichten. Für diesen bounded P3-A-Foundation-Scope wurden sie **nicht** als neue Dependency übernommen, weil CAPITAL-AI bereits `TelemetryRecord`, Provider Health, Rate Limit und Circuit Breaker besitzt und der aktuelle Bedarf zunächst deterministische in-process Evidence ist.

Die internen Metriken folgen dennoch exportfähiger Semantik:

- bounded Provider/Capability-Dimensionen;
- Request Duration;
- Success/Error Outcome;
- Circuit-/Rate-Limit State;
- getrennte Feature Freshness/Coverage;
- keine URL-/Query-Dimension als Metriklabel.

Ein persistenter/zentraler OpenTelemetry-/Prometheus-Exporter ist als separater Runtime-/Infrastructure-Scope zu behandeln, insbesondere für mehrere Render-Instanzen und eine promotionsfähige Langzeitbeobachtung.

## 10. Security / Datenintegrität

- keine Secrets/Keys in Ledger oder Telemetrie;
- keine Payload-/URL-/Query-Persistenz;
- keine neue externe Write-Boundary;
- keine Registry-/Dispatcher-/Ranking-Mutation;
- keine vom Caller vertrauenswürdige Challenger-Evaluation;
- keine simulierten/fiktiven Challenger Scores;
- keine neue Provider-/Category-Heuristik;
- keine zusätzlichen kostenverursachenden API-Aufrufe;
- Contract-/Registry-/Binding-/Authority-Mismatch fail-closed;
- bounded In-Memory-Ledger verhindert unbeschränktes Speicherwachstum.

## 11. Tests

Neue/erweiterte Regressionen:

- `tests/unit/providerRuntimeObservability.test.ts`
  - Availability/Error/P95/Circuit/Rate Aggregation;
  - fester sanitiserter Contract ohne URL/Query/Request-/Response-Body/Secret.
- `tests/unit/commodityProviderGovernance.test.ts`
  - realer TwelveData-Governancepfad erzeugt Provider-Runtime-Samples;
  - Application-Level-Providerfehler bleiben unusable/fail-closed.
- `tests/unit/commodityShadowObservability.test.ts`
  - Registry-gebundene Re-Evaluation statt Caller-Trust;
  - Shadow Authority bleibt false;
  - READY→BLOCKED Drift wird erkannt;
  - Evidence-/Feature-Fingerprint-Drift;
  - optionaler Champion-Score-Drift;
  - Challenger Score Drift bleibt N/A;
  - manipulierte Snapshot-Contracts und unbekannte Provider↔Feature-Bindings blockieren.

## 12. Verbleibende P3-A Gates

Vor vollständigem P3-A Exit bleiben offen:

1. explizite Runtime-/Asset-Bindings für die vier Kategorie-`instrumentKind`s; derzeit darf keine Kategorie aus einem generischen Symbol geraten werden;
2. reale Beobachtungsperiode mit ausreichendem Sample Count;
3. langfristige/persistente Aggregation über mehrere Runtime-Instanzen, falls für Promotion erforderlich;
4. empirische Provider Freshness/Availability/Latency/Error/Circuit-Evidence pro geforderter Modellquelle;
5. keine ungeklärten P0/P1 Integrity Findings;
6. erst danach Übergabe an P3-B/P3-C Review.

**Status dieses Slices:** P3-A Foundation implementiert auf Branch; Exit Gate bewusst offen.
