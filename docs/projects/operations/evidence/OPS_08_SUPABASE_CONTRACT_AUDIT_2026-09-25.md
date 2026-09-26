# OPS-08 Supabase Contract / IAM / Schema / Data-Readiness Audit — 2026-09-25

**Project:** `CAPITAL-AI-OPS`  
**Alias:** `OPS`  
**PVC:** `PVC-08 — Production Operations`  
**Canonical folder:** `docs/projects/operations/`  
**Provider project:** `AIFINANCIAL / ryzywoktpmyhwzxmstyu`  
**Maintenance state:** `FREE_TIER_PAUSE_RESTORE_COMPLETED / ACTIVE_HEALTHY / POST_READBACK_COMPLETE`

## Live pre-maintenance evidence

| Control | Observed state | Assessment |
|---|---|---|
| PostgreSQL | 17.6 / Supabase bundle 17.6.1.127 | healthy before maintenance |
| Database size | ~86 MiB | low absolute size, but cron history dominates |
| Replication slots | 0 | upgrade prerequisite PASS |
| Unsupported PG17 extensions | none enabled among timescaledb/plv8/plcoffee/plls/pgjwt | upgrade prerequisite PASS |
| App tables | 47 across public + fintech_core | bounded current schema |
| RLS | enabled on all checked app tables | PASS |
| Primary keys | present on all checked app tables | PASS |
| Invalid app indexes | 0 | PASS |
| SECURITY DEFINER | 21 app-schema functions; 0 executable by PUBLIC | PASS for PUBLIC exposure check |
| Login roles | only Supabase-managed/system login roles observed | no custom-role password restore burden observed |
| Storage | 1 private bucket / 0 objects | no object malware surface currently populated |
| Security Advisor | leaked-password protection WARN | plan-constrained Free-tier control; alternative application mitigation remains required |
| Performance Advisor | 2026-09-26 readback: prior Stripe managed-webhook FK warning resolved; 3 owner-auth/device FK INFO findings + 4 social-media RLS initplan WARN findings remain | owner-correct follow-up; no ad-hoc DDL in this recovery slice |
| pg_cron history | ~81k rows / ~55 MiB | archive/retention required |
| Security events, 7d | 207 suspicious_request events, all blocked | control active; origin/routing anomaly requires correlation, not malware attribution |

## Security event interpretation

Every inspected seven-day `suspicious_request` event was blocked and carried the same
reason: `Blocked CORS Origin: https://mta-sts.capital-ai.online`. Twelve source IPs were
observed. This is evidence of rejected requests and a probable routing/origin anomaly or
external probing pattern. It is **not evidence that malware is present** in Supabase.

The highest-value follow-up is to keep `mta-sts.capital-ai.online` isolated from the
application origin and correlate future blocked requests by endpoint, source and rate.
The automated daily security-posture snapshot introduced by this slice detects structural
database regressions but does not pretend to be endpoint malware detection.

## Edge Function authentication contracts

All three current Stripe Edge Functions use `verify_jwt=false`, but live code readback
showed explicit alternative controls:

| Function | Alternative control |
|---|---|
| stripe-setup v8 | Bearer setup secret resolved from Supabase Vault; missing/mismatch => 401/403 |
| stripe-webhook v9 | requires `stripe-signature`; Stripe constructEventAsync validates signature |
| stripe-worker v8 | Bearer `stripe_sync_worker_secret` resolved from Vault; missing/mismatch => 401/403 |

This closes the old inventory question at implementation/readback level. It does not replace
an external end-to-end Stripe delivery test.

## Schema / FK / contract posture

The current database preserves the main architecture boundaries:

- `fintech_core` is private durable traceability/evidence storage and exposes controlled
  SECURITY INVOKER RPCs rather than a new public table authority.
- `public.outbox_jobs` remains the existing queue/lease authority; this slice creates no
  second queue.
- Data API / RLS and server-side IAM remain distinct: RLS prevents row access, while server
  authorization decides who may invoke privileged product functions.
