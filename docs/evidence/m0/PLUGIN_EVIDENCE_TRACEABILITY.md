# Plugin Evidence Traceability

Stand: 2026-08-10

| Evidence Domain | Quelle | Befund | M-Meilenstein |
|---|---|---|---|
| Repository | GitHub Plugin | privates Repo, `main` Default | M0/M1 |
| Merge-Konfiguration | GitHub Plugin | Auto-Merge aus; mehrere Merge-Methoden erlaubt | M1 |
| Production Service | Render Plugin | Docker/Frankfurt/Starter/`main` | M0/M7 |
| Deploy State | Render Plugin | SHA `f615cf...` live | M0/M5/M7 |
| Auto Deploy | Render Plugin | deaktiviert | M1/M7 |
| Supabase Health | Supabase Plugin | ACTIVE_HEALTHY | M0 |
| PostgreSQL | Supabase Plugin | 17.6.1 / Engine 17 | M0/M6 |
| RLS | Supabase Plugin | alle sichtbaren Public-Tabellen RLS-enabled | M0/M4 |
| Auth Advisor | Supabase Plugin | leaked-password protection WARN | M4 |
| Auth Advisor | Supabase Plugin | insufficient MFA WARN | M4 |
| Billing Account | Stripe Plugin | CAPITAL-AI verbunden | M0/M4 |
| Stripe Key Model | Stripe Skill/Docs | Restricted Keys bevorzugt | M4/M6 |
| Stripe Webhooks | Stripe Docs | Signatur + Idempotenz erforderlich | M3/M4 |
| Domain Reputation | Bitdefender | kein erkannter schädlicher Befund | M9 |
| Domain Reputation | Malwarebytes | unknown, nicht malicious/suspicious | M9 |
| Domain Registration | Malwarebytes WHOIS | IONOS, 2026-07-02 | M0/M9 |

## Noch nicht geschlossen

- vollständige GitHub Ruleset-/Branch-Protection-Evidence
- vollständiges Workflow-/Action-Inventar
- Secret-Metadaten nach Scope/Consumer ohne Secret-Werte
- transitive Dependency-SBOM
- OIDC Deployment Identity
- vollständige E2E Trace-Korrelation

Diese Matrix ist ein Ergänzungsartefakt und ersetzt nicht die zentrale M0 Traceability Matrix.