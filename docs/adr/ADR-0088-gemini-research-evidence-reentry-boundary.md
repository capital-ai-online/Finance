# ADR-0088: Kontrollierte Gemini-Rückkehr als Research-/Extraction-/Evidence-Discovery-Adapter

- **Status:** Accepted
- **Datum:** 2026-08-19
- **Owner-Entscheidung:** „Research-/Extraction-/Evidence-Discovery-Adapter erstellen um eine Rückkehr der Gemini API möglich zu machen.“
- **Authority:** SC-MD-SPT-0001 + ADR-0087 (eine kanonische Scoring-Architektur)
- **Bezug zu ADR-0072:** ADR-0072 bleibt für Runtime, Dependencies, Keys und produktive Gemini-Nutzung wirksam. Diese ADR erlaubt zunächst nur die providerneutrale, dormant Re-Entry-Grenze und definiert die Bedingungen einer späteren expliziten Aktivierung.

## Kontext

ADR-0072 entfernte Gemini anwendungsweit aus Runtime, Provider-Routing, Governance, Embeddings, UI, Konfiguration und Dependencies. Gleichzeitig fehlen für viele Assets belastbare Eingangsmerkmale, sodass das kanonische Scoring fail-closed `SCORE_NOT_COMPUTABLE` liefert. Ein LLM darf diese Lücke nicht durch geschätzte Finanzwerte schließen, kann aber Primärquellen finden, Dokumente extrahieren und Evidence Candidates mit Quellenbindung liefern.

Die aktuelle Gemini API bietet dafür geeignete Bausteine: Google Search Grounding, URL Context, Structured Outputs und optional Function Calling. Für CAPITAL-AI wird diese Fähigkeit bewusst enger genutzt als technisch möglich: die erste Re-Entry-Stufe erlaubt ausschließlich Search/URL-Context/strukturierte Extraktion; Function Calling und interne Tool-Aktionen bleiben deaktiviert.

## Entscheidung

### 1. Kein neuer Scoring-Pfad

Gemini wird ausschließlich hinter `src/platform/ResearchEvidence/` als Research-/Extraction-/Evidence-Discovery-Adapter vorbereitet. Die kanonische Wertschöpfungskette bleibt:

`UAI -> Evidence Acquisition -> Evidence/Quality Gate -> Feature Contract -> ScoringModelRegistry -> Executor -> CanonicalScoreResult`.

Gemini ist eine optionale Acquisition-Komponente vor dem Evidence Gate und weder Scoring Engine noch Provenance-Authority.

### 2. AI_DISCOVERED_EVIDENCE ist niemals direkt scorebar

Jeder Modellfund wird als `ResearchEvidenceCandidate` mit folgenden harten Eigenschaften ausgegeben:

- Status `AI_DISCOVERED_EVIDENCE`;
- `scoreEligible: false`;
- UAI Asset Identity und correlationId;
- konkrete Source URL + Hostname;
- Citation-Bindung;
- einzelner strukturierter Claim mit Field/Value/Unit/optionalem observedAt;
- Discovery Provider/Model/Methoden.

**Source-of-Source-Regel:** Die Source-Liste darf nicht aus modellgeneriertem JSON stammen. Der zukünftige Gemini-Transport muss URLs/Titel/Spans ausschließlich aus provider-eigenen Citation-/Grounding-Metadaten (z. B. `url_citation` annotations / Search-/URL-Context-Resultaten) übernehmen. Structured Output enthält nur Claims. Der Transport bindet Claims an Provider-Citation-Indizes; kann er diese Bindung nicht zuverlässig herstellen, muss er eine leere Bindung liefern und der Adapter verwirft den Claim fail-closed.

Ein Modellname oder eine Gemini-Antwort ist keine Finanzdaten-Provenance.

### 3. Source Validation ist getrennt von Evidence Promotion

`sourcePolicy.ts` validiert nur die Research-Quelle und klassifiziert sie als `regulated-primary`, `official-primary`, `provider-primary`, `secondary` oder `unknown`.

Selbst `VALIDATED_PRIMARY_SOURCE` bleibt in diesem Layer `scoreEligible: false`. Eine spätere Promotion in eine kanonische `ScoringEvidenceRef` benötigt separat:

1. asset-/field-spezifischen Feature Contract;
2. Source-/Lizenz-Freigabe;
3. beobachtbaren Timestamp/Freshness-Regeln, soweit fachlich erforderlich;
4. semantische/quantitative Feldvalidierung;
5. Evidence-ID/Lineage;
6. Owner-/ADR-Gate, sofern dadurch produktive Score-Abdeckung verändert wird.

