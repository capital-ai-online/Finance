# SC-2 A.5 — Gemini Research-/Extraction-/Evidence-Discovery Adapter (2026-08-19)

**Status:** IMPLEMENTATION ON BRANCH — runtime activation intentionally blocked  
**SPT:** SC-MD-SPT-0001  
**Parent:** `agent/a1-a2-scoring-consolidation@60bb16d9`  
**Branch:** `agent/gemini-research-evidence-adapter`  
**ADR:** ADR-0087  
**Main baseline at branch creation:** `345b2bd3f0a9d61ba4f07182b6e892da5cf3b52d`

## Zweck

Diese Änderung bereitet eine kontrollierte zukünftige Rückkehr der Gemini API vor, ohne ADR-0072 zu umgehen und ohne einen parallelen Scoring-/Agentenpfad zu erzeugen. Gemini wird als möglicher Research-/Extraction-/Source-Discovery-Provider vor dem kanonischen Evidence Gate modelliert.

## Architektur

```text
UAI Asset Identity
      |
      v
ResearchEvidenceAdapter contract
      |
      +-- GeminiResearchEvidenceAdapter (dormant)
      |      tools: google_search + optional url_context
      |      structured CLAIM schema only
      |      provider citation metadata kept separate
      |      function calling = false
      |
      v
AI_DISCOVERED_EVIDENCE
scoreEligible = false
      |
      v
Research Source Policy / Validation
      |
      +-- REJECTED
      +-- RESEARCH_ONLY
      `-- VALIDATED_PRIMARY_SOURCE
              |
              v
        still scoreEligible = false
              |
              v
future field-specific Evidence Promotion Gate
              |
              v
Canonical ScoringEvidenceRef / Feature Contract
```

## Gelieferte Code-Grenzen

### `src/platform/ResearchEvidence/contracts.ts`

- providerneutraler `ResearchEvidenceAdapter`;
- UAI-gebundene `ResearchEvidenceCandidate`;
- feste Trust-Semantik `AI_DISCOVERED_EVIDENCE`;
- Source-Klassen `regulated-primary`, `official-primary`, `provider-primary`, `secondary`, `unknown`;
- selbst nach Source Validation bleibt `scoreEligible: false`.

### `sourcePolicy.ts`

- akzeptiert ausschließlich öffentliche HTTPS-Hostnames;
- lehnt URL-Credentials, nicht-standardisierte Ports, localhost/private Namen und IP-Literale ab;
- Source-Klassifikation nur aus Git-/Review-gesteuerter Policy, niemals aus Modelloutput;
- strukturelle Claim-/Timestamp-/Confidence-Prüfung;
- keine Promotion zu produktiver Score-Evidence.

### `GeminiResearchEvidenceAdapter.ts`

- keine Gemini SDK-Abhängigkeit;
- keine Secret-/Environment-Nutzung;
- zukünftiger Providerzugriff nur hinter `GeminiResearchTransport`;
- Structured-Output-Schema enthält **nur Claims**, keine modellgenerierte Source-Liste;
- URLs/Titel/Spans dürfen im Transport ausschließlich aus provider-eigenen Citation-/Grounding-Metadaten stammen;
- der Transport bindet Claims an `providerCitationIndexes`; Claims ohne zuverlässige Bindung werden verworfen;
- URL Context maximal 20 URLs pro Request;
- Google Search ist read-only Discovery;
- Function Calling ist ausdrücklich `false`;
- retrieved content wird im festen System-Contract als untrusted data behandelt.

## Aktueller Gemini-API-Abgleich (Stand 2026-08-19)

Die Implementierungsgrenze wurde gegen die aktuellen offiziellen Google-Dokumente geprüft:

- Gemini Interactions API unterstützt Google Search Grounding und liefert Source-/Citation-Metadaten;
- URL Context kann öffentliche HTML/JSON/CSV/PDF-Inhalte abrufen und unterstützt bis zu 20 URLs pro Request;
- Structured Outputs können mit Gemini-3-Tools kombiniert werden, Google fordert trotzdem anwendungsseitige Validierung semantischer Werte;
- Function Calling ist verfügbar, wird für diese Re-Entry-Stufe bewusst nicht aktiviert.

Der Code bindet absichtlich kein konkretes Gemini-Modell fest. Modell-/SDK-Auswahl muss bei echter Aktivierung erneut gegen den dann aktuellen API-Stand validiert werden.

## Sicherheits-/FinTech-Invarianten

1. LLM-Ausgabe ist keine Finanzdaten-Provenance.
2. Source URLs werden nicht aus modellgeneriertem JSON akzeptiert; nur Provider-Citation-/Grounding-Metadaten dürfen Source-Authority begründen.
3. Citation-Bindung ist erforderlich, aber allein nicht hinreichend für Score-Evidence.
4. Source Authority wird nicht vom Modell bestimmt.
5. Catalog/UAI Identity und Evidence bleiben getrennt.
6. Keine synthetische Auffüllung fehlender Finanzwerte.
7. Keine interne Action-/Function-Calling-Fähigkeit in der ersten Gemini-Re-Entry-Stufe.
8. Fehlende validierte Evidence bleibt `SCORE_NOT_COMPUTABLE`.
9. Nutzungs-/Lizenz- und field-spezifische Promotion müssen vor Score-Wirkung separat genehmigt werden.

## Testumfang

`tests/unit/researchEvidenceAdapter.test.ts` deckt ab:

- provider-cited structured claim -> Candidate, aber `scoreEligible=false`;
- Structured Output enthält keine modellgenerierte Source-Liste;
- URL Context nur bei expliziten URLs;
- Claims ohne gültige provider-owned Citation-Bindung -> verworfen;
- private/non-HTTPS URLs -> vor Providertransport abgelehnt;
- 20-URL-Limit;
- approved primary source -> `VALIDATED_PRIMARY_SOURCE`, aber weiterhin nicht scorebar;
- unknown source -> `RESEARCH_ONLY`;
- citation/source mismatch -> `REJECTED`;
- Function Calling bleibt deaktiviert.

**Hinweis:** In dieser ChatGPT/GitHub-Connector-Session existiert kein lokaler Finance-Checkout. Die Tests sind implementiert, aber noch nicht lokal ausgeführt; PASS wird erst nach CI/lokalem Testlauf behauptet.

## Noch ausdrücklich nicht umgesetzt

- `@google/genai` installieren;
- Gemini API Key einbinden;
- echten `GeminiResearchTransport` implementieren;
- Feature Flag/Shadow Runtime aktivieren;
- Kosten-/Rate-Limit-/Circuit-Breaker-/Provider-Health-Telemetrie;
- Source-Policy für reale Domains freigeben;
- AI-discovered Claims zu `ScoringEvidenceRef` promoten;
- Score-/Ranking-/Eligibility-Wirkung.

## Nächste Aktivierungsstufe

Erst nach Owner-Freigabe: server-only Transport + Feature Flag default false + Secret Wiring + Telemetry/Cost Budget + Shadow Measurement. Der Transport muss nachweisbar provider-eigene Citation-/Grounding-Metadaten von modellgeneriertem Claim-JSON getrennt halten. Danach kann anhand realer Coverage-Daten entschieden werden, ob und welche primären Quellen/Fields in einem separaten Evidence-Promotion-Schritt scorefähig werden.

## Referenzen

- ADR-0072 — Gemini retirement
- ADR-0086 — single scoring architecture
- ADR-0087 — controlled Gemini research-evidence re-entry
- SC-2_MODEL_REGISTRY_UAI.md
- `src/platform/Scoring/`
- `src/platform/ResearchEvidence/`
