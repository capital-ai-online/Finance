# Telemetry

## Enterprise Component

Status: Development  
Version: 1.1.0  
Owner: CAPITAL-AI

## Zweck

Telemetry ist die vendor-neutrale Operational-Evidence-Schicht von CAPITAL-AI. Sie standardisiert Logs, Metriken und Trace-Kontext entlang der FinTech-Wertschöpfungskette, ohne Security-/Compliance-Audit-Evidence zu ersetzen.

Die Komponente baut auf dem bestehenden `server/logger.ts` auf. Es wird bewusst kein zweites Logger-System eingeführt.

## Architekturgrenzen

- Operational Telemetry: Logs, Metriken, Trace-/Correlation-Kontext, Latenzen und technische Outcomes.
- Audit Evidence: unveränderbare IAM-, Break-Glass-, Billing-/Compliance- und Governance-Evidence bleibt in den zuständigen Authorities.
- Keine Secrets, Tokens, Passwörter oder direkte PII in Operational Telemetry.
- Kein Request-Body und kein Query-String in der generischen Request-Telemetrie.
- OpenTelemetry ist das vorgesehene spätere Export-/Tracing-Protokoll; O1 fügt noch keinen externen Vendor oder Collector hinzu.

## FinTech-Wertschöpfungskette

Der Contract kennt folgende kanonische Stufen:

1. `request-intake`
2. `identity-access`
3. `entitlement-usage`
4. `orchestration`
5. `market-data-provider`
6. `data-validation`
7. `scoring-analysis`
8. `explainability`
9. `billing`
10. `output-delivery`
11. `deployment-runtime`

Damit können spätere Metriken und Traces vom eingehenden Request über Provider und Scoring bis zur Ausgabe und Produktionsversion korreliert werden.

## O1 – implementiert

- typisierter `TelemetryRecord` mit Schema-Version;
- kanonische Event-Namen und Outcomes;
- Request-/Trace-/Span-Kontext im Contract;
- zentrale Secret-/PII-Redaction;
- bestehender JSON-Logger um Service, Environment, Version und Commit erweitert;
- validierte `x-request-id`-Übernahme mit sicherem UUID-Fallback;
- generische Request-Abschlussmetrik mit Status und Dauer;
- `/healthz` wird aus der regulären Request-Telemetrie ausgeschlossen;
- Contract-/Redaction-Tests.

## Bestehende Integrationspunkte

Die nächsten Phasen instrumentieren vorhandene Authorities statt parallele Systeme aufzubauen:

- IAM / Step-Up: `src/platform/Security`, `server/stepUp.ts`;
- Orchestrierung: `src/lib/requestOrchestrator.ts`, `server/orchestrator.ts`;
- Provider Routing: `src/services/marketDataProviderRouter.ts`;
- Screening SLA: `src/services/screeningSla.ts`;
- Compliance Evidence: `src/platform/Compliance/screeningGovernanceEvidence.ts`;
- Supervisor: `src/platform/Supervisor/supervisor.ts`;
- EventMesh: `src/platform/EventMesh`;
- Deployment Evidence: `server/deploymentIdentity.ts` und GitHub→Render Deploy Gate.

## ESS / Architecture References

- ESS-0001 / ESS-0001-CONTRACTS — Enterprise Component Contract
- ESS-0005 — Quality Center
- ESS-0006 — Security & Compliance
- ESS-0011 — Enterprise Traceability
- ESS-0013 — Enterprise Event Mesh
- ADR-0050 — Observability & Telemetry Baseline

## Folgephasen

O2: strukturierte Logger-Migration und Error Taxonomy.  
O3: technische und fachliche Metriken.  
O4: OpenTelemetry / Distributed Tracing.  
O5: FinTech Business Telemetry.  
O6: SLI/SLO und Alerting.  
O7: Production Evidence.  
O8: Continuous Telemetry Governance.
