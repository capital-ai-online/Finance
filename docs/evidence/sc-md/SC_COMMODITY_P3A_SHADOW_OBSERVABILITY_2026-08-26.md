# SC-2 Commodity P3-A — Shadow Runtime & Observability Evidence

**Datum:** 2026-08-26  
**Roadmap:** `docs/roadmaps/work-packages/SC-2_COMMODITY_ORCHESTRATOR_ROADMAP.md` → P3-A  
**Parent Authority:** ADR-0087 / ADR-0101  
**Branch:** `feat/commodity-p3a-shadow-observability-2026-08-26`  
**Originale Branch-Basis:** `main@1a3d26bac1155954a3ab1cde0b72fac5e8351091`  
**Zwischensynchronisierung:** `main@73ad480c1008696c1e48a4c3614e9d03ee318d7c`, Merge-Base exakt Main, `0 behind`  
**Work Claim:** `COMMODITY-P3A-SHADOW-OBSERVABILITY-2026-08-26`

## 1. Ziel

P3-A macht reale Provider- und Challenger-Qualität vor einer späteren Commodity-Promotion messbar, ohne Shadow-Ergebnisse in produktives Scoring, Ranking, Eligibility, Trading oder Execution einfließen zu lassen.

Dieser Branch implementiert die **P3-A Runtime-/Observability-Foundation**. Das vollständige P3-A Exit Gate bleibt bewusst offen, bis eine reale Beobachtungsperiode mit belastbaren Samples vorliegt.

## 2. Implementierter Runtime-Pfad

```text
Governed Provider Adapter
  -> ResearchEvidenceProviderHttp
     -> ProviderHealth
     -> ProviderRuntimeObservation
  -> CommodityResearchFeatureSnapshot
  -> RawMaterialsOrchestrator.composeSourceBackedResearch()
     -> deterministic CommodityCategoryResearchEvaluation
     -> CommodityShadowObservability
        -> Registry-bound challenger observation
        -> Provider runtime/freshness views
        -> drift/fingerprint evidence
        -> sanitized TelemetryRecord
  -> Research Context
```

Die produktive Score-Authority bleibt unverändert:

```text
ScoringModelRegistry
  -> ScoringDispatcher
  -> registered canonical executor
  -> CanonicalScoreResult
```

P3-A führt keinen zweiten Dispatcher, keine zweite Registry und keinen zweiten allgemeinen DQ-Service ein.

## 3. Provider Runtime Observability

`src/platform/MarketData/providerRuntimeObservability.ts` führt `provider-runtime-observability/1.0.0` ein.

Ein Runtime-Sample enthält ausschließlich:

- governte Provider-ID;
- Capability;
- Observation-Zeitpunkt;
- Outcome;
- `requestAttempted`;
- Dauer in Millisekunden;
- `payloadUsable`;
- Circuit-State;
- optionalen HTTP-Status;
- lokales Rate-Budget Remaining/Reset.

Explizit ausgeschlossen sind:

- URL oder Request-Pfad;
- Query/Parameter;
- Request-/Response-Payload;
- API-Key oder Secret;
- Provider-Rohdaten.

Der Ledger ist pro Prozess auf 2.000 Samples begrenzt.

### 3.1 Transportversuch vs. lokaler Denial

`requestAttempted=true` bedeutet, dass der Providertransport tatsächlich gestartet wurde.

`requestAttempted=false` umfasst beispielsweise:

- `NOT_CONFIGURED`;
- lokalen Rate-Budget-Denial;
- `CIRCUIT_OPEN`.

Damit werden Provider-Metriken nicht durch lokale Fail-Closed-Entscheidungen verfälscht:

- `availabilityRate = READY / attempted requests`;
- `errorRate = non-READY attempted requests / attempted requests`;
- P95-Latenz wird ausschließlich aus attempted requests berechnet;
- lokale Denials werden separat gezählt;
- lokaler Rate-Limit-Denial und Provider-HTTP-429 werden getrennt ausgewiesen;
- ein lokaler Denial darf keinen HTTP-Status behaupten.

## 4. Integration in `ResearchEvidenceProviderHttp`

`ResearchEvidenceProviderHttp` erzeugt genau eine Runtime-Beobachtung pro Ergebniszustand.

Abgedeckt sind:

- `READY`;
- `NOT_CONFIGURED`;
- `RATE_LIMITED`;
- `CIRCUIT_OPEN`;
- `SOURCE_UNAVAILABLE`;
- `PROVIDER_ERROR`;
- `INVALID`.

Damit erben EIA, USDA FAS PSD, CFTC, USGS und TwelveData-Commodity-History dieselbe technische Observability-Grenze, soweit sie diesen gemeinsamen Transport nutzen.

Observability erzeugt **keinen zusätzlichen Provider-Request**.

## 5. Commodity Shadow Observation

`src/platform/Scoring/CommodityShadowObservability.ts` führt `commodity-shadow-observability/1.0.0` ein.

