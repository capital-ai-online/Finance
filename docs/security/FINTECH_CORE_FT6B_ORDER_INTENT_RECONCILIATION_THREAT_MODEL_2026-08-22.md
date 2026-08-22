# FT-6B Threat Model — OrderIntent Binding & Reconciliation

## Scope

Dieses Threat Model deckt die FT-6B-Erweiterung des bestehenden `fintech_core` Persistence Boundary ab:

- kanonisches Fixed Point `atoms:string + scale:number`;
- deterministisch FT-5-gebundener `FinTechCoreOrderIntent`;
- typed Reconciliation;
- `public.fintech_core_append_order_intent_v2`;
- `public.fintech_core_append_reconciliation_record_v2`;
- `fintech_core.fixed_point_numeric_v1`.

Nicht im Scope und weiterhin blockiert:

- `GUARDED_LIVE` / `PRODUCTION`;
- reale Exchange-/Broker-Ausfuehrung;
- Wallet-/Custody-Secrets;
- neue Scoring-/Model-Registry-/Dispatcher-Authority;
- neue Queue-/Event-Journal-/Ledger-Authority.

## Schutzgueter

1. Integritaet von Risk-/Compliance-Decisions und Policy-Bindings.
2. Integritaet und Idempotenz von OrderIntent Identity/Payload.
3. Exaktheit finanzieller Quantity-/Price-Werte.
4. Append-only Traceability von Reconciliation Evidence.
5. Vertraulichkeit und Least Privilege des privaten `fintech_core` Schemas.
6. Trennung von PAPER Evidence und realer Execution Authority.

## Trust Boundaries

```text
Application Domain (unprivileged contracts)
        |
        v
server/fintechCorePersistence.ts
        |
        | service_role only
        v
public SECURITY INVOKER RPC boundary
        |
        v
private fintech_core schema
```

Der Browser, `anon` und `authenticated` sind **nicht** vertrauenswuerdig fuer direkte Finance-Persistenz.

FT-5 Decision Records sind die einzige Approval-Quelle. LLM-/Agent-Ausgaben sind keine Approval Authority.

## Relevante Bedrohungen und Kontrollen

| Threat | Angriffsweg | Kontrolle | Residual Risk |
|---|---|---|---|
| Unauthorized RPC execution | Browser/anon/authenticated ruft v2-RPC direkt | `REVOKE EXECUTE` fuer PUBLIC/anon/authenticated; nur `service_role` | Service-role compromise bleibt separater IAM/secret-management risk |
| Approval spoofing | Caller setzt `riskApproval`/`complianceApproval` selbst | Approval wird aus append-only FT-5 Decision Records abgeleitet und DB-seitig revalidiert | Fehlkonfigurierte upstream Policy kann fachlich falsche APPROVED Decision liefern; nicht FT-6 Authority |
| Decision substitution | fremde Decision ID/Hash/Policy wird an Intent gebunden | exact run/trace/correlation/module/asset/decisionVersion + output hash + policy ID/version + timestamps | Upstream decision store compromise |
| Replay with changed payload | gleiche Identity, andere Quantity/Bounds/Policy | deterministic idempotency/clientOrder/intent hash; collision with changed payload -> reject | Hash primitive compromise als theoretischer Rest-Risk |
| Binary floating-point drift | JS `number` wird Financial Authority | kanonisches Fixed Point, BigInt/decimal normalization; DB helper validiert atoms/scale | Legacy numeric compatibility fields muessen als Projection behandelt werden |
| Invalid fixed-point payload | malformed atoms/scale/negative/zero | Domain normalization + DB `fixed_point_numeric_v1` fail-closed | extrem grosse numerische Payloads bleiben durch PostgreSQL numeric/resource limits begrenzt |
| Stale approval | alte Decision wird wiederverwendet | Decision timestamp >= workflow start und <= intent creation; intent TTL/expiry | Clock/source timestamp integrity upstream |
| Reconciliation tampering | observed values werden manipuliert | expected/observed typed values, hashes, identity match, append-only record | Beobachtungsquelle selbst kann falsch sein; dann Evidence Authority/Provider controls erforderlich |
| Silent mismatch repair | System korrigiert Drift autonom | `MISMATCH` bleibt sichtbar; `supervisorEscalationRequired=true`; kein Auto-Repair | Human remediation kann spaeter falsch erfolgen, bleibt eigener Governance-Prozess |
| False settlement finality | PAPER wird als real settled markiert | PAPER `settlementState=NOT_APPLICABLE`; RPC rejects incompatible state | spaetere FT-7+ Settlement-Semantik benoetigt neues Threat Model/Decision |
| Parallel persistence/queue architecture | neue Tabellen/Queues umgehen kanonische Controls | bestehende Tabellen wiederverwendet; `public.outbox_jobs` bleibt Queue Authority | spaetere unreviewed Aenderungen muessen Governance Checks erkennen |
| Privilege escalation through function ownership/search_path | RPC nutzt Definer privileges oder untrusted search path | `SECURITY INVOKER`; `set search_path=pg_catalog`; explicit grants | Object-owner/DB-admin compromise ausserhalb Application Boundary |
| Evidence deletion during rollback | destruktiver DROP entfernt Audit-Trail | Disable-first Rollback Runbook; Spalten-DROP nur nach no-data proof + Owner Approval | manuelle DB-admin Aktion bleibt privilegiertes Risiko |

