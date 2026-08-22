# FT-6B Supabase Rollback Runbook

## Zweck

Dieses Runbook beschreibt den sicheren Ruecksetzweg fuer die am 2026-08-22 Owner-autorisierte FT-6B-Supabase-Migration `fintech_core_ft6b_fixed_point_reconciliation` auf dem Projekt `AIFINANCIAL`.

Es ist **kein** automatischer Rollback und keine Freigabe fuer FT-7/Live-Execution.

## Scope

Betroffen sind ausschliesslich additive FT-6B-Erweiterungen an:

```text
fintech_core.order_intents
fintech_core.reconciliation_records
fintech_core.fixed_point_numeric_v1
public.fintech_core_append_order_intent_v2
public.fintech_core_append_reconciliation_record_v2
```

Nicht betroffen und nicht zu ersetzen:

```text
fintech_core.workflow_runs
fintech_core.domain_events
fintech_core.decision_records
public.outbox_jobs
```

## Rollback-Prinzip

**Disable first, preserve evidence, drop last.**

Ein Rollback darf niemals bereits persistierte OrderIntent-/Reconciliation-Evidence stillschweigend loeschen oder in Legacy-Werte zurueckkonvertieren.

## Ausloeser

Rollback pruefen bei mindestens einem der folgenden Befunde:

- v2-RPC akzeptiert eine nicht autorisierte Rolle;
- Decision-/Policy-/Identity-Bindung kann umgangen werden;
- Fixed-Point-Payload wird falsch oder nicht deterministisch persistiert;
- idempotente Replay-Semantik erzeugt Doppel- oder Drift-Records;
- Reconciliation-Mismatch wird nicht fail-closed/evident behandelt;
- produktive Anwendung erzeugt einen unerwarteten Fehler, der eindeutig auf FT-6B-Persistence zurueckzufuehren ist.

Ein reiner Dokumentations- oder Testfehler ist kein Grund fuer destruktiven Schema-Rollback.

## Verantwortlichkeit / Gate

- Owner/Human autorisiert jede externe Ruecksetzung.
- Repository-Revert und Supabase-Rollback sind getrennte Aktionen.
- Keine Agent-/LLM-Entscheidung darf eine Datenloeschung autorisieren.
- Vor jedem Rollback: aktuellen `main`, aktuellen Supabase-Migrationsstand und aktuelle v2-Nutzung pruefen.

## Phase 1 — Capability sofort deaktivieren

Wenn ein sicherheits- oder integritaetskritischer Fehler bestaetigt ist:

1. `EXECUTE` fuer `service_role` auf den beiden v2-Public-RPCs entziehen.
2. `anon` und `authenticated` muessen weiterhin ohne EXECUTE bleiben.
3. Bestehende Tabellen und Records **nicht** loeschen.
4. Anwendung auf einen letzten verifizierten Commit ohne v2-Aufrufpfad zuruecksetzen.

Zielzustand:

```text
fintech_core_append_order_intent_v2                  service_role EXECUTE = false
fintech_core_append_reconciliation_record_v2         service_role EXECUTE = false
anon/authenticated                                   EXECUTE = false
FT-7 / live execution                                weiterhin false
```

## Phase 2 — Evidence sichern und Nutzung inventarisieren

Vor jeder strukturellen Ruecknahme pruefen:

- Anzahl Records mit `order_intent_contract_version` bzw. `binding_version`;
- Anzahl Records mit `quantity_fixed`/`price_bounds`;
- Anzahl Reconciliation Records mit `reconciliation_contract_version`;
- Referenzen auf `client_order_id`, `venue_order_id`, Policy-Felder und typed Evidence;
- ob irgendein Record nach der Migration produktiv geschrieben wurde.

Wenn v2-Daten existieren, werden die additiven Spalten **nicht** automatisch gedroppt. Sie bleiben als inerte, nicht mehr beschreibbare Evidence erhalten, bis eine separate Datenmigrations-/Archivierungsentscheidung vorliegt.

## Phase 3 — Repository-Ruecksetzung

Falls der FT-6B-Code bereits gemergt wurde:

1. Human-gated `git revert` des FT-6B-Merge-Commits auf einem neuen Branch;
2. erneuter Main-/PR-Korrelationsabgleich;
3. PR nach aktueller Governance-Vorlage;
4. Hosted CI erst nach PR-Erstellung;
5. kein direkter Commit auf `main`.

Der Revert darf ADR-0087, FT-3, FT-4, FT-5, `public.outbox_jobs` oder die private `fintech_core` Authority nicht durch Parallelarchitekturen ersetzen.

## Phase 4 — Optionale Schema-Bereinigung

Nur wenn **nachgewiesen keine v2-Nutzdaten** existieren und der Owner eine destruktive Ruecksetzung explizit autorisiert:

1. v2-RPCs droppen;
2. `fintech_core.fixed_point_numeric_v1` droppen, sofern keine weitere Abhaengigkeit existiert;
3. additive FT-6B-Spalten nur nach Dependency-/Data-Check droppen;
4. keine bestehenden FT-3/FT-4/FT-5-Spalten oder Tabellen veraendern;
5. keine Migration-History manipulieren.

Wenn v2-Nutzdaten existieren, wird statt DROP eine nachgelagerte Supersession/Archivierungsentscheidung erstellt.

## Post-Rollback Verification

Pflichtpruefungen:

- `anon`/`authenticated` besitzen keine Finance-RPC-Capability;
- `service_role` besitzt nur den explizit autorisierten RPC-Scope;
- `fintech_core`-Schema bleibt privat;
- `public.outbox_jobs` bleibt einzige Queue-/Lease-Authority;
- vorhandene Evidence ist nicht verloren gegangen;
- kein `GUARDED_LIVE`/`PRODUCTION`-Pfad wurde freigeschaltet;
- Supabase Security Advisor auf neue, durch den Rollback entstandene Findings pruefen;
- Repository- und DB-Stand dokumentarisch erneut synchronisieren.

## Roll-forward bevorzugt

Bei nicht sicherheitskritischen Defekten ist ein korrigierender additiver Roll-forward gegen denselben kanonischen Contract zu bevorzugen. Ein destruktiver Rollback ist die Ausnahme, weil FT-6B append-only Traceability und auditierbare Evidence erhalten soll.