Der Observer akzeptiert nur einen bereits governten `CommodityResearchFeatureSnapshot`.

Caller-supplied Evaluation State wird nicht vertraut. Stattdessen:

1. `evaluateCommodityCategoryResearchSnapshot()` wird erneut deterministisch ausgeführt;
2. das resultierende Challenger-Modell wird read-only gegen die bestehende `ScoringModelRegistry` gebunden;
3. nur `challenger`, `research-only`, `scoreEligible=false` und `research-only:not-executable` werden akzeptiert;
4. Instrument-Kind und Feature-Contract müssen zum Registry-Descriptor passen.

Damit kann ein Caller weder Status, Modellversion, Executor-Key noch Feature-/Weight-Lineage frei einschleusen.

## 6. Provider-/Feature-Bindings

Providerzuordnungen für Shadow-Auswertungen sind explizit.

Ein Binding muss:

- auf einen existierenden, aktivierten Commodity-Provider der `ProviderMatrix` zeigen;
- eine nicht-leere Capability besitzen;
- ausschließlich Feature-Keys referenzieren, die im Snapshot vorhanden sind;
- pro Provider/Capability eindeutig sein.

P3-A inferiert Provider oder Commodity-Kategorie nicht aus Symbolnamen.

Provider-Transportqualität und Evidence-Qualität bleiben getrennt:

- Transport: Availability, Error Rate, P95, Circuit, Rate Budget;
- Evidence: Feature Coverage und Freshness aus dem feldspezifischen Commodity-Feature-Contract.

## 7. Challenger Authority

Jede Shadow Observation ist fest:

- `canonical=false`;
- `scoreEligible=false`;
- `rankingEligible=false`;
- `executionEligible=false`;
- `registryMutationPerformed=false`.

Der Challenger besitzt weiterhin:

- `researchCompositeScore=null`;
- `weightHypothesis.executable=false`.

Deshalb lautet die Challenger-Score-Stability in P3-A bewusst:

`NOT_APPLICABLE_UNTIL_EXECUTABLE_WEIGHTS`

mit:

- `score=null`;
- `delta=null`.

Es wird kein Score aus DQ, Coverage oder Owner-Hypothesengewichten synthetisiert.

## 8. Champion Comparator

Ein optional bereits vorliegender Champion-Score darf ausschließlich read-only als Comparator verwendet werden.

Der Comparator wird gegen `ScoringModelRegistry` validiert:

- Lifecycle `canonical`;
- Alias `champion`;
- Commodity-Assetklasse;
- produktiv score-eligible;
- exakte `modelId@version`-Bindung.

Nicht-finite Scores und ungültige optionale raw SHA-256 Feature-/Weight-Fingerprints werden abgelehnt.

Der Comparator kann Score-/Feature-/Weight-Drift sichtbar machen, besitzt aber keine Mutations- oder Promotion-Authority.

## 9. Drift und Lineage

Zwischen Beobachtungen desselben Asset-/Challenger-Paars werden gemessen:

- Research-Status-Wechsel;
- Coverage-Delta;
- Required-Coverage-Delta;
- DQ-Delta;
- Anzahl geänderter Feature-Status;
- `effectiveFeatureFingerprint`-Änderung;
- Evidence-Fingerprint-Änderung;
- optional Champion-Score-Delta;
- optional Champion-Feature-/Weight-Fingerprint-Änderung.

Der P3-A `evidenceFingerprint` ist nur Observation-Lineage. Er ersetzt nicht:

- den bestehenden Scoring-Fingerprint;
- P2-B Dataset-Fingerprints;
- P2-C Descriptor-/Promotion-Fingerprints.

## 10. Shadow Runtime im RawMaterialsOrchestrator

`RawMaterialsOrchestrator.composeSourceBackedResearch()` ist auf `raw-materials-source-backed-research/1.1.0` erweitert.

Nach der bestehenden UAI-/Feature-Komposition und Research-Evaluation wird derselbe Snapshot an P3-A übergeben.

Wichtig: Shadow bleibt **nicht-invasiv**.

- `RECORDED`: Shadow Observation wurde erfolgreich erzeugt.
- `BLOCKED`: Shadow-Evidence wurde fail-closed verworfen.

Ein `BLOCKED` Shadow darf den bereits gültigen Research-Context **nicht** ausfallen lassen.

Der Context liefert deshalb `shadowRuntime` mit:

- `status`;
- Observation oder `null`;
- stabilem internen Diagnosecode oder `null`;
- weiterhin ausschließlich falschen Score-/Ranking-/Execution-Flags.

Rohe Provider-/Exceptiontexte werden nicht in diesen Status übernommen.

## 11. Telemetry / Audit

Jede erfolgreiche Shadow Observation erzeugt einen kanonischen `TelemetryRecord`:

- `stage=scoring-analysis`;
- `eventName=commodity.shadow.observation.completed`;
- `assetClass=commodity`;
- `auditReference=ADR-0101/P3-A`.

Erfasst werden nur technische Modell-/Registry-/Coverage-/Fingerprint-/Status-Metadaten.

