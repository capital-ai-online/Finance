# ADR-0088: Server-only Gemini Research Shadow Runtime

- **Status:** Accepted
- **Datum:** 2026-08-19
- **Owner-Entscheidung:** „server-only GeminiResearchTransport im Shadow Mode, weiterhin default-off, mit Feature Flag, Secret-Wiring, Rate-/Cost-Budget, Circuit Breaker, Provider Health und Audit-Telemetrie. ausführen“
- **Authority:** SC-MD-SPT-0001 + ADR-0086 + ADR-0087
- **Ersetzt/erweitert:** ADR-0087 §4 und das dort definierte Aktivierungs-Gate werden für die server-only Shadow-Runtime konkretisiert. ADR-0072 bleibt für produktive Gemini-Nutzung außerhalb dieser Research-Evidence-Grenze wirksam.

## Kontext

ADR-0087 hat die providerneutrale Research-/Extraction-/Evidence-Discovery-Grenze geschaffen und Gemini als möglichen Adapter vorbereitet. Diese ADR aktiviert **nicht** Gemini als Scoring- oder Marktprovider. Sie liefert ausschließlich die serverseitige Transport- und Resilience-Schicht, die später kontrolliert Shadow-Traffic erzeugen kann.

Die Runtime muss auch bei vorhandenem API-Key fail-closed bleiben: Ohne explizites Feature Flag, Modell und reale Kostenparameter darf kein Request an Google gesendet werden.

## Entscheidung

### 1. Server-only und default-off

`server/researchEvidence/geminiResearchTransport.ts` ist der einzige Gemini-Netzwerktransport dieses Arbeitspakets.

- Feature Flag: `GEMINI_RESEARCH_SHADOW_ENABLED`, Default `false`.
- Kein `VITE_`-Pendant.
- Kein Browser-/UI-Zugriff.
- Keine öffentliche HTTP-Route.
- Kein Startup-Smoke, der bei Flag `false` Netzwerkverkehr erzeugt.
- Kein Scoring-, Ranking-, Eligibility- oder Provider-Routing-Impact.

Die Factory liefert bei deaktivierter oder unvollständiger Konfiguration `transport=null` und `adapter=null`.

### 2. REST Interactions API statt neuer SDK-Abhängigkeit

Die Runtime verwendet den dokumentierten REST-Endpunkt der Gemini Interactions API und fügt **keine** `@google/genai`-Dependency hinzu. Damit bleibt die bestehende Dependency-/Supply-Chain-Fläche unverändert und der providerneutrale `GeminiResearchTransport`-Contract bleibt die Architekturgrenze.

Der Request nutzt nur:

- `google_search`;
- optional `url_context`;
- Structured Output gegen das bestehende Claim-Schema;
- `store=false` und `background=false`;
- begrenzte Output-Tokens und niedriges/minimales Thinking.

Function Calling und interne Tools bleiben ausgeschlossen.

### 3. Secret-Wiring

`GEMINI_API_KEY` wird in `scripts/security/secretFileManifest.ts` aufgenommen. In Produktion ist damit `/etc/secrets/finance-secrets.env` die kanonische Secret-Quelle und `server/env.ts` priorisiert den Secret-File-Wert vor gleichnamigen Environment-Werten.

Der Branch enthält **keinen** realen API-Key. Das Eintragen/Rotieren des Secret-Werts bleibt eine Owner-/Deployment-Aktion.

### 4. Aktivierung erfordert reale Kostenparameter

Es gibt bewusst keine hartkodierte Gemini-Preistabelle. Vor `enabled=true` müssen konfiguriert sein:

- `GEMINI_RESEARCH_MODEL`;
- `GEMINI_RESEARCH_INPUT_USD_PER_M`;
- `GEMINI_RESEARCH_OUTPUT_USD_PER_M`;
- `GEMINI_RESEARCH_SEARCH_USD_PER_1K`;
- `GEMINI_RESEARCH_DAILY_COST_BUDGET_USD` > 0.

Damit kann eine veraltete Preisannahme im Code keine scheinbar belastbare FinTech-Kostenkontrolle erzeugen. Ein Search-Preis von `0` ist nur zulässig, wenn Vertrag/Quota dies tatsächlich rechtfertigen.

### 5. Lokale Rate-/Cost-Budgets

Vor jedem Provideraufruf greifen lokale Schutzgrenzen:

