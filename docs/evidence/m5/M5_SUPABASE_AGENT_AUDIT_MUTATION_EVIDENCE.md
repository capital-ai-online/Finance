# M5 Supabase Agent Audit Mutation Evidence

Status: VERIFIED PASS — persistence mutation
Date: 2026-08-12
Target: Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`)
Roadmap authority: ADR-0056, ADR-0059, `docs/runbooks/M5_SUPABASE_AGENT_AUDIT_MUTATION.md`

## Approved trigger

PR #206 was Human/Owner reviewed and merged as planning authority before mutation. Merge commit: `9322a7e274bfb765a5bbec71a3ce3107bde1d46c`.

## Pre-mutation baseline

- `public.agent_audit_events` did not exist.
- Existing audit authorities: `audit_logs_iam`, `iam_access_log`, `agent_action_approvals`, `agent_evaluation_runs`.
- Existing structures did not provide the complete ADR-0059 request/trace/agent/policy/PR/CI/deployment correlation contract.
- Rollback path was defined before mutation.

## Applied production migrations

1. Supabase migration `20260811230540_m5_agent_audit_events`
   - creates `public.agent_audit_events`;
   - enables RLS;
   - adds correlation indexes;
   - creates append-only UPDATE/DELETE trigger;
   - denies `anon` and `authenticated` table access;
   - initially grants server-side access.

2. Supabase migration `20260811230743_m5_agent_audit_events_least_privilege`
   - removes Supabase default extra privileges from `service_role`;
   - leaves only `SELECT` + `INSERT`.

The matching repository migration files are recorded under `supabase/migrations/`.

## Post-mutation verification

### RLS

`public.agent_audit_events` reports `relrowsecurity = true`.

### Effective table privileges

Expected/verified:

- `anon`: SELECT = false, INSERT = false;
- `authenticated`: SELECT = false, INSERT = false;
- `service_role`: SELECT = true, INSERT = true, UPDATE = false, DELETE = false.

The first verification exposed unintended Supabase default privileges (`TRUNCATE`, `TRIGGER`, `REFERENCES`) on `service_role`; the second migration removed them before M5 was accepted as PASS.

### Synthetic redacted evidence event

A synthetic, non-secret event was persisted successfully:

- id: `5e69abb1-3f50-443e-abeb-214be4a70c88`
- request_id: `m5-verification-2026-08-12`
- trace_id: `00000000000000000000000000000001`
- agent_id: `m5-verification-agent`
- repository: `SvenKulessa/Finance`
- PR reference: `206`
- result: `PASS`
- attributes: `synthetic=true`, `contains_secrets=false`

The synthetic row intentionally remains as immutable audit evidence.

### Append-only negative tests

Attempted UPDATE of the synthetic evidence row: **DENIED** with `agent_audit_events is append-only`.

Attempted DELETE of the synthetic evidence row: **DENIED** with `agent_audit_events is append-only`.

These tests were executed even through the privileged SQL path and therefore prove trigger-level fail-closed behavior in addition to the reduced `service_role` grants.

## Supabase Security Advisor

Post-DDL advisor results:

- `RLS Enabled No Policy` for `agent_audit_events`: INFO and intentional. The table is policyless deny-by-default for client roles; server access is controlled by explicit table grants plus service-role execution.
- `Leaked Password Protection Disabled`: pre-existing Auth warning; not introduced by M5.
- `Insufficient MFA Options`: pre-existing Auth warning; not introduced by M5.

The pre-existing `agent_action_approvals` policy still uses deprecated `auth.role()` semantics. This is recorded as a separate IAM maintenance item and was intentionally not mixed into the M5 observability mutation.

## Data minimization

The persisted schema forbids raw secret material by contract. Full prompts, full diffs, tokens, private keys and raw sensitive request bodies are not part of the audit schema. Application integration must apply redaction before INSERT.

## Mutation result

**Persistence mutation: VERIFIED PASS.**

M5 as a roadmap phase remains `IN PROGRESS` until the application writer is integrated and an end-to-end test proves that an authorized AI-assisted command can be reconstructed from request/trace/actor/agent/policy through PR/CI/runtime references without exposing secrets.

## Rollback state

No rollback was required because all mandatory persistence checks passed. If application integration later fails, writers must be disabled first; the audit table must not be destructively dropped once productive evidence exists without a separate Owner-approved rollback decision.