Die Enterprise Traceability Matrix wird zur Laufzeit nicht beschrieben oder mutiert.

## 12. Open-Source-/Plugin-Abgleich

Geprüft wurden:

- OpenTelemetry JS — Apache-2.0, etablierter Enterprise-Standard, sinnvoll für späteren Export;
- Prometheus `client_js` — Apache-2.0, etablierte Metrics-Lösung.

Für diese erste bounded Foundation wurde keine neue Dependency übernommen, weil bereits vorhanden sind:

- `TelemetryRecord`;
- `ProviderHealth`;
- `RateLimitBudget`;
- `CircuitBreaker`;
- `ScoringModelRegistry`;
- bestehende Fingerprint-Verträge.

Eine persistente/exportierte OpenTelemetry-/Prometheus-Schicht bleibt ein separater Runtime-/Infrastructure-Scope, insbesondere bei mehreren Render-Instanzen.

Verwendeter Connector: GitHub. Render ist für die spätere reale Beobachtungsperiode read-only vorgesehen; in diesem Branch erfolgte keine Render-Mutation.

## 13. Security / Datenintegrität

- keine Secrets oder API-Keys im Ledger;
- keine URL-/Query-/Payload-Persistenz;
- kein zusätzlicher Provider-Traffic;
- keine Registry-/Dispatcher-/Ranking-Mutation;
- keine synthetischen Challenger-Scores;
- keine freie Caller-Evaluation-Authority;
- keine freie Champion-Modellidentität;
- nur governte Commodity-Provider-Bindings;
- lokale Denials werden nicht als Provider-Latenz/-HTTP-Fehler ausgegeben;
- bounded In-Memory-Ledger verhindert unbeschränktes Speicherwachstum;
- Shadow-Fehler sind vom primären Research-Pfad isoliert.

## 14. Regressionen

### `providerRuntimeObservability.test.ts`

- Provider Attempts vs. lokale Denials;
- Availability/Error/P95-Semantik;
- Provider-429 vs. lokaler Rate-Budget-Denial;
- unmöglicher lokaler HTTP-Status wird abgelehnt;
- Low-Cardinality-/Sanitization-Contract.

### `commodityProviderGovernance.test.ts`

- realer TwelveData-Governancepfad erzeugt Runtime-Samples;
- Application-Level-Providerfehler bleibt unusable;
- Provider-Health und Runtime-Summary bleiben korreliert.

### `commodityShadowObservability.test.ts`

- Registry-bound Challenger;
- keine Score-/Ranking-/Execution-Authority;
- READY→BLOCKED Drift;
- Feature-/Evidence-Fingerprint-Drift;
- optionaler Champion-Score-Drift;
- kein Challenger-Score-Drift;
- unbekannte Feature-Bindings blockieren;
- ungovernte Provider-Bindings blockieren;
- falscher Champion blockiert.

### `rawMaterialsP3AShadowRuntime.test.ts`

- Source-backed Research erzeugt P3-A Shadow Observation;
- Contract `1.1.0`;
- Shadow bleibt non-authoritative;
- Shadow-Blockade lässt den primären Research-Context verfügbar.

## 15. Validierungsstatus

Pre-PR Hosted-CI wurde gemäß Governance **nicht** ausgelöst.

Ein lokaler Repository-Clone/Testlauf war in der verfügbaren Laufzeitumgebung nicht möglich, weil `github.com` per DNS nicht aufgelöst werden konnte. Daher sind TypeScript-, Unit-Test- und Production-Build-Ergebnisse erst über den nach PR-Erstellung zulässigen CI-Lauf belastbar.

Statisch geprüft wurden:

- Branch-/Main-Dateioverlap;
- Registry-/Dispatcher-Authority;
- Provider-/Feature-Bindings;
- Score-/Ranking-/Execution-Invarianten;
- Secret-/Payload-Sanitization;
- lokale Denial-/Provider-Attempt-Semantik;
- Shadow-Non-Interference;
- keine Dependency-/Workflow-/Deployment-Änderungen.

## 16. Noch offene P3-A Exit Gates

Die Foundation ist implementiert. P3-A selbst bleibt `IN PROGRESS`, bis mindestens folgende reale Evidence vorliegt:

1. reale Asset-/Instrument-Bindings für die vier Kategorie-Challenger im tatsächlichen Runtime-Consumer;
2. definierte Beobachtungsperiode;
3. ausreichender Sample Count je erforderlicher Providerquelle;
4. empirische Availability/Freshness/P95/Error/Circuit-Evidence;
5. Feature-/DQ-/Fingerprint-Stability über die Beobachtungsperiode;
6. keine ungeklärten P0/P1 Integrity Findings;
7. bei Multi-Instance-Anforderung persistente oder exportierte Aggregation;
8. erst danach P3-B/P3-C Promotion Review.

**Status dieses Branch-Slices:** P3-A Shadow Runtime & Observability Foundation implementiert; Exit Gate bewusst offen.
