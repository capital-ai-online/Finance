# FO-04 — Request-Orchestrator Telemetry Truth

**Datum:** 2026-08-26  
**Scope:** Admin-UI `OrchestratorPanel`, bestehende `/api/orchestrator/stats`- und `/api/orchestrator/ping-models`-Daten  
**Status:** Implementierungs-Evidence auf Branch `fix/frontend-orchestrator-telemetry-truth-2026-08-26`; nicht merge-autorisierend.

## Ausgangslage

Der Request-Orchestrator war technisch angebunden, die Admin-Oberfläche interpretierte vorhandene Werte jedoch teilweise weiter als der Server sie tatsächlich messen kann. Beispiele:

- `rateLimitsHit` wurde als `Spam-Blocks` / `DDoS unterbunden` dargestellt, obwohl der Wert ausschließlich Client-Rate-Limit-Ablehnungen zählt;
- `totalProcessed` wurde mit `Erfolgreich` beschrieben, obwohl der Orchestrator den Zähler auch bei Connection-Close erhöht und damit keine fachliche Erfolgsquote liefert;
- `requestsLastMinute` wurde als Echtzeit-Durchsatz gegenüber dem per-IP-Limit dargestellt, obwohl der Wert aus dem auf 50 Einträge begrenzten Recent-Log berechnet wird;
- die Oberfläche sprach von globalem Server-/DDoS-Schutz, obwohl nur Routen erfasst werden, die explizit `orchestrator.handle(...)` verwenden;
- `/ping-models` wurde als Auto-Routing-/Latenzmonitor dargestellt, obwohl der Server nur Integrations-/Konfigurationsstatus liefert und `latency: null` zurückgibt.

FO-04 verändert die Zählerlogik nicht. Es korrigiert ausschließlich den Meaning Contract zwischen beobachteten Serverdaten und ihrer Darstellung.

## Kanonischer Telemetrie-Contract

`src/lib/orchestratorTelemetrySemantics.ts` definiert die produktive Semantik zentral:

| Serverwert / Bereich | Kanonische UI-Bedeutung | Explizite Begrenzung |
|---|---|---|
| `activeRequests` | Aktive Requests | belegte Orchestrator-Slots, keine OS-Threads |
| `queueSize` | Warteschlange | nur instrumentierte Routen |
| `requestsLastMinute` | Recent Events ≤ 60s | aus max. 50 Recent-Log-Einträgen; kein globaler Req/min-Durchsatz |
| `totalProcessed` | Abgewickelt | Response/Connection-Close abgeschlossen; keine fachliche Erfolgsquote |
| `totalRejected` | Abgelehnt / Timeout | Rate-Limit-, Queue-Full- oder Queue-Timeout-Ereignisse |
| `rateLimitsHit` | Rate-Limit-Ablehnungen | 429 durch Client-Limit; keine Bot-/Spam-/Angriffsklassifikation |
| `/ping-models` | Modell-Integrationsstatus | keine aktive Health- oder Latenzmessung |

## Coverage Boundary

Die UI weist nun ausdrücklich aus:

> Zeigt ausschließlich Requests, die explizit durch den Request-Orchestrator laufen. Keine globale API-, WAF- oder DDoS-Abdeckung.

Damit wird weder eine globale API-Abdeckung noch ein WAF/CDN-DDoS-Control suggeriert. Die bestehende Orchestrator-Instrumentierung bleibt unverändert.

## Entfernte bzw. ersetzte Overclaims

Die produktive Admin-Oberfläche verwendet insbesondere nicht mehr:

- `Server-Side Traffic Protection` als globale Coverage-Aussage;
- `AIF-Shield Aktiv`;
- `DDoS-Schutz` / `DDoS unterbunden`;
- `Spam-Blocks`;
- `Echtzeit Durchsatz` für das bounded Recent-Log;
- `Erfolgreich` für `totalProcessed`;
- `Model Auto-Routing & Latency Monitor`;
- `Latenz-Ping ausführen`;
- `Optimal` als aus nicht gemessener Latenz abgeleitete Modellbewertung.

## Modellstatus

Der bestehende Endpoint `/api/orchestrator/ping-models` liefert aktuell statische/providerbezogene Integrationsinformationen und keine echte Provider-Liveness- oder Latenzmessung. FO-04 stellt deshalb nur noch dar:

- Modellname;
- vorgesehene Task-Kategorie;
- `CONFIGURED` oder `NOT INTEGRATED`;
- expliziten Hinweis, dass keine aktive Health-/Latenzmessung stattfindet.

Der Endpoint-Pfad wird in FO-04 aus Kompatibilitätsgründen nicht umbenannt. Eine echte Provider-Health-/Latency-Funktion bleibt ein separates späteres Arbeitspaket und darf keine synthetischen Messwerte verwenden.

## Best-Practice-Abgleich

### OWASP Logging Cheat Sheet

OWASP fordert konsistente Eventklassifikation, klar definierte Feldnamen/-typen und eine zur beabsichtigten Nutzung passende Logging-/Monitoring-Semantik. Der Vertrauensgrad von Eventinformationen soll berücksichtigt werden; Security- und operative Logs haben unterschiedliche Zwecke und sollten nicht undifferenziert interpretiert werden.

Primärquelle: OWASP Cheat Sheet Series — Logging Cheat Sheet.

### OpenTelemetry Semantic Conventions

OpenTelemetry fordert eine standardisierte, verständliche Semantik für Telemetriedaten und weist ausdrücklich darauf hin, semantische Mehrdeutigkeit zu vermeiden. Gleiche oder ähnlich benannte Metriken sollen nur dann vergleichbar dargestellt werden, wenn ihre Bedeutung tatsächlich übereinstimmt.

Primärquelle: OpenTelemetry Semantic Conventions — Metrics semantic conventions / General guidelines.

FO-04 führt OpenTelemetry nicht als Dependency ein. Die Semantic-Conventions-Grundsätze werden ausschließlich als Naming-/Meaning-Referenz genutzt.

## Architektur / Governance

- **Arbeitspunkt:** FO-04 — Telemetry Truth.
- **ADR:** Keine neue ADR erforderlich; bestehende Architektur/Trust Boundaries werden nicht verändert.
- **ESS:** Kein neuer externer API-Vertrag; vorhandene Daten werden präziser dargestellt.
- **Externe Mutation:** Keine.
- **Dependencies:** Keine neue Dependency.
- **Frontend-Migration:** Keine; `OrchestratorPanel` bleibt bis BB-8 in der bestehenden Legacy-/Compatibility-Zone.
- **FO-05-Abgrenzung:** Polling-Cadence und Lifecycle bleiben unverändert; AbortController, Visibility-Pause, Backoff und Overlap Prevention folgen separat.

## Regression

`tests/unit/orchestratorTelemetrySemantics.test.ts` sichert unter anderem:

- explizite Coverage Boundary;
- keine Interpretation von `totalProcessed` als fachlichen Erfolg;
- keine Angriffsklassifikation aus `rateLimitsHit`;
- bounded Recent-Log-Semantik statt globalem Durchsatzclaim;
- Integrationsstatus statt Health-/Latency-Claim;
- bekannte missverständliche Legacy-Claims dürfen nicht in den kanonischen Telemetrie-Contract zurückkehren.

## Rest-Risiken / Folgeschritte

FO-04 ändert bewusst nicht:

- FO-05 API-Client-/Polling-Lifecycle;
- FO-06 breitere API-/Frontend-Regression;
- BB-2/BB-8 Frontend-Migration;
- Multi-Instance-/Distributed-Telemetrie;
- echte Provider-Health-/Latency-Messungen.
