# FT-6A Migration Ledger Recovery — Post-Mutation Evidence

**Date:** 2026-08-28  
**Project:** `AIFINANCIAL`  
**Roadmap:** `FT-CORE-CRYPTO-01` / FT-6A  
**ADR:** `ADR-0099`  
**Repository PR:** #574  
**Merge commit:** `27b4d6baa7ceec954b5d91a83e240e47447a998b`  
**Recovery migration:** `20260827135000_fintech_core_ft6a_order_intent_reconciliation_ledger_recovery.sql`  
**Status:** VERIFIED / CLOSED

## 1. Purpose

PR #574 aligned the repository FinTechCore migration ledger to the already-existing production migration history and represented the missing FT-6A persistence prerequisites as one reviewed recovery migration. The production mutation was deliberately performed only after merge and after exact-head CI/Governance passed.

No FT-7, exchange, custody, wallet, scoring, risk-approval or execution authority was introduced.

## 2. Applied production state

The reviewed FT-6A recovery SQL was applied to `AIFINANCIAL` after PR #574 merged. The Supabase MCP Management API generated an execution-time migration version when applying the reviewed migration. Because the repository contract requires the exact canonical version `20260827135000`, the single newly-created migration-history row was then repaired transactionally to that version without re-running SQL or changing the migration name/statements.

Final ledger entry:

```text
version = 20260827135000
name    = fintech_core_ft6a_order_intent_reconciliation_ledger_recovery
```

The transient generated version is no longer present.

This is equivalent in intent to Supabase migration-history repair: only the tracking identity was corrected after the schema SQL had already been applied successfully.

## 3. Schema verification

All required FT-6A additions were verified present on `fintech_core.order_intents`:

```text
binding_version
client_order_id
risk_decision_id
risk_decision_output_hash
compliance_decision_id
compliance_decision_output_hash
```

Required indexes verified:

```text
order_intents_client_order_id_unique_idx
order_intents_risk_decision_idx
order_intents_compliance_decision_idx
```

Required foreign keys verified:

```text
order_intents_risk_decision_fkey
order_intents_compliance_decision_fkey
```

Both foreign keys reference the existing append-only `fintech_core.decision_records` authority.

## 4. RPC / least-privilege verification

Verified functions:

```text
public.fintech_core_append_bound_order_intent_v1
public.fintech_core_append_reconciliation_record_v1
```

For both functions:

```text
SECURITY DEFINER = false
service_role EXECUTE = true
anon EXECUTE = false
authenticated EXECUTE = false
PUBLIC EXECUTE = false
```

The functions therefore remain `SECURITY INVOKER` and service-role-only.

## 5. Advisor and log verification

Security Advisor after the mutation reported no new FT-6A-specific finding. The only current security warning is the independent account-level finding that leaked-password protection is disabled.

Performance Advisor reported informational findings only. Newly created FT-6A indexes are currently reported as unused, which is expected immediately after creation and is not evidence that they should be removed.

Postgres logs contained no migration error. The Management API wraps migration execution in a transaction while the reviewed SQL also contains explicit `BEGIN`/`COMMIT`; PostgreSQL therefore emitted non-fatal transaction-state warnings. The migration completed, the final ledger is correct, and all post-mutation object/privilege checks passed.

## 6. Security and authority closure

The following invariants remain true:

- no browser role gained access to private FinTechCore persistence;
- FT-5 remains the only risk/compliance approval authority;
- `public.outbox_jobs` remains the queue/lease authority;
- no additional ledger, queue or persistence authority was created;
- no real capital movement was enabled;
- `GUARDED_LIVE` and `PRODUCTION` remain fail-closed;
- FT-7 remains blocked pending its separate architecture/security decision.

## 7. Closure

`FT6A-MIGRATION-LEDGER-RECOVERY-2026-08-28` is released/non-exclusive. The FT-6A repository-to-production migration-ledger blocker is closed.

The next Crypto roadmap scope is P1-A transaction-simulation coverage/freshness and independent known-positive/negative validation evidence.
