# M0 Exit Status — Evidence Baseline

Stand: 2026-08-10
Repository: `SvenKulessa/Finance`

## Gate-Entscheidung

`M0 = PASS WITH DOCUMENTED CONNECTOR LIMITATION`

Die M0-Baseline ist ausreichend vollständig, um M1 kontrolliert zu starten. Nicht verifizierbare Secret-Metadaten werden **nicht** durch eine Ausweitung der GitHub-App-Berechtigungen nur für Dokumentationszwecke erzwungen.

## Exit Criteria

- [x] Repository und Default-Branch erfasst.
- [x] offene PRs und Agentenbranches erfasst.
- [x] direkte Dependencies erfasst.
- [x] GitHub Dependency Graph SPDX-SBOM verfügbar und verifiziert.
- [x] alle sieben GitHub-Workflows inventarisiert.
- [x] Kern-Actions auf SHA-Pinning und Permissions geprüft.
- [x] aktives `main-production-protection` Ruleset evidence-grade erfasst.
- [x] Required Check `build-and-test` verifiziert.
- [x] Bypass Actors: keine.
- [x] GitHub Environments inventarisiert; fehlendes kanonisches Production Environment als Gap erfasst.
- [x] Render Service/Deployment-Baseline extern verifiziert.
- [x] Supabase Projekt-/RLS-/Security-Advisor-Baseline extern verifiziert.
- [x] Stripe Account-/Security-Control-Baseline extern verifiziert.
- [x] Domain-/Threat-Reputation-Baseline extern verifiziert.
- [x] Secret-Metadaten-Abfrage versucht und Connector-Limit (`403`) dokumentiert.

## Residual Controls — nicht mehr M0-blockierend

### M1 Git Guardrails

- approving review requirement ergänzen.
- review thread resolution ergänzen.
- ggf. CODEOWNERS-/last-push-approval risikobasiert aktivieren.
- kanonisches `production`-Environment definieren.

### M3 CI Hardening

- vollständige Action-/Permission-Policy als Code erzwingen.
- privilegierte Trigger explizit verbieten/allowlisten.
- Git-Toolchain-Download kryptographisch absichern oder durch vertrauenswürdiges Runner-/Container-Image ersetzen.

### M4 Agent IAM

- providerneutrale Actor-/Agent-Identity.
- Capability Grants und Risk Gates.
- Agent darf eigenen HIGH/CRITICAL-Change nicht selbst freigeben.

### M5 Observability / Telemetry / Audit

- W3C Trace Context / OpenTelemetry Korrelation.
- unveränderbare Security-Audit-Evidence.
- Redaction vor Export.

### M6 Supply Chain

- vollständige SBOM als CI-Artefakt exportieren.
- SBOM-Digest und Build-Provenance erzeugen.
- Artifact Attestation / SLSA Mapping.

### M7 Deployment

- dediziertes Production Environment.
- kurzlebige Deployment-Identity/OIDC, soweit Render-Zielmodell dies unterstützt; andernfalls dokumentierter Secret-Bridge-Mechanismus mit Rotation.

### M8 Agent Cutover

- produktive AI-Agent-Ausführung nur über Agent Control Plane und Capability Policy.

### M9 Assurance

- Negative Tests, Incident/Break-Glass Drill, Traceability-Abschluss und unabhängige Kontrollprüfung.

## Freeze Point

Die Baseline für M0 ist der beobachtete `main`-SHA:

`f615cf4062f60eff07772c948c461025729a89dd`

Spätere Änderungen werden als Delta gegen diesen Freeze Point oder einen explizit aktualisierten Baseline-Snapshot betrachtet.
