# ADR-0059 — Agent Execution Audit and OpenTelemetry Correlation

Status: PROPOSED — M5 PLAN / PRE-MUTATION
Date: 2026-08-11
Last updated: 2026-08-12

## Decision
Every AI-assisted command is correlated end-to-end with `request_id`, `trace_id` and attributable actor/agent identity. OpenTelemetry and W3C Trace Context are the preferred neutral correlation standards. Security audit evidence is a separate durability/retention class from sampled operational telemetry.

Minimum audit fields: human_actor_id, app_id, agent_id, provider/model metadata, intent, scope, capability, risk_class, policy_id/version, authorization decision, approval/step-up reference, tool/command, repository/branch/commit/PR, CI run, artifact digest, deployment/runtime identity, result/error, rollback reference and timestamps.

## M5 architecture decision

M5 MUST extend the existing ADR-0056 / `src/platform/Telemetry` baseline and MUST NOT introduce a second logging stack.

Operational Telemetry:
- remains vendor-neutral in `src/platform/Telemetry`;
- may be sampled/exported later;
- carries request/trace/span correlation and an optional audit reference;
- MUST NOT become the durable security-audit store.

Security Audit Evidence:
- receives a dedicated durable append-only persistence path;
- MUST support reconstruction of an authorized AI-assisted change across actor, agent, policy, PR/CI and runtime evidence;
- MUST be redacted before persistence;
- MUST NOT store secrets, tokens, complete prompts, complete diffs or raw sensitive request bodies.

## Supabase persistence decision

Read-only repository and production-schema assessment on 2026-08-12 found that existing `audit_logs_iam`, `iam_access_log` and `agent_action_approvals` do not carry the full ADR-0059 correlation contract. No dedicated agent execution audit table exists.

Therefore the M5 Supabase mutation is classified **REQUIRED**.

Target: one dedicated append-only `public.agent_audit_events` table with deny-by-default client access. The exact DDL is intentionally NOT executed by this planning PR. Authority for the mutation sequence is `docs/runbooks/M5_SUPABASE_AGENT_AUDIT_MUTATION.md`.

## Security

1. Redaction occurs before persistence/export.
2. Secrets/tokens/full prompts/full diffs are prohibited by default.
3. `anon` and `authenticated` MUST NOT gain general access to the audit store.
4. UPDATE/DELETE of durable evidence MUST fail closed in normal operation.
5. Audit correlation IDs are metadata, not authorization credentials.
6. W3C `traceparent` / `tracestate` are treated as untrusted inbound context and validated at trust boundaries.
7. Operational telemetry retention/sampling MUST NOT delete or weaken required audit evidence.

## Mutation gate

Required order:

`PLAN PR → OWNER APPROVAL → PRE-MUTATION BASELINE TEST → SUPABASE MUTATION → RLS/PERMISSION/APPEND-ONLY NEGATIVE TESTS → REDACTED WRITE/READ TEST → SECURITY ADVISOR → EVIDENCE → ROADMAP PASS`

M6 remains blocked until all M5 mutation and verification evidence is `VERIFIED PASS`.

## Rollback

Before productive audit data exists, a failed deployment may remove the new table/policies/triggers and restore the captured pre-mutation schema state. After productive evidence exists, destructive rollback is forbidden without separate Owner approval; writers are disabled first and evidence preserved.

## Verification

M5 is complete only when traceability tests can reconstruct an authorized change from request through runtime verification without exposing secrets, and Supabase verification proves:
- intended schema only;
- RLS/least privilege;
- append-only behavior;
- synthetic redacted event write/read;
- negative rejection of forbidden mutations;
- Security Advisor review;
- rollback readiness.
