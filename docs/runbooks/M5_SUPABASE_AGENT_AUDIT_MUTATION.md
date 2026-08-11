# M5 Supabase Agent Audit Mutation Runbook

Status: PRE-MUTATION / HUMAN APPROVAL REQUIRED
Date: 2026-08-12
Target: Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)

## Scope

Diese Mutation darf ausschließlich die M5-Audit-Persistenz für ADR-0059 einführen. Keine Stripe- oder Render-Mutation. Keine Änderung produktiver Billing-Logik.

## Zielzustand

Eine dedizierte append-only Tabelle `public.agent_audit_events` speichert redigierte Agent-/Command-Audit-Evidence. Operational Telemetry verbleibt in `src/platform/Telemetry`.

Mindestfelder:
- `id uuid`
- `occurred_at timestamptz`
- `request_id text`
- `trace_id text`
- `span_id text`
- `human_actor_id uuid nullable`
- `app_id text`
- `agent_id text`
- `provider text nullable`
- `model text nullable`
- `intent text`
- `scope jsonb`
- `capability text`
- `risk_class text`
- `policy_id text nullable`
- `policy_version text nullable`
- `authorization_decision text`
- `approval_reference uuid nullable`
- `step_up_reference uuid nullable`
- `tool_name text nullable`
- `repository text nullable`
- `branch text nullable`
- `commit_sha text nullable`
- `pull_request_number bigint nullable`
- `ci_run_id text nullable`
- `artifact_digest text nullable`
- `deployment_id text nullable`
- `runtime_version text nullable`
- `result text`
- `error_code text nullable`
- `rollback_reference text nullable`
- `attributes jsonb`

Verbotene Payloads: Secrets, Tokens, private Schlüssel, vollständige Prompts, vollständige Diffs, Request-Bodies mit PII.

## Pre-Mutation Gate

Vor Ausführung müssen alle Punkte PASS sein:
1. Planungs-PR ist vom Owner `SvenKulessa` vollständig reviewed und freigegeben.
2. Tabelle `agent_audit_events` existiert noch nicht.
3. aktuelle Audit-/IAM-Tabellen und Policies wurden als Baseline exportiert.
4. Migration ist idempotenz-sicher bzw. fail-closed bei vorhandenen Objekten.
5. RLS/Grants sind deny-by-default gegenüber `anon` und `authenticated` geplant.
6. Append-only-Negativtest ist definiert.
7. Rollback-SQL liegt vor.

## Mutation

Die eigentliche DDL wird erst im nachgelagerten M5-Mutationsschritt über das Supabase-Plugin angewendet. Keine DDL aus einem Development-Branch direkt gegen Produktion ohne dieses Gate.

## Post-Mutation Verification

Pflichtprüfungen:
1. Tabelle/Spalten/Constraints entsprechen dem freigegebenen Schema.
2. RLS ist aktiviert.
3. `anon` und `authenticated` besitzen keine direkten Schreib-/Leserechte auf Audit-Evidence.
4. ein redigiertes synthetisches Testevent kann über den vorgesehenen Server-/Service-Pfad geschrieben und korreliert gelesen werden.
5. UPDATE und DELETE werden fail-closed abgelehnt.
6. verbotene Felder werden vom Applikationsvertrag/redaction layer abgewiesen bzw. entfernt.
7. Supabase Security Advisor wird nach DDL erneut ausgeführt.
8. Evidence enthält Vorher/Nachher-Zustand, Actor, Timestamp und Verification Result.

## Rollback

Rollback wird nur bei fehlgeschlagener oder inkonsistenter Verifikation ausgeführt.

Vor produktiver Nutzung ohne relevante Daten:
- `agent_audit_events` samt zugehörigen Triggern/Policies kontrolliert entfernen.

Nach produktiver Nutzung:
- kein destruktives Drop ohne separate Owner-Freigabe;
- Writer deaktivieren, Evidence sichern/exportieren, Fehlerursache beheben und neue Migration planen.

Rollback gilt erst als PASS, wenn Schema/Policies wieder dem dokumentierten Pre-Mutation-Zustand entsprechen und die Anwendung weiterhin gesund ist.

## Stop Conditions

Sofort STOP bei:
- unerwartetem bestehenden Objekt gleichen Namens;
- RLS/Grant-Abweichung;
- Möglichkeit für Clientrollen Audit-Evidence zu verändern;
- Secret/PII-Leak im Testevent;
- nicht reproduzierbarem Before/After-State;
- fehlender Owner-Freigabe.
