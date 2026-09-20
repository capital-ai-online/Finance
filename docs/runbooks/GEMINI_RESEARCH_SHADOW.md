# Gemini Research Evidence Shadow — Runbook

**Status:** ARCHITECTURE-ENABLED / SERVER-ONLY / FREE-TIER-ONLY / QUOTA-DORMANT  
**Authority:** ADR-0088, ADR-0089, ADR-0090, SC-MD-SPT-0001

## Zweck

Der Shadow-Transport misst, ob Gemini Search/URL Context zusätzliche zitierbare Research-Evidence für Assets finden kann. Er ist **kein** Scoring-Provider und verändert keine Scores, Rankings oder Eligibility.

Diese Runtime darf ausschließlich mit einem Gemini Developer API **Free-Tier-Key aus einem Projekt ohne aktivierte Abrechnung** betrieben werden. Paid Mode ist nicht zulässig.

## Aktueller externer Free-Tier-Vertrag

Stand 2026-09-18 dokumentiert Google für `gemini-2.5-flash`:

- Input Tokens im Free Tier: kostenlos;
- Output Tokens im Free Tier: kostenlos;
- URL Context im Free Tier: kostenlos;
- Google Search Grounding im Free Tier: bis zu 500 RPD kostenlos, geteilt mit Flash-Lite;
- Free Tier ist in EWR/EU verfügbar;
- Requests-per-day (RPD) werden projektweit gezählt und um Mitternacht Pacific Time zurückgesetzt.

Diese externen Bedingungen können sich ändern. **Vor jeder erstmaligen Aktivierung und nach jeder relevanten Google-Preis-/Quota-Änderung ist die offizielle Gemini Pricing/Billing/Rate-Limit-Dokumentation erneut zu prüfen.**

## Aktueller Betriebszustand — 2026-08-19

Owner-Attestation:

- `GEMINI_API_KEY` liegt in der kanonischen Render Environment Variables;
- der zugehörige Gemini/Google API-Key stammt laut Owner-Bestätigung aus einem Projekt ohne Billing;
- Render Service `Finance`: `GEMINI_RESEARCH_FREE_TIER_ONLY=true`;
- Render Service `Finance`: `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true`;
- Render Service `Finance`: `GEMINI_RESEARCH_SHADOW_ENABLED=false`.

Damit ist die Free-Tier-/Billing-Voraussetzung erfüllt, **der Providertraffic bleibt aber weiterhin deaktiviert**. Der Blueprint behält `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false` als sicheren Default für neue oder neu provisionierte Umgebungen; die aktuelle Service-Attestation ist eine explizite Operator-Konfiguration.

## Aktivierungsbedingungen

Vor `GEMINI_RESEARCH_SHADOW_ENABLED=true` müssen alle Bedingungen erfüllt sein:

1. `GEMINI_API_KEY` liegt ausschließlich in `Render Environment`;
2. der Key gehört zu einem Google/Gemini-Projekt **ohne Billing-Verknüpfung**;
3. `GEMINI_RESEARCH_FREE_TIER_ONLY=true`;
4. nach manueller Billing-Kontrolle ist `GEMINI_RESEARCH_FREE_TIER_ATTESTED=true` gesetzt;
5. das aktuelle Google-Free-Tier-Angebot unterstützt weiterhin das im Code gepinnte `gemini-2.5-flash` für Search/URL Context/Structured Output;
6. der lokale Request-Budgetwert liegt innerhalb des Code-Caps;
7. die Free-Tier-Runtime ist im deployten Commit enthalten und CI/TypeScript-Validierung ist bestanden.

Fehlt eine dieser Bedingungen, darf der kanonische Free-Tier-Factory keinen aktiven Transport/Adapter bereitstellen.

**Wichtig:** Ein API-Key selbst trägt keinen belastbaren Billing-Status. Die Attestation ist daher ein expliziter Operator-/Deployment-Gate. Wird Billing später an das Google-Projekt gekoppelt, muss `GEMINI_RESEARCH_FREE_TIER_ATTESTED` sofort wieder auf `false` gesetzt und Shadow-Traffic gestoppt werden.

## Kanonischer Server-Entry-Point

Produktive/interne Consumer dürfen nur `createGeminiResearchFreeTierRuntime()` aus `server/researchEvidence/` verwenden.

Der Factory:

- pinnt `gemini-2.5-flash`;
- erlaubt keinen Paid-Mode;
- ignoriert Modell-/Preis-Overrides;
- setzt lokale Input-/Output-/Search-Unit-Costs auf `0`;
- deckelt `GEMINI_RESEARCH_DAILY_REQUEST_BUDGET` auf maximal 100 Requests/Tag;
- verlangt Free-Tier-Attestation zusätzlich zum allgemeinen Shadow-Flag.

Der rohe Transport bleibt nur über seinen expliziten Implementierungspfad für Tests/Low-Level-Entwicklung erreichbar und ist **nicht** der kanonische Runtime-Entry-Point.

## Default-Grenzen

