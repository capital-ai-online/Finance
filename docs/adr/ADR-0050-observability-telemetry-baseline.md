# ADR-0050 — Observability & Telemetry Baseline

Status: Proposed  
Date: 2026-08-10

## Kontext

CAPITAL-AI besitzt bereits mehrere getrennte Evidence- und Betriebsbausteine: einen strukturierten JSON-Logger mit Request-ID, IAM-/Step-Up-Auditpfade, Screening-SLA-Logik, Provider Routing, Compliance Evidence, Supervisor, EventMesh und Deployment-Identität. Gleichzeitig existieren weiterhin zahlreiche `console.*`-Aufrufstellen und die Plattformkomponente `src/platform/Telemetry` war bislang nur ein als `unspecified` markierter Bootstrap-Platzhalter ohne Code.

Ein neues paralleles Logging-/Monitoring-System würde die bestehende Architektur fragmentieren. Für eine FinTech-Anwendung müssen zudem Operational Telemetry und revisionsrelevante Audit Evidence klar getrennt bleiben.

## Entscheidung

`src/platform/Telemetry` wird zur vendor-neutralen Contract- und Governance-Schicht für Operational Telemetry ausgebaut. `server/logger.ts` bleibt die operative Logger-Authority und wird schrittweise an diesen Contract angebunden.

O1 führt ein:

- ein versioniertes `TelemetryRecord`-Schema;
- kanonische FinTech-Wertschöpfungsstufen;
- standardisierte Event-Namen, Outcomes und Durations;
- Request-/Trace-/Span-Kontext im Contract;
- zentrale Secret-/PII-Redaction;
- Service-, Environment-, Version- und Commit-Kontext im bestehenden Logger;
- standardisierte Request-Abschluss-Telemetrie;
- Contract- und Redaction-Tests.

OpenTelemetry wird als spätere vendor-neutrale Export-/Tracing-Schicht vorgesehen, aber in O1 noch nicht als externe Dependency oder Collector eingeführt.

## FinTech-Wertschöpfungskette

Operational Telemetry wird auf folgende Stufen normalisiert:

`request-intake → identity-access → entitlement-usage → orchestration → market-data-provider → data-validation → scoring-analysis → explainability → billing → output-delivery → deployment-runtime`

Diese Kette ermöglicht spätere End-to-End-SLIs, ohne Domain-Auditdaten in Logs zu replizieren.

## Sicherheits- und Compliance-Grenzen

1. Secrets, Tokens und direkte PII dürfen nicht in Operational Telemetry persistiert werden.
2. Generische Request-Telemetrie enthält weder Request-Body noch Query-String.
3. Audit Evidence für IAM, Break-Glass, Billing, Compliance oder Governance bleibt bei den zuständigen Authorities und wird höchstens per `auditReference` referenziert.
4. Telemetry ersetzt weder EventMesh noch Traceability noch Compliance Evidence.
5. Externe Observability-Vendor werden nicht in Domain-Code eingebettet.

## Konsequenzen

Positiv:

- bestehende Logging-Infrastruktur wird konsolidiert statt dupliziert;
- FinTech-Wertschöpfung wird messbar;
- Datenminimierung und Redaction werden zentral erzwungen;
- spätere OpenTelemetry-/Collector-Integration bleibt vendor-neutral;
- Deployment-SHA kann mit Runtime-Telemetrie korreliert werden.

Trade-offs:

- vorhandene `console.*`-Aufrufe bleiben zunächst technische Schuld und werden in O2 schrittweise migriert;
- O1 liefert noch keine externen Dashboards, Traces oder SLO-Alerts;
- Audit- und Operational-Evidence müssen bewusst getrennt gepflegt werden.

## Folgephasen

O2 Structured Logging & Error Taxonomy.  
O3 Metrics.  
O4 OpenTelemetry / Distributed Tracing.  
O5 FinTech Business Telemetry.  
O6 SLI/SLO & Alerting.  
O7 Production Evidence.  
O8 Continuous Governance.

## Verifikation

O1 ist erfüllt, wenn:

- der Telemetry-Contract typisiert und getestet ist;
- Secret-/PII-Redaction getestet ist;
- der zentrale Logger Redaction und Deployment-Kontext verwendet;
- Request-Abschlussmetrik Request-ID, Status und Dauer liefert;
- `/healthz` nicht als regulärer Business-/Request-Traffic gezählt wird;
- TypeScript, Unit Tests, Production Build und Docker-Hardening-CI grün sind.
