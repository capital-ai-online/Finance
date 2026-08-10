# Supabase Security Evidence

Stand: 2026-08-10
Projekt: `AIFINANCIAL` / `ryzywoktpmyhwzxmstyu`
Region: `eu-west-1`
Status: `ACTIVE_HEALTHY`
PostgreSQL: 17.6.1 / Engine 17

## RLS-Inventar

Der Plugin-Snapshot zeigt RLS als aktiviert für alle sichtbaren Tabellen im Schema `public`, darunter `users`, `usage_log`, `subscriptions`, `profiles`, IAM-/Step-up-/Break-glass-Tabellen, `security_events`, `compliance_*`, `score_snapshots`, `stripe_event_inbox`, `capability_grants` und `agent_action_approvals`.

RLS-Aktivierung allein beweist noch nicht die fachliche Korrektheit jeder Policy. M1/M4 müssen daher Ownership-Prädikate, `USING`/`WITH CHECK`, Service-Role-Grenzen, Views und privilegierte Funktionen separat prüfen.

## Security Advisor

Aktuelle Warnungen:

1. `auth_leaked_password_protection`: Leaked Password Protection ist deaktiviert.
2. `auth_insufficient_mfa_options`: Es sind zu wenige MFA-Optionen aktiviert.

## Zielkontrollen

- Keine Autorisierung über user-editierbare `user_metadata`.
- Autorisierungsdaten nur über vertrauenswürdige Claims/App-Metadata oder serverseitige Capability-Entscheidungen.
- Kein `service_role`/Secret Key im Client.
- Exponierte Tabellen: RLS plus fachlich enge Policies.
- UPDATE-Policies: `USING` und `WITH CHECK`.
- `SECURITY DEFINER` nur begründet, nicht als Permission-Workaround.
- Agentenrechte über explizite `capability_grants`; keine Wildcards.
- Approval-Artefakte einmalig und an Plan-/Request-Hash binden.

## Priorität

Die beiden Auth-Advisor-Warnungen werden als HIGH für IAM-Hardening klassifiziert. Änderungen an produktiver Auth-Konfiguration erfolgen nicht in M0, sondern nach dokumentierter Freigabe.