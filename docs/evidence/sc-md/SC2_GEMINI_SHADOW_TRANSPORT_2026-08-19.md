# SC-2 A.6 — Gemini Research Shadow Transport Evidence — 2026-08-19

## Scope

Implementiert auf `agent/gemini-research-evidence-adapter` als Fortsetzung von ADR-0087. Der Transport bleibt Teil derselben UAI/Evidence/Scoring-Wertschöpfungskette und erzeugt keine parallele Scoring-Architektur.

## Gelieferter Runtime-Pfad

`server/researchEvidence/geminiResearchTransport.ts` implementiert `GeminiResearchTransport` gegen die Gemini Interactions REST API.

Harte Grenzen:

- server-only;
- `GEMINI_RESEARCH_SHADOW_ENABLED=false` als Default;
- kein öffentlicher Route-Consumer;
- kein Startup-Netzwerktraffic;
- `store=false`, `background=false`;
- nur `google_search` und optional `url_context`;
- Structured Claim Output;
- kein Function Calling;
- kein Score-/Ranking-/Eligibility-Impact.

## Secret-/Deployment-Wiring

`GEMINI_API_KEY` wurde in `scripts/security/secretFileManifest.ts` aufgenommen. Damit gilt in Produktion der bestehende `/etc/secrets/finance-secrets.env`-Mechanismus. Der Branch enthält keinen realen Key.

`render.yaml` setzt das Feature Flag explizit auf `false`; Modell, aktuelle Preisparameter und das USD-Tagesbudget sind `sync:false`. Konservative Resilience-Grenzen sind als Blueprint-Defaults gesetzt.

## Rate-/Cost-Budget

Wiederverwendet wird `src/platform/MarketData/RateLimitBudget.ts` für RPM. Zusätzlich führt die Shadow-Runtime pro Instanz/UTC-Tag Request-, Token- und USD-Zähler.

Die Kostenrechnung verwendet ausschließlich konfigurierbare Vertragspreise und die von Gemini gelieferten Usage-Zähler. Im Code existiert keine Gemini-Preistabelle.

Aktivierung wird abgelehnt, wenn Modell, Preisparameter oder positives Tageskostenbudget fehlen.

## Circuit Breaker / Provider Health

Wiederverwendet wird `src/platform/MarketData/CircuitBreaker.ts`.

Provider Health wird unter `GeminiResearch / research-evidence-shadow` in der vorhandenen Supervisor-Schicht geführt. Auth-, Rate-, Schema-, Transport- und Providerfehler werden explizit klassifiziert. Ein offener Circuit verhindert Providertraffic.

## Citation Trust Boundary

Die Gemini-Modellantwort darf keine Source-Liste definieren. Sources stammen ausschließlich aus `url_citation`-Annotations der Providerantwort.

Der Transport korreliert `start_index/end_index` mit dem konkreten JSON-Objektspan eines Claims. Nur eine überlappende Provider-Citation erhält einen `providerCitationIndexes`-Verweis. Ohne belastbare Bindung bleibt die Liste leer und der bestehende ResearchEvidenceAdapter verwirft den Claim fail-closed.

## Audit-Telemetrie

Der Transport erzeugt kanonische `TelemetryRecord`s mit `research.discovery.completed`, `stage=data-validation`, `provider=Gemini`, `auditReference=ADR-0087`.

Erfasst werden technische Metadaten: correlationId, Modell, Latenz, Claim-/Citation-Zähler, Token-/Search-Zähler, Kosten-/Budgetstände und Fehlercode. Nicht erfasst werden API-Key, Prompt/Query, URLs, Rohantwort oder Claim-Werte.

Die erste Shadow-Stufe nutzt einen begrenzten in-memory Telemetry-Ring plus Console-Sink bzw. einen injizierbaren Sink. Sie erzeugt keine neue Audit-Authority und schreibt nicht in den privilegierten Agent-Audit-Store, da kein autonomer/privilegierter Agent-Execution-Entscheid vorliegt.

## Regressionstests

`tests/unit/geminiResearchTransport.test.ts` deckt ab:

- default-off Konfiguration;
- Aktivierung nur mit vollständigem Secret/Model/Cost-Contract;
- stateless Interactions Request;
- kein modellgeneriertes Source-Schema;
- provider-owned Citation-Span-Bindung;
- fehlende Span-Bindung fail-closed;
- kein Netzwerkcall bei Flag off;
- Circuit Open nach Providerfehler;
- lokales RPM-/USD-Budget;
- audit-sichere Telemetrie ohne Secret/Prompt.

## Validierungsstand

- TypeScript `transpileModule` für neue Transport-/Testdateien: **PASS** (Syntax/Transpilation).
- Vollständiger lokaler Repo-Checkout/Testlauf: **nicht möglich**, da die Ausführungsumgebung `github.com` nicht per DNS auflösen konnte.
- `npm test` / `npx vitest run`: **PENDING CI**.
- `tsc --noEmit`: **PENDING CI**.
- GitHub Actions: wird erst nach PR/geeignetem Trigger als belastbare Test-Evidence behandelt.

Es wird daher ausdrücklich **kein** vollständiger PASS des Repository-Testsets behauptet.

## Offene nächste Stufe

Nach CI-PASS und Owner-Konfiguration kann der Shadow-Transport von einem internen, begrenzten Research-Consumer verwendet werden, um Coverage-Gewinn/Kosten/Latenz/Validierungsquote zu messen. Eine Promotion in `ScoringEvidenceRef` bleibt ein separates Work Package/Owner-Gate.
