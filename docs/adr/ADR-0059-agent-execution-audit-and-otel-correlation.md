# ADR-0059 — Agent Execution Audit and OpenTelemetry Correlation

Status: ACCEPTED — PERSISTENCE VERIFIED / APPLICATION INTEGRATION PENDING
Date: 2026-08-11
Last updated: 2026-08-12

## Decision
Every AI-assisted command is correlated end-to-end with `request_id`, `trace_id` and attributable actor/agent identity. OpenTelemetry and W3C Trace Context are the preferred neutral correlation standards. Security audit evidence is a separate durability/retention class from sampled operational telemetry.

Minimum audit fields: human_actor_id, app_id, agent_id, provider/model metadata, intent, scope, capability, risk_class, policy_id/version, authorization decision, approval/step-up reference, tool/command, repository/branch/commit/PR, CI run, artifact digest, deployment/runtime identity, result/error, rollback reference and timestamps.

## M5 architecture decision

M5 extends the existing ADR-0056 / `src/platform/Telemetry` baseline and does not introduce a second logging stack.

Operational Telemetry:
- remains vendor-neutral in `src/platform/Telemetry`;
- may be sampled/exported later;
- carries request/trace/span correlation and an optional audit reference;
- MUST NOT become the durable security-audit store.

Security Audit Evidence:
- uses dedicated durable append-only persistence;
- MUST support reconstruction of an authorized AI-assisted change across actor, agent, policy, PR/CI and runtime evidence;
- MUST be redacted before persistence;
- MUST NOT store secrets, tokens, complete prompts, complete diffs or raw sensitive request bodies.

## Supabase persistence decision

Read-only repository and production-schema assessment on 2026-08-12 found that existing `audit_logs_iam`, `iam_access_log` and `agent_action_approvals` did not carry the full ADR-0059 correlation contract. No dedicated agent execution audit table existed.

Therefore the M5 Supabase mutation was classified **REQUIRED** and has now been executed after Human/Owner approval of PR #206.

Production target: `public.agent_audit_events` in Supabase project `AIFINANCIAL` (`ryzywoktpmyhwzxmstyu`).

Applied migrations:
- `20260811230540_m5_agent_audit_events`
- `20260811230743_m5_agent_audit_events_least_privilege`

The table is append-only, RLS-enabled and deny-by-default for `anon`/`authenticated`. `service_role` is explicitly limited to `SELECT` + `INSERT`.

## Security

1. Redaction occurs before persistence/export.
2. Secrets/tokens/full prompts/full diffs are prohibited by default.
3. `anon` and `authenticated` have no direct access to the audit store.
4. UPDATE/DELETE of durable evidence fail closed via table privileges and append-only trigger.
5. Audit correlation IDs are metadata, not authorization credentials.
6. W3C `traceparent` / `tracestate` are treated as untrusted inbound context and validated at trust boundaries.
7. Operational telemetry retention/sampling MUST NOT delete or weaken required audit evidence.

## Verified production evidence

The production mutation passed:
- RLS verification;
- least-privilege verification;
- synthetic redacted event write/read;
- UPDATE negative test;
- DELETE negative test;
- Supabase Security Advisor review.

Evidence authority: `docs/evidence/m5/M5_SUPABASE_AGENT_AUDIT_MUTATION_EVIDENCE.md`.

The Advisor's `RLS Enabled No Policy` INFO is intentional for this deny-by-default table. Existing Auth warnings for leaked-password protection and MFA are independent of M5.

## Remaining M5 gate

M5 is not complete yet. Before M6 can begin, the application must:
1. provide a server-side writer for `agent_audit_events` using the existing server/service Supabase path;
2. redact prohibited payload classes before persistence;
3. bind request/trace/actor/agent/policy/tool/repository/PR/CI/runtime fields to real execution context;
4. emit `auditReference` back into operational telemetry where applicable;
5. pass unit/negative tests;
6. pass an end-to-end reconstruction test without exposing secrets.

## Rollback

No rollback was required for the persistence mutation because all mandatory post-mutation checks passed.

After productive audit evidence exists, destructive rollback is forbidden without separate Human/Owner approval. Writers are disabled first and evidence preserved before any schema remediation.

## Verification

M5 is complete only when traceability tests can reconstruct an authorized change from request through runtime verification without exposing secrets, and both persistence and application integration evidence are `VERIFIED PASS`.
