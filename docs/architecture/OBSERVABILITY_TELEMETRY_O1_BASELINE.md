# CAPITAL-AI Observability & Telemetry — O1 Baseline

Stand: 2026-08-10  
Status: Implementation Baseline  
Architecture Decision: ADR-0050

## 1. Ausgangslage

Die Codebasis besitzt bereits wichtige Observability-Einzelbausteine, jedoch keine einheitliche Telemetry-Authority:

- `server/logger.ts`: JSON-Logging, Log-Level, Request-ID und Deployment-Identität;
- IAM/Step-Up: Security-/Audit-Evidence;
- `src/services/screeningSla.ts`: Screening-SLA-/Betriebslogik;
- `src/services/marketDataProviderRouter.ts`: Provider Routing und Failure Domains;
- `src/platform/Compliance/screeningGovernanceEvidence.ts`: Compliance-/Screening-Evidence;
- `src/platform/Supervisor/supervisor.ts`: Supervisor-Auswertung;
- `src/platform/EventMesh`: Domain-Event-Infrastruktur;
- GitHub Actions → Render Deploy Hook + `server/deploymentIdentity.ts`: Production Deployment Evidence.

Gleichzeitig existieren noch zahlreiche direkte `console.*`-Ausgaben. `src/platform/Telemetry` war bisher ohne Code als `unspecified` registriert.

## 2. Zielbild

```text
Client / API Request
        │
        ▼
Request Intake ── Correlation-ID / Latency
        │
        ▼
Identity & Access ── Auth outcome / Step-up reference
        │
        ▼
Entitlement / Usage ── Plan- und Limit-Outcome, ohne PII
        │
        ▼
Orchestration ── Route / decision / duration
        │
        ▼
Market Data Provider ── provider / latency / fallback / error class
        │
        ▼
Data Validation ── freshness / completeness / integrity outcome
        │
        ▼
Scoring & Analysis ── engine / asset class / duration / confidence class
        │
        ▼
Explainability ── completion / provenance reference
        │
        ▼
Billing ── operation outcome / audit reference
        │
        ▼
Output Delivery ── response/export outcome
        │
        ▼
Deployment Runtime ── version / commit SHA / environment
```

Operational Telemetry läuft quer durch diese Kette. Audit Evidence bleibt separat.

## 3. O1 Contract

Jeder kanonische Telemetry Record besitzt:

- Schema-Version;
- UTC Timestamp;
- Signaltyp `log | metric | trace`;
- Severity;
- Wertschöpfungsstufe;
- kanonischen Event-Namen;
- Outcome;
- optionale Duration, Provider und Assetklasse;
- Service-/Environment-/Version-/Commit-Kontext;
- optionale Request-/Trace-/Span-ID;
- redigierte Attributes;
- optional nur eine Referenz auf separate Audit Evidence.

## 4. Datenschutz und FinTech-Sicherheitsgrenze

Operational Telemetry darf keine Secrets, Auth Header, Cookies, API Keys, Passwörter, Stripe Secret Keys, Service-Role-Tokens oder direkte PII enthalten. Der generische HTTP-Hook zeichnet keine Bodies und keine Query-Strings auf.

Dies ist bewusst strenger als ein normales Application Log, da Provider-Requests, Portfolio-/Asset-Kontext, Billing und IAM in einer FinTech-Anwendung besonders hohe Leakage-Risiken besitzen.

## 5. Bestehende Authorities bleiben erhalten

| Domäne | Authority | O1-Verhalten |
|---|---|---|
| Logging | `server/logger.ts` | bleibt zentrale Runtime-Logger-Authority |
| IAM Audit | Security/IAM + DB Audit | nicht in Telemetry replizieren |
| Compliance Evidence | Compliance Platform | nur referenzieren |
| Event Lifecycle | EventMesh | nicht durch Telemetry-Events ersetzen |
| Traceability | Documentary/Traceability | Architektur-/Coverage-Evidence |
| Deployment | GitHub CI + Render Hook + deploymentIdentity | Commit/Version in Telemetry-Kontext übernehmen |
| Provider Routing | marketDataProviderRouter | O3/O4 instrumentieren |
| Screening SLA | screeningSla | O3 in Metriken überführen |

## 6. O1 Codeänderungen

- `src/platform/Telemetry/contracts.ts`
- `src/platform/Telemetry/redaction.ts`
- `src/platform/Telemetry/index.ts`
- `tests/unit/telemetryContract.test.ts`
- Integration in `server/logger.ts`
- Aktualisierung von README und Manifest
- ADR-0050

## 7. Messbarer Exit-Status

Nach O1 soll der Observability-/Telemetry-Reifegrad von ca. 45 % auf ca. 55 % steigen. Dafür werden noch keine externen Dashboards oder Collector benötigt. Der Wert entsteht durch einen belastbaren Contract, Datenminimierung, Runtime-Korrelation und eine explizite FinTech-Wertschöpfungszuordnung.

## 8. Nächster Workstream O2

O2 migriert die wichtigsten verbleibenden `console.*`-Pfade risikobasiert auf `createLogger` und führt eine Error Taxonomy ein. Priorität:

1. Provider / Market Data;
2. Orchestrator / Decision Engine;
3. Stripe / Billing;
4. Mailer / Password Reset;
5. DB / Supabase;
6. verbleibende Security-/Runtime-Pfade.

Keine Big-Bang-Migration: pro PR nur klar abgegrenzte Wertschöpfungssegmente mit vorhandener Test-Evidence.
