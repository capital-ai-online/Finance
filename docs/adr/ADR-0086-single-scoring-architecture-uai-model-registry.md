# ADR-0086: Eine kanonische Scoring-Architektur mit UAI und ScoringModelRegistry

- **Status:** Accepted
- **Datum:** 2026-08-19
- **Owner-Entscheidung:** „Es sollen keine parallel Architekturen mehr entstehen und am Ende eine komplett Architektur entstehen, die sich in das FinTech Wertschöpfungs Ökosystem einbindet.“
- **Authority:** `SC-MD-SPT-0001` bleibt kanonische Ausführungsautorität.

## Kontext

Das Finance-Repository besitzt weiterhin mehrere historisch gewachsene Score-Einstiegspunkte und Ergebnisformen. Der verifizierte Crypto-Pfad liefert bereits `CanonicalScoreResult`, während Traditional-, Commodity-/Sovereign- und ältere Agent-/Base-/DeFi-/Meme-/Raw-Materials-Pfade eigene Auswahl-, Input- oder Ergebnislogik besitzen. Dadurch kann dieselbe fachliche Fähigkeit über unterschiedliche Architekturen erreicht werden.

SC-2 des kanonischen Screening/Scoring/Market-Data-SPT fordert eine Model Registry und Universal-Asset-Interface-(UAI)-Adapter. Diese ADR konkretisiert SC-2, ohne eine neue parallele Roadmap zu erzeugen.

## Entscheidung

### 1. Eine Architektur, mehrere Adapter und Modelle

Es gibt künftig genau **eine** Scoring-Wertschöpfungskette:

`UAI Identity -> Evidence Acquisition -> Evidence/Quality Gate -> Feature Contract -> ScoringModelRegistry -> deterministic executor -> CanonicalScoreResult -> Ranking/Eligibility -> EventMesh/Traceability/Supervisor`.

Assetklassen dürfen eigene Feature Contracts und deterministische Modelle besitzen. Sie dürfen keine eigene konkurrierende Scoring-Architektur, eigenes Provenance-Modell oder eigene Eligibility-Semantik etablieren.

### 2. UAI ist Identity, keine Evidence

Das UAI transportiert ausschließlich stabile Identität und Mapping-Metadaten (`assetId`, Symbol, Assetklasse, Instrumenttyp, optionale Provider-Symbole). Registry-/Catalog-Preise, Scores, Bootstrap-Werte oder AI-Schätzungen werden niemals in UAI-Identity aufgenommen und erhalten dadurch keine Evidence-Wirkung.

### 3. ScoringModelRegistry ist die einzige Modellauflösung

Die Registry verwaltet versionierte Modelldeskriptoren mit Assetklassen-/Instrument-Support, Feature-/Result-Contract, Evidence-Policy, Executor-Key, Lifecycle und Deployment-Alias.

- produktive Auflösung erfolgt nur über `lifecycle=canonical` + `alias=champion`;
- Challenger/Legacy/Blocked werden nie implizit als Fallback verwendet;
- keine registrierte Route oder Mehrdeutigkeit -> `SCORE_NOT_COMPUTABLE`;
- gleiche Priorität mehrerer Champions ist ein Routingfehler und fail-closed;
- Registry-Mutationen sind Git-/Review-gesteuert, nicht dynamisch aus Request-/LLM-Inhalten.

Das Champion/Challenger-/Versionierungsmodell entspricht dem in Enterprise-MLOps üblichen Registry-Prinzip aus versionierten Modellen, Lineage/Metadaten und kontrollierter Promotion. Für CAPITAL-AI gilt dies auch für deterministische Finanzmodelle.

### 4. Bestehende Engines werden strangler-artig migriert

Bestehende Engines werden nicht durch eine zweite neue Engine ersetzt. Sie werden nacheinander hinter UAI + Registry + Canonical-Result-Adapter gesetzt. Erst wenn ein alter Einstieg vollständig über den kanonischen Dispatcher erreichbar und regressionsgetestet ist, wird der direkte Parallelpfad entfernt.

### 5. AI ist Research-/Extraction-Komponente, kein Evidence-Bypass

LLM-/Agent-Ausgaben dürfen keine verifizierten Finanzmerkmale ersetzen. AI kann Research, Extraction, Source Discovery und strukturierte Evidence Candidates liefern. Ein AI-Modell selbst ist keine Finanzdaten-Provenance.

Eine mögliche erneute Gemini-Anbindung ist **nicht Bestandteil von A1/A2**. ADR-0072 bleibt gültig. Jede Wiedereinführung benötigt eine neue explizite ADR und darf nur als Adapter innerhalb derselben Acquisition-/Evidence-Architektur erfolgen; ein `GEMINI_API_KEY` darf keinen separaten Scoring-Pfad reaktivieren.

## Initiale Registry-Modelle

| Modell | Assets | Status | Result Contract |
|---|---|---|---|
| `crypto-technical-provenance@0.6.3` | crypto | canonical/champion | `scoring-integrity/1.0.0` |
| `traditional-scoring@2.1.0` | stock/forex/index | canonical/champion, Adapter nötig | legacy result -> künftig canonical |
| `commodity-evidence-scoring@1.0.0` | commodity | canonical/champion, Adapter/Extraction nötig | route-local -> künftig canonical |
| `sovereign-benchmark-yield-scoring@1.0.0` | bond `government-benchmark-yield` | canonical/champion, Adapter/Extraction nötig | route-local -> künftig canonical |

Individuelle Bonds bleiben gemäß ADR-0022 ohne ausreichende Evidence nicht scorebar.

## Konsequenzen

- Neue Scoring-Features müssen UAI + Registry + Evidence Gate nutzen.
- `/api/crypto/analyze` darf langfristig keinen alternativen kanonischen Finanzscore erzeugen; Agenten-Ausgaben werden Research/Enrichment.
- `scoring.service.ts`, Meme-/Raw-Materials- und route-lokale Scorer bleiben während der Migration nur temporäre Implementierungsdetails und erhalten keinen neuen Architekturstatus.
- Score-Gewichte, Provider-Routing, `scoreImpact`, `rankingImpact` und Eligibility-Schwellen werden durch A1/A2 **nicht** verändert.

## Migration / Exit Criteria

1. vollständiges A1 Entry-Point-Inventar;
2. UAI-Adapter für alle aktiven Asset-Katalogpfade;
3. alle produktiven Modellexecutoren versioniert in einer Registry;
4. jeder öffentliche Score-Einstieg löst sein Modell über die Registry auf;
5. alle Resultate werden zu `CanonicalScoreResult` adaptiert;
6. direkte Parallel-Model-Selection wird entfernt;
7. Main-Rebase/Korrelationsprüfung vor PR-Merge.

## Referenzen

- `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`
- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- ADR-0022, ADR-0032, ADR-0033, ADR-0072
- `src/services/scoringIntegrity.ts`
- `src/platform/MarketData/contracts.ts`
