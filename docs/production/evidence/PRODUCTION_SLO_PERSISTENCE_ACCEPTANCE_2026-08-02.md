# CAPITAL-AI — Production SLO Persistence Acceptance Record

- **Record ID:** `PROD-SLO-PERSISTENCE-ACCEPTANCE-2026-08-02`
- **Record Version:** `1.0.0`
- **Platform Version:** `0.6.0`
- **Date:** `2026-08-02`
- **Environment:** Production
- **Status:** **ACCEPTED / CLOSED**
- **Final Readiness Status:** `PRODUCTION_SLO_PERSISTENCE_READY`
- **Classification:** Production Acceptance Evidence
- **Source of Truth Migration:** `supabase/migrations/20260802160000_screening_slo_evidence.sql`
- **Production Sink:** `server/screeningSloSupabaseSink.ts`
- **Related Merge:** PR `#50`, merge commit `7f33f9c2f311dbb7e31cb26dadeee5bedb76abb3`

## 1. Purpose

This record closes the production acceptance lifecycle for persistent Screening SLO Evidence.
It persists the successful completion result of the controlled production migration and links
that result to the repository artifacts that define the schema and production sink.

The controlled migration execution completed with the explicit final status:

`PRODUCTION_SLO_PERSISTENCE_READY`

Before this record was created, a renewed GitHub repository search did not find that exact
completion status as a versioned repository artifact. This record closes that auditability gap;
it does not re-run the production database migration and does not modify Supabase, Render,
Stripe, scoring algorithms, frontend code, or existing SLO evidence.

## 2. Acceptance Basis

The acceptance is based on two evidence classes:

1. **Controlled production execution evidence** — the migration/validation procedure defined for
   `20260802160000_screening_slo_evidence.sql` completed successfully and returned
   `PRODUCTION_SLO_PERSISTENCE_READY`.
2. **Repository evidence** — the production repository contains the migration, the persistent
   `SupabaseScreeningSloSink`, the security constraints and the merged implementation history.

The production execution result is recorded here as acceptance evidence. This GitHub closure did
not independently repeat destructive or mutation-based database tests.

## 3. Repository Evidence

### 3.1 Migration

`supabase/migrations/20260802160000_screening_slo_evidence.sql` defines:

- `public.screening_slo_evidence`
- UUID primary key with `gen_random_uuid()`
- the `HEALTHY`, `DEGRADED`, `UNAVAILABLE`, `NO_RUNTIME_EVIDENCE` state constraint
- non-negative `quote_age_ms` constraint
- `score_impact_enabled = false` database constraint
- `hard_screening_block_enabled = false` database constraint
- JSONB `reasons` and `evidence`
- indexes for `observed_at`, `correlation_id`, `symbol`, and `state`
- partial symbol index with `symbol IS NOT NULL`
- Row Level Security
- no public/authenticated client write policy in the migration
- append-only mutation prevention function
- `BEFORE UPDATE OR DELETE` append-only trigger

### 3.2 Production sink

`server/screeningSloSupabaseSink.ts`:

- writes server-side only
- requires a privileged Supabase server key
- writes to `screening_slo_evidence`
- maps the SLO contract fields to the production schema
- does not claim `persisted: true` after a failed database write
- does not use a local-file or synthetic persistence fallback

### 3.3 Integration history

PR `#50` merged the persistent production SLO sink and append-only migration into `main`.
The merge commit is:

`7f33f9c2f311dbb7e31cb26dadeee5bedb76abb3`

## 4. Production Readiness Matrix

| Check | Status | Acceptance Evidence |
|---|---|---|
| Migration present | PASS | Migration exists in production repository |
| Production Supabase unambiguous | PASS | Controlled production migration execution completed with READY status |
| Table created | PASS | Controlled production execution result |
| Columns complete | PASS | Controlled production execution result + repository migration definition |
| Constraints active | PASS | Controlled production execution result + repository migration definition |
| Indexes active | PASS | Controlled production execution result + repository migration definition |
| RLS active | PASS | Controlled production execution result + repository migration definition |
| Client write policies excluded | PASS | Controlled production execution result + migration grants no client write policy |
| Service write possible | PASS | Controlled write validation completed in production execution |
| UPDATE blocked | PASS | Controlled append-only validation completed in production execution |
| DELETE blocked | PASS | Controlled append-only validation completed in production execution |
| `score_impact_enabled=true` blocked | PASS | Controlled constraint validation completed in production execution |
| `hard_screening_block_enabled=true` blocked | PASS | Controlled constraint validation completed in production execution |
| Backend schema compatible | PASS | `SupabaseScreeningSloSink` field mapping matches migration schema |

## 5. Controlled Validation Marker

The production validation procedure specifies one successful append-only marker:

- `correlation_id = migration-validation-test`
- `evidence.type = migration-validation`

Because the table is intentionally append-only, this record does not attempt to delete or modify
that marker.

## 6. Security and Governance Closure

The accepted architecture preserves these boundaries:

- SLO evidence cannot modify canonical asset scores.
- `score_impact_enabled` remains database-enforced `false`.
- `hard_screening_block_enabled` remains database-enforced `false`.
- browser/anonymous/authenticated clients receive no write permission from this migration.
- SLO evidence is append-only after insertion.
- privileged persistence remains a server-side responsibility.

No secrets, Supabase keys, connection strings or privileged credentials are stored in this record.

## 7. Versioning Consequence

This acceptance closes a production capability within platform version `0.6.0`.
It **does not by itself trigger a platform version increment**. Platform version changes are
release decisions governed by `ADR-0030 — Platform Version and Release Lifecycle`.

## 8. Closure Decision

All critical acceptance checks defined by the production migration procedure completed with PASS
and the reported final status is `PRODUCTION_SLO_PERSISTENCE_READY`.

Therefore:

**Production SLO Persistence is accepted and this work package is CLOSED.**

Future schema or persistence-contract changes require a new migration, new validation evidence,
and a new or superseding acceptance record rather than rewriting this historical acceptance
outcome.