- Existing migrations include dedicated FinTech traceability/FK-index work and the Stripe
  managed-webhooks account-FK index migration. Fresh 2026-09-26 provider readback confirms
  remote migration `20260924171500_index_stripe_managed_webhooks_account_fk`; the former
  Stripe FK advisor finding is no longer present.

No unused index is removed from an advisor hint alone. Index deletion requires measured
query/index usage and owner-correct migration evidence.

## 1,000-asset readiness

Target universe for the first phase:

`CRYPTO + EQUITIES + FOREX + COMMODITIES + INDICES`

Bonds remain outside the initial store.

The current repository has real provider/history gateways, provider/evidence/Data-Quality
contracts, FinTech durable traceability and protected Backtest authorization. However,
current analysis inventories still mark quantitative history/backtesting as
`COMPATIBILITY_ONLY` or blocked until canonical verified OHLCV/history is available.

### Recommended storage boundary

```text
Provider ingress / Tier 1
  -> normalization + DQ / Tier 2
  -> hot fan-out/cache / Tier 3
  -> canonical append-only Parquet history in object storage
  -> DuckDB research/backtesting
  -> optional measured-scale hot analytics DB
  -> Supabase dataset manifests / provenance / DQ / run metadata / scores / user state
  -> API/UI
```

Supabase Free/Nano is adequate for the current control-plane footprint, not for making raw
historical bars/ticks the same OLTP workload as users/auth. Promotion beyond Nano should be
triggered by measured connection pressure, database size, latency or revenue—not merely by
the theoretical 1,000-asset universe.

## Post-maintenance gates

1. Provider state returns `ACTIVE_HEALTHY`.
2. PostgreSQL/Supabase bundle version is read back and compared to pre-state.
3. Migration ledger, app table/RLS/PK/integrity and cron counts are re-read.
4. Security + Performance Advisors and Edge Functions are re-read.
5. Auth/Realtime/Stripe/Render application-path validation is correlated before declaring
   the maintenance complete.

Until all five are evidenced, maintenance remains `IN_PROGRESS`.


## Post-maintenance readback

The provider returned to `ACTIVE_HEALTHY`. Database bundle/version remained
`17.6.1.127 / PostgreSQL 17.6`; the Free-tier restore therefore refreshed the project but
did not apply a newer minor bundle.

Five validation gates:

1. **Provider identity/state:** PASS — same project ref/region and `ACTIVE_HEALTHY`.
2. **Database invariants:** PASS — 47 app tables, RLS-off=0, no-PK=0,
   invalid app indexes=0, replication slots=0, custom login roles=0.
3. **Security boundary:** PASS_WITH_KNOWN_WARN — 0 PUBLIC-executable SECURITY DEFINER
   functions; Storage remains private/empty; the only Security Advisor warning remains
   leaked-password protection disabled.
4. **Runtime contracts:** PASS — Stripe Edge Functions remain ACTIVE at setup v8,
   webhook v9 and worker v8; 78 remote migrations remain readable.
5. **Performance/ledger:** PASS for the previously observed Stripe migration drift —
   fresh 2026-09-26 provider readback includes
   `20260924171500_index_stripe_managed_webhooks_account_fk`, and the prior
   `stripe._managed_webhooks.fk_managed_webhooks_account` advisor finding is gone.
   New unrelated advisor findings remain owner-correct follow-up: three unindexed FKs in
   `owner_authorization_evidence` / `owner_device_credentials`, four RLS initplan
   performance warnings on social-media tables, plus unused-index INFO findings. None is
   silently remediated inside this recovery slice.

Fresh 2026-09-26 database size is ~92.0 MB and `cron.job_run_details` is 83,821 rows /
~59.2 MB. No cron rows were deleted by the provider maintenance. Weekly encrypted archive
and retention remain intentionally gated behind merged recovery code plus verified
GitHub+Google-Drive off-site copies.