- RPM über den bestehenden `RateLimitBudget`;
- tägliches Request-Budget;
- tägliches Token-Budget;
- tägliches USD-Budget auf Basis der **konfigurierten** Preise und der Provider-Usage-Metadaten.

Die Tageszähler sind in-memory und UTC-tagesgebunden. Das ist für die erste Shadow-Stufe bewusst konservativ und pro Instanz. Eine produktive, horizontal skalierte Kostenkontrolle benötigt später einen gemeinsamen persistenten Budget-State.

### 6. Circuit Breaker

Der bestehende `CircuitBreaker` wird wiederverwendet. Auth-, Transport-, Schema- und Providerfehler zählen als Providerfehler; nach dem Schwellwert öffnet der Circuit. Während `OPEN` wird kein Google-Request ausgeführt. Nach Cooldown ist ein Half-Open-Probe zulässig.

### 7. Provider-owned Citations bleiben die Trust-Grenze

Structured Output enthält weiterhin **keine Source-URLs**. Der Transport extrahiert Sources ausschließlich aus provider-eigenen `url_citation`-Annotations.

Claims werden nur dann mit einer Citation verknüpft, wenn der Provider-Citation-Span den konkreten JSON-Claim-Objektspan überlappt. Fehlen `start_index`/`end_index` oder ist keine belastbare Überlappung vorhanden, bleibt `providerCitationIndexes=[]`; der bestehende `GeminiResearchEvidenceAdapter` verwirft diesen Claim anschließend fail-closed.

### 8. Provider Health und Audit-Telemetrie

Der Transport schreibt in die vorhandene Supervisor-Provider-Health-Schicht (`GeminiResearch` / `research-evidence-shadow`) und erzeugt kanonische `TelemetryRecord`s mit `eventName=research.discovery.completed`.

Audit-/Telemetry-Metadaten enthalten ausschließlich technische Metadaten wie:

- correlation/request ID;
- Modellkennung;
- Latenz;
- Claim-/Citation-Anzahl;
- Token-Zähler;
- Google-Search-Call-Zähler;
- berechnete Kosten und Budgetstände;
- Circuit-/Fehlerstatus.

Nicht geloggt werden API-Key, Prompt/Query, URLs, Rohantwort oder extrahierte Claim-Werte. `auditReference` verweist auf ADR-0087; die Telemetrie ist operative Evidence, keine neue Autorisierungs-Authority.

### 9. Keine automatische Score-Evidence-Promotion

Auch nach erfolgreichem Shadow-Call bleibt jeder Output `AI_DISCOVERED_EVIDENCE` und `scoreEligible=false`. Die Runtime verändert das bestehende `SCORE_NOT_COMPUTABLE`-Verhalten nicht. Erst ein separates field-spezifisches Evidence-Promotion-Gate darf validierte Primärquellen in `ScoringEvidenceRef` überführen.

## Nicht-Ziele

- keine Gemini-Nutzung im bestehenden Anthropic/OpenAI-Agent-Routing;
- keine neue Scoring Engine;
- keine Marktpreis-/OHLCV-/Orderbook-Quelle über Gemini;
- keine Function Calling Actions;
- keine öffentliche Research-Route;
- kein `scoreImpact`/`rankingImpact`;
- keine automatische Aktivierung in Render;
- kein echter Secret-Wert im Repository.

## Exit Criteria dieser Stufe

1. server-only Transport implementiert;
2. Flag default-off;
3. Secret-Manifest verdrahtet;
4. Modell-/Preis-/Budget-Konfiguration vollständig vor Aktivierung erforderlich;
5. Rate-/Token-/USD-Budget vorhanden;
6. Circuit Breaker und Provider Health vorhanden;
7. provider-owned Citation-Spans fail-closed gebunden;
8. audit-sichere kanonische Telemetrie vorhanden;
9. Regressionstests implementiert;
10. Main-Korrelationscheck vor PR.

## Referenzen

- ADR-0072
- ADR-0086
- ADR-0087
- `server/researchEvidence/geminiResearchTransport.ts`
- `src/platform/ResearchEvidence/GeminiResearchEvidenceAdapter.ts`
- `scripts/security/secretFileManifest.ts`
- `src/platform/MarketData/CircuitBreaker.ts`
- `src/platform/MarketData/RateLimitBudget.ts`
- `src/platform/Supervisor/providerHealth.ts`
- `src/platform/Telemetry/contracts.ts`
