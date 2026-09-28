# OPS-OWNER-AUTH-SERVICE-ROLE-GRANTS-01

**Issue:** #1487  
**Project:** `CAPITAL-AI-OPS`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Supporting PVC:** `PVC-08 — Production Operations`  
**Baseline:** `main@73bdf0c295a5f23754d9a088891e17b6c8cbe349`  
**State:** `IMPLEMENTED_ON_BRANCH / PROVIDER_APPLY_HELD / EXACT_HEAD_VALIDATION_REQUIRED`

## Ziel

Die auf CURRENT_MAIN vorhandene Owner-Authorization-Persistenz mit den minimal notwendigen
PostgreSQL-Tabellenrechten für den privilegierten `service_role`-Serverpfad ausstatten,
ohne Browser-Zugriff, RLS-Abschwächung oder eine zweite Autorisierungsgrenze einzuführen.

## Consumer-Matrix

| Tabelle | Direkter Serverpfad | Erforderliche Tabellenrechte |
|---|---|---|
| `owner_device_credentials` | Registrierung, Auth-Challenge, Revocation | `SELECT, INSERT, UPDATE` |
| `owner_authorization_challenges` | Enrollment/Auth Challenge erzeugen, lesen, konsumieren | `SELECT, INSERT, UPDATE` |
| `adr0104_owner_sessions` | Slot-Precheck | `SELECT` |
| `owner_authorization_evidence` | nur bestehendes SECURITY-DEFINER-RPC | keine direkten `service_role`-Tabellenrechte |
| `owner_authorization_consumptions` | nur bestehendes SECURITY-DEFINER-RPC | keine direkten `service_role`-Tabellenrechte |

`DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` und `ALL PRIVILEGES` sind nicht erforderlich.

## Umsetzung

- Neue additive Migration `supabase/migrations/20260928055300_owner_authorization_service_role_least_privilege.sql`.
- Alle fünf Tabellen werden zunächst für `PUBLIC`, `anon`, `authenticated` und
  `service_role` auf null direkte Rechte normalisiert.
- Anschließend werden ausschließlich die drei oben dokumentierten Grant-Sätze vergeben.
- Das vorhandene `consume_adr0104_owner_authorization(...)`-RPC bleibt für atomare
  Evidence-/Consumption-/Session-Schreibvorgänge zuständig.
- Keine RLS-Policy wird erweitert oder hinzugefügt.

## Provider-Grenze

Dieser Slice verändert ausschließlich das Repository. Die Anwendung der Migration in
Supabase Production sowie der Live-Readback von `information_schema.role_table_grants`,
RLS und Security Advisor bleiben **separat autorisierte Provider-Mutationen/Evidence**.

## Exit Evidence

- Exact-head Tests/CI/Governance/Security PASS.
- Human/CODEOWNER Merge.
- Danach: separat autorisierte Provider-Anwendung der neuen Migration.
- Live Readback beweist exakt die Consumer-Matrix und weiterhin null Browser-DML.
- Erst nach Provider-Readback kann Issue #1487 terminal geschlossen werden.


## Migrations-Ledger-Projektion

Der bestehende read-only Provider-Snapshot bleibt bei 78 Remote-Migrationen. Die neue
Repository-Migration wird ausschließlich als zusätzlicher `local_only`-Eintrag geführt;
`local_total=86` und `local_only=8`. Das ist keine Behauptung, dass die Migration bereits
in Supabase Production angewendet wurde.
