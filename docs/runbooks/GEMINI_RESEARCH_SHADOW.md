# Gemini Research Evidence Shadow — Runbook

**Status:** DEFAULT-OFF / SERVER-ONLY  
**Authority:** ADR-0087, ADR-0088, SC-MD-SPT-0001

## Zweck

Der Shadow-Transport misst, ob Gemini Search/URL Context zusätzliche zitierbare Research-Evidence für Assets finden kann. Er ist **kein** Scoring-Provider und verändert keine Scores, Rankings oder Eligibility.

## Aktivierungsbedingungen

Vor `GEMINI_RESEARCH_SHADOW_ENABLED=true` müssen vorhanden sein:

- `GEMINI_API_KEY` in `/etc/secrets/finance-secrets.env`;
- `GEMINI_RESEARCH_MODEL`;
- aktuelle vertragliche `GEMINI_RESEARCH_INPUT_USD_PER_M`;
- aktuelle vertragliche `GEMINI_RESEARCH_OUTPUT_USD_PER_M`;
- aktuelle vertragliche `GEMINI_RESEARCH_SEARCH_USD_PER_1K`;
- positives `GEMINI_RESEARCH_DAILY_COST_BUDGET_USD`.

Fehlt einer dieser Werte, liefert die Runtime keinen aktiven Adapter.

## Default-Grenzen

| Variable | Default |
|---|---:|
| `GEMINI_RESEARCH_SHADOW_ENABLED` | `false` |
| `GEMINI_RESEARCH_REQUESTS_PER_MINUTE` | 3 |
| `GEMINI_RESEARCH_DAILY_REQUEST_BUDGET` | 50 |
| `GEMINI_RESEARCH_DAILY_TOKEN_BUDGET` | 250000 |
| `GEMINI_RESEARCH_TIMEOUT_MS` | 8000 |
| `GEMINI_RESEARCH_CIRCUIT_FAILURE_THRESHOLD` | 3 |
| `GEMINI_RESEARCH_CIRCUIT_COOLDOWN_MS` | 60000 |
| `GEMINI_RESEARCH_MAX_OUTPUT_TOKENS` | 1200 |
| `GEMINI_RESEARCH_THINKING_LEVEL` | `low` |

## Betriebsinvarianten

1. Der Transport ist ausschließlich serverseitig.
2. Es gibt in dieser Stufe keine öffentliche Route und keinen Startup-Netzwerkaufruf.
3. Interactions Requests laufen mit `store=false` und `background=false`.
4. Erlaubte Provider-Tools sind ausschließlich `google_search` und optional `url_context`.
5. Function Calling ist ausgeschlossen.
6. Structured Output enthält Claims, keine Source-URLs.
7. Source-URLs stammen ausschließlich aus Provider-`url_citation`-Metadaten.
8. Claims ohne belastbare Citation-Span-Bindung werden downstream verworfen.
9. Research-Candidates bleiben `scoreEligible=false`.
10. Preise werden nicht im Code gepflegt, sondern als Runtime-Konfiguration gesetzt.

## Provider Health / Telemetrie

Supervisor Capability: `GeminiResearch / research-evidence-shadow`.

Kanonisches Telemetry Event: `research.discovery.completed`.

Erlaubte Telemetrieattribute: Modellkennung, Latenz, Claim-/Citation-Anzahl, Token-Zähler, Search-Call-Anzahl, Kosten-/Budgetstände, ErrorCode und Shadow-Flag.

Nicht protokollieren: `GEMINI_API_KEY`, Query/Prompt, URLs, Rohantwort, extrahierte Claim-Werte.

## Shadow-Auswertung

Eine spätere Owner-Entscheidung über weitere Nutzung soll mindestens diese Kennzahlen vergleichen:

- Anteil bisher nicht scorebarer Assets mit neu gefundenen Primärquellen;
- Anteil Claims mit provider-owned Citation-Bindung;
- Anteil Quellen, die Source Policy / Lizenzprüfung bestehen;
- Kosten pro Asset / validierbarer Claim;
- P50/P95-Latenz;
- Provider-/Schema-/Timeout-Fehlerrate;
- Circuit-Open- und Budget-Denial-Rate.

**Kein Coverage-Gewinn darf allein einen Score freischalten.** Dafür ist ein separates field-spezifisches Evidence-Promotion-Gate notwendig.

## Rollback / Disable

Sofortiger Kill-Switch: `GEMINI_RESEARCH_SHADOW_ENABLED=false`.

Danach erzeugt die Factory keinen aktiven Transport/Adapter und es darf kein neuer Gemini-Netzwerktraffic entstehen. Das Entfernen/Rotieren des `GEMINI_API_KEY` ist eine zusätzliche Secret-Management-Maßnahme, aber nicht für das logische Disable erforderlich.