| Variable | Default |
|---|---:|
| `GEMINI_RESEARCH_SHADOW_ENABLED` | `false` |
| `GEMINI_RESEARCH_FREE_TIER_ONLY` | `true` |
| `GEMINI_RESEARCH_FREE_TIER_ATTESTED` | `false` |
| gepinntes Modell | `gemini-2.5-flash` |
| `GEMINI_RESEARCH_REQUESTS_PER_MINUTE` | 3 |
| `GEMINI_RESEARCH_DAILY_REQUEST_BUDGET` | 50 |
| hartes Code-Cap Requests/Tag | 100 |
| aktuell dokumentierte Search-Free-Tier-Grenze | 500 RPD |
| `GEMINI_RESEARCH_DAILY_TOKEN_BUDGET` | 250000 |
| `GEMINI_RESEARCH_TIMEOUT_MS` | 8000 |
| `GEMINI_RESEARCH_CIRCUIT_FAILURE_THRESHOLD` | 3 |
| `GEMINI_RESEARCH_CIRCUIT_COOLDOWN_MS` | 60000 |
| `GEMINI_RESEARCH_MAX_OUTPUT_TOKENS` | 1200 |
| `GEMINI_RESEARCH_THINKING_LEVEL` | `low` |

## Zero-Cost-Invariante

1. Das Google-Projekt darf keine Billing-Verknüpfung besitzen.
2. Paid Gemini Tier ist für diesen Runtime-Pfad verboten.
3. Das Modell ist auf `gemini-2.5-flash` gepinnt, solange dessen Free-Tier-Fähigkeiten offiziell dokumentiert sind.
4. Lokale Kostenparameter sind im kanonischen Free-Tier-Factory fest `0`; externe Paid-Preiswerte werden nicht konsumiert.
5. Der lokale Daily Request Cap liegt bewusst deutlich unter der aktuell dokumentierten Search-Free-Tier-Grenze.
6. Ein Upgrade, Billing-Attachment oder Modellwechsel benötigt eine neue Owner-Entscheidung/ADR und darf nicht stillschweigend über Environment-Konfiguration erfolgen.

Diese Regeln verhindern **beabsichtigte** kostenpflichtige Nutzung. Die Plattform kann den Google-Billing-Status eines API-Keys nicht allein aus dem Key kryptografisch verifizieren; deshalb ist die externe Projektkonfiguration Teil des operativen Zero-Cost-Gates.

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
10. Kein Gemini-Consumer darf den Free-Tier-Factory umgehen.

## Quota-Dormancy und automatische Wiederaufnahme

Der Key wird bei ausgeschöpftem Free-Tier-Kontingent **nicht gelöscht oder rotiert**. Stattdessen ruht ausschließlich der Gemini-Netzwerkpfad.

- Lokale Tagesbudgets verwenden denselben Pacific-Time-Tageswechsel wie Googles dokumentierte RPD-Quota.
- Ein lokales Tagesbudget-Limit setzt die Runtime bis zur nächsten Pacific-Midnight-Grenze auf Dormancy.
- Ein Provider-`429 RESOURCE_EXHAUSTED` setzt `QUOTA_DORMANT`.
- Liefert Google `Retry-After`, wird exakt diese Freigabezeit verwendet.
- Fehlt `Retry-After`, wird fail-closed bis zur nächsten Pacific-Midnight-Grenze pausiert.
- Während Dormancy werden **keine** Gemini-Requests gesendet; der Secret-Key bleibt unverändert in der kanonischen Secret-Verwaltung.
- Nach Ablauf der Freigabezeit darf der nächste zulässige Request den Provider automatisch wieder verwenden.
- Dormancy autorisiert niemals Paid-Tier-Nutzung, Quota-Kauf, Billing-Aktivierung oder einen zweiten Key zur Quota-Umgehung.

## Provider Health / Telemetrie

Supervisor Capability: `GeminiResearch / research-evidence-shadow`.

Kanonisches Telemetry Event: `research.discovery.completed`.

Erlaubte Telemetrieattribute: Modellkennung, Latenz, Claim-/Citation-Anzahl, Token-Zähler, Search-Call-Anzahl, lokale Zero-Cost-/Budgetstände, ErrorCode und Shadow-Flag.

Nicht protokollieren: `GEMINI_API_KEY`, Query/Prompt, URLs, Rohantwort, extrahierte Claim-Werte.

## Shadow-Auswertung

Eine spätere Owner-Entscheidung über weitere Nutzung soll mindestens diese Kennzahlen vergleichen:

- Anteil bisher nicht scorebarer Assets mit neu gefundenen Primärquellen;
- Anteil Claims mit provider-owned Citation-Bindung;
- Anteil Quellen, die Source Policy / Lizenzprüfung bestehen;
- Requests/Token/Search-Calls pro Asset;
- P50/P95-Latenz;
- Provider-/Schema-/Timeout-Fehlerrate;
- Circuit-Open- und Budget-Denial-Rate.

**Kein Coverage-Gewinn darf allein einen Score freischalten.** Dafür ist ein separates field-spezifisches Evidence-Promotion-Gate notwendig.

## Rollback / Disable

Primärer Kill-Switch: `GEMINI_RESEARCH_SHADOW_ENABLED=false`.

Zero-Cost-Sicherheitsgate: `GEMINI_RESEARCH_FREE_TIER_ATTESTED=false`.

Beide Zustände verhindern einen aktiven kanonischen Transport. Wird am Google-Projekt Billing aktiviert oder ist der Free-Tier-Status unklar, Attestation sofort auf `false` setzen und den Key optional aus Render Environment Variables entfernen/rotieren.