## Security Invariants

1. `anon` und `authenticated` besitzen kein EXECUTE auf den drei FT-6B-Funktionen.
2. `service_role` ist die einzige neue RPC-Ausfuehrungsrolle.
3. Alle drei Funktionen bleiben `SECURITY INVOKER`.
4. `fintech_core` bleibt privates kanonisches Schema.
5. `public.outbox_jobs` bleibt einzige Queue-/Lease-Authority.
6. FT-6B darf kein `GUARDED_LIVE` oder `PRODUCTION` freischalten.
7. Missing/Stale/Mismatched Evidence wird nie zu `APPROVED`, `PASS` oder `0` synthetisiert.
8. Reconciliation darf kein Auto-Repair oder Settlement-Finality erzeugen.
9. Eine gleiche Identity mit abweichendem Payload wird fail-closed abgelehnt.
10. Keine neue Runtime-/Provider-/Exchange-/Custody-Abhaengigkeit wird eingefuehrt.

## Post-Mutation Evidence

Nach Anwendung der Migration wurde verifiziert:

```text
fintech_core.fixed_point_numeric_v1
  SECURITY INVOKER = true
  anon EXECUTE = false
  authenticated EXECUTE = false
  service_role EXECUTE = true

public.fintech_core_append_order_intent_v2
  SECURITY INVOKER = true
  anon EXECUTE = false
  authenticated EXECUTE = false
  service_role EXECUTE = true

public.fintech_core_append_reconciliation_record_v2
  SECURITY INVOKER = true
  anon EXECUTE = false
  authenticated EXECUTE = false
  service_role EXECUTE = true
```

Der Supabase Security Advisor meldete keine neue FT-6B-spezifische Schwachstelle.

## Rollback

Kanonischer Ruecksetzweg:

`docs/runbooks/FINTECH_CORE_FT6B_SUPABASE_ROLLBACK.md`

Prinzip: **Disable first, preserve evidence, drop last.**

## Residual Risk / FT-7 Boundary

Der groesste verbleibende Risikoanstieg entsteht erst mit realer Execution: Exchange Credentials, Broker API, Order Acknowledgement, Partial Fill, Settlement, Custody, Withdrawal, Incident Stop und Human Approval. Diese Trust Boundaries sind in FT-6B nicht verdrahtet und muessen vor FT-7 separat modelliert und autorisiert werden.
