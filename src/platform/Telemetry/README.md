# Telemetry

## Enterprise Component

Status: Development  
Version: 1.2.0  
Owner: CAPITAL-AI

## Zweck

Telemetry ist die vendor-neutrale Operational-Evidence-Schicht von CAPITAL-AI. Sie standardisiert Logs, Metriken, validierten Trace-Kontext sowie aggregationsfähige Product-Intelligence-Ereignisse, ohne Security-/Compliance-Audit-Evidence, EventMesh, Traceability oder eine Analytics-Control-Plane zu ersetzen.

Die Komponente baut auf dem bestehenden `server/logger.ts` auf. Es wird bewusst kein zweites Logger-, Tracing- oder Product-Analytics-System eingeführt.

## Architekturgrenzen

- Operational Telemetry: Logs, Metriken, Trace-/Correlation-Kontext, Latenzen und technische Outcomes.
- Audit Evidence: unveränderbare IAM-, Break-Glass-, Billing-/Compliance- und Governance-Evidence bleibt in den zuständigen Authorities.
- Edge-Provenance: Cloudflare-/Render-Header werden nur als vertrauenswürdig behandelt, wenn `src/platform/Security/edgeTrust.ts` den separaten Edge-Proof verifiziert.
- Keine Secrets, Tokens, Passwörter oder direkte PII in Operational Telemetry.
- Kein Request-Body und kein Query-String in generischer Request-Telemetrie.
- W3C `traceparent` ist untrusted input und wird vor Übernahme syntaktisch validiert.
- Product Intelligence ist ein vendor-neutraler Event-Contract. Er enthält keine User-/Session-/IP-Identität und führt keinen Vendor-Export aus.
- OpenTelemetry bleibt das bevorzugte spätere Export-/Tracing-Protokoll; dieser Slice fügt keine externe Observability-Dependency oder Collector-Control-Plane hinzu.

## FinTech-Wertschöpfungskette

Der Telemetry-Contract kennt weiterhin die kanonischen Stufen:

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

## Implementiert

### Operational Telemetry

- typisierter `TelemetryRecord` mit Schema-Version;
- kanonische Event-Namen und Outcomes;
- Request-/Trace-/Parent-Span-Kontext im Contract;
- Cloudflare-Ray-ID und Edge-Trust-State nur als nicht-autorisierende Korrelation;
- zentrale Secret-/PII-Redaction;
- bestehender JSON-Logger mit Service-, Environment-, Version- und Commit-Kontext;
- generische Request-Abschlussmetrik mit Status und Dauer;
- `/healthz` bleibt aus regulärer Request-Telemetrie ausgeschlossen.

### Edge-Trust-Korrelation

`server/logger.ts` nutzt den bestehenden Logger und ergänzt:

- fail-closed Cloudflare→Render Edge-Provenance;
- validierten W3C-v00-Trace-Kontext;
- `edgeRayId`, `edgeTrust` und `edgeTrustReason` als technische Metadaten;
- keine Übernahme eines Edge-Headers als Autorisierungs- oder Request-ID-Authority.

Der produktive Render-Origin ist öffentlich erreichbar. Deshalb reichen `CF-Connecting-IP` und `CF-Ray` nicht als Herkunftsnachweis. Erst der separat provisionierte `CAPITAL_AI_EDGE_TRUST_SECRET` plus `x-capital-ai-edge-token` erlaubt die Übernahme der Cloudflare-Besucher-IP. Secret-Provisionierung, Cloudflare-Regeländerung und Production-Aktivierung sind separate Provider-/Production-Mutationen und gehören nicht zu diesem Repository-Slice.

### Product Intelligence

`productIntelligence.ts` definiert einen vendor-neutralen Vertrag für aggregationsfähige Ereignisse:

- Namespace `product.*`;
- Zwecke `feature-adoption`, `funnel`, `experiment`, `feedback`, `reliability`;
- keine User-ID, Session-ID, IP, E-Mail, Authorization, Cookies, Tokens, Prompts, Request-Bodies oder Query-Inhalte;
- flache, begrenzte skalare Properties;
- optionale technische `traceId`-/Commit-Korrelation;
- keine GA4-, PostHog-, Amplitude- oder sonstige Vendor-Bindung;
- kein Consent-Bypass und keine externe Übertragung.

Ein späterer Export-Adapter muss die zuständige Privacy-/Consent-/Marketing-/Product-Owner-Grenze separat korrelieren.

## Bestehende Integrationspunkte

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
- ESS-0019 — Universal AI Agent Control Plane
- ADR-0056 — Observability & Telemetry Baseline (Proposed; implementation guidance only)
- ADR-0059 — Accepted Agent Execution Audit / OpenTelemetry Correlation contract

## Folgephasen

- Edge-Trust provider activation only after separate protected Cloudflare/Render configuration authorization and readback.
- OpenTelemetry/Collector export remains separate and vendor-neutral.
- Product-Intelligence vendor export/consent integration remains separate from this contract.
- Render-OIDC/OAuth2.1/MCP remains a distinct OPS follow-up behind current Security-/Authority-correlation; it is not enabled here.
