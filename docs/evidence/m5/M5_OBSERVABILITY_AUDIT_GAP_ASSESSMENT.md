# M5 Observability / Telemetry / Audit — Gap Assessment

Status: PLAN / PRE-MUTATION
Date: 2026-08-12
Baseline: `main@85e9b44ba604e046b7ffc9e58113a177eb0e908a`

## Ziel

M5 erweitert die bestehende Observability-Baseline aus ADR-0056 und die Agent-Korrelation aus ADR-0059, ohne einen zweiten Logging-Stack einzuführen.

## Read-only Evidence

Repository:
- `src/platform/Telemetry` existiert bereits mit `TelemetryRecord`, Request-/Trace-/Span-Kontext und Redaction.
- Operational Telemetry und Audit Evidence sind bereits konzeptionell getrennt.
- ADR-0059 verlangt Ende-zu-Ende-Korrelation für AI-assisted Commands.

Supabase-Projekt `AIFINANCIAL`:
- `audit_logs_iam` existiert, enthält aber keine vollständige Agent-/Request-/Trace-/PR-/CI-/Deployment-Korrelation.
- `iam_access_log` ist auf IAM-Zugriffsevidence fokussiert.
- `agent_action_approvals` persistiert Approval-Evidence, aber keine vollständigen Execution-Audit-Events.
- keine dedizierte `agent_audit_events`-/Telemetry-Evidence-Tabelle vorhanden.

## Gap gegen ADR-0059

Fehlend als dauerhaft korrelierbare Audit-Evidence:
- request_id / trace_id / span_id
- app_id / agent_id / provider / model
- intent / scope / capability / risk_class
- policy_id / policy_version / authorization decision
- approval / step-up reference
- repository / branch / commit / PR / CI run
- artifact digest / deployment identity / runtime version
- result / error / rollback reference

## Entscheidung

Supabase-Mutation für M5: **REQUIRED**, aber erst nach Human/Owner-Freigabe des M5-Planungs-PRs.

Minimaler Zielzustand:
1. eine dedizierte append-only Tabelle `agent_audit_events` für revisionsrelevante Agent-/Command-Evidence;
2. keine Persistenz von Secrets, Tokens, vollständigen Prompts oder vollständigen Diffs;
3. RLS/Grants deny-by-default gegenüber `anon` und `authenticated`;
4. Server-/Service-Pfad schreibt ausschließlich redigierte Evidence;
5. Operational Telemetry bleibt in `src/platform/Telemetry` und referenziert Audit-Evidence nur per ID;
6. OpenTelemetry/W3C Trace Context dienen der Korrelation, nicht als Datenbankersatz.

## Nebenbefund

Die bestehende Policy auf `agent_action_approvals` verwendet noch `auth.role() = 'service_role'`. Nach aktueller Supabase-Guidance ist `auth.role()` für Policies veraltet. Dieser Befund wird als separater IAM-Hardening-Punkt geführt und nicht ungeprüft in die M5-Mutation gemischt.

## M5 Exit

M6 bleibt blockiert, bis:
- Plan/ADR/Runbook Human-approved sind;
- Pre-Mutation-Test PASS ist;
- Supabase-Mutation durchgeführt ist;
- RLS/Permission- und Append-only-Negativtests PASS sind;
- ein synthetisches redigiertes Audit-Event geschrieben und gelesen werden kann;
- verbotene Felder nicht persistiert werden;
- Evidence und ROADMAP auf `VERIFIED PASS` aktualisiert sind.