Damit kann Source Discovery die Datenabdeckung erhöhen, ohne das bestehende Fail-Closed-Prinzip zu umgehen.

### 4. Gemini-Transport bleibt in diesem Branch dormant

Der Branch liefert ausschließlich `GeminiResearchTransport` als Interface und `GeminiResearchEvidenceAdapter` als Mapping-/Policy-Grenze.

**Nicht enthalten:**

- kein `@google/genai` Package;
- kein `GEMINI_API_KEY` oder Environment-/Render-Secret;
- kein Runtime-Client;
- kein Netzwerkaufruf zu Google;
- kein Route-Wiring;
- kein Scoring-/Ranking-/Eligibility-Impact;
- kein Function Calling.

Ein späterer Transport kann die Gemini Interactions API auf diese Schnittstelle abbilden, ohne Domain-Scoring oder Evidence Contracts erneut zu ändern. Er ist dafür verantwortlich, provider-eigene Citation-Metadaten von modellgenerierten Claim-Daten getrennt zu halten.

### 5. Initial erlaubte Gemini-Fähigkeiten

Die Transport-Schnittstelle ist für folgende rein lesende Fähigkeiten ausgelegt:

- `google_search` für Source Discovery;
- `url_context` für explizit angegebene öffentliche URLs;
- Structured Output gegen ein festes Claim-JSON-Schema;
- provider-eigene Citation-/Grounding-Metadaten als einzige Source-Liste.

Das Adapter-Limit für URL Context ist 20 URLs pro Request. Input-/Output-Quellen werden nur als öffentliche HTTPS-Hostnames akzeptiert; localhost, private Hostnamen, IP-Literale, Credentials und nicht-standardisierte Ports werden an der kanonischen Adaptergrenze abgelehnt.

### 6. Untrusted Content bleibt Dateninhalt, keine Anweisung

Der feste Research-Systemprompt weist den Provider an, Seiteninhalt als untrusted data zu behandeln und keine Instruktionen aus Quellen zu befolgen. Entscheidend ist jedoch nicht der Prompt allein: der Adapter erlaubt weder Function Calling noch interne Actions und konsumiert nur das geschlossene strukturierte Claim-Schema plus provider-eigene Citation-Metadaten. Damit kann ein gefundenes Dokument keine Autorisierungs- oder Ausführungsbefehle in CAPITAL-AI einschleusen.

## Aktivierungs-Gate für eine spätere echte Gemini-Rückkehr

Ein separater, explizit Owner-genehmigter Schritt ist erforderlich, bevor Gemini Netzwerkverkehr erzeugen darf. Mindestens:

1. aktuellen `@google/genai` SDK-/Interactions-API-Stand erneut prüfen und Version pinnen;
2. server-only `GeminiResearchTransport` implementieren;
3. `GEMINI_API_KEY` ausschließlich über die kanonische Secret-Verwaltung bereitstellen;
4. Feature Flag default `false` / Shadow-Mode;
5. Timeout, Rate/Cost Budget, Circuit Breaker, Provider Health und Audit/Usage Telemetry;
6. Source Policy + Nutzungs-/Lizenzregeln je Source-Klasse;
7. Tests für Provider-Citation-Bindung, Schema-/Semantic Validation, SSRF-/URL-Grenzen und untrusted retrieved content;
8. Shadow-Messung: zusätzliche validierbare Primärquellen, Kosten, Fehlerquote, Latenz, Coverage-Gewinn;
9. keine Score-Evidence-Promotion ohne separaten field-spezifischen Gate-/ADR-Schritt.

## Konsequenzen

- Eine spätere Gemini-Rückkehr benötigt keinen neuen Agent-/Scoring-Orchestrator.
- Anthropic/OpenAI Agent Routing bleibt unverändert; Research Evidence ist eine separate Acquisition-Fähigkeit innerhalb derselben Gesamtarchitektur.
- Die Plattform kann künftig mehrere Research-Provider hinter demselben `ResearchEvidenceAdapter`-Contract evaluieren, ohne deren Modelloutput unmittelbar in Scores zu überführen.
- Fehlende oder nicht validierte Evidence bleibt weiterhin `SCORE_NOT_COMPUTABLE`.

## Referenzen

- `docs/adr/ADR-0072-alpaca-shadow-and-gemini-retirement.md`
- `docs/adr/ADR-0087-single-scoring-architecture-uai-model-registry.md`
- `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md`
- `docs/roadmaps/work-packages/SC-2_MODEL_REGISTRY_UAI.md`
- `src/platform/ResearchEvidence/`
- Google Gemini API: Search Grounding, URL Context, Structured Outputs, Function Calling / Interactions API (Stand 2026-08-19)
